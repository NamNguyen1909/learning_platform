"""
learningapi/services/vnpay_service.py

Service Layer thuần Python cho tích hợp thanh toán VNPay.
Đóng gói toàn bộ logic: build params, ký HMAC-SHA512, sinh payment URL.
Không phụ thuộc vào Django request/response — dễ test độc lập.
"""

import hashlib
import hmac
import os
from dataclasses import dataclass, field
from datetime import datetime
from urllib.parse import quote_plus
from typing import Optional


# ---------------------------------------------------------------------------
# Data Transfer Objects
# ---------------------------------------------------------------------------

@dataclass
class VNPayConfig:
    """
    Cấu hình kết nối VNPay. Mặc định đọc từ biến môi trường.
    Có thể inject thủ công khi test (không cần mock os.environ).
    """
    tmn_code: str = field(default_factory=lambda: os.environ.get("VNPAY_TMN_CODE", ""))
    hash_secret: str = field(default_factory=lambda: os.environ.get("VNPAY_HASH_SECRET", ""))
    payment_url: str = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    return_url: str = field(default_factory=lambda: (
        os.environ.get("BACKEND_URL", "http://127.0.0.1:8000").rstrip("/")
        + "/api/vnpay/redirect/"
    ))

    def validate(self) -> None:
        """Ném ValueError nếu thiếu thông tin bắt buộc."""
        if not self.tmn_code:
            raise ValueError("VNPAY_TMN_CODE chưa được cấu hình.")
        if not self.hash_secret:
            raise ValueError("VNPAY_HASH_SECRET chưa được cấu hình.")


@dataclass
class VNPayCreateURLRequest:
    """
    Dữ liệu đầu vào để tạo payment URL.

    Attributes:
        amount:         Số tiền (VND, số nguyên). VNPay nhận amount * 100.
        txn_ref:        Mã tham chiếu giao dịch (unique, từ Payment.transaction_id).
        ip_address:     IP của client (lấy từ request.META['REMOTE_ADDR']).
        order_info:     Mô tả đơn hàng (mặc định generic).
        order_type:     Loại hàng hoá (mặc định "other").
        locale:         Ngôn ngữ trang thanh toán ("vn" hoặc "en").
        created_at:     Thời điểm tạo giao dịch (mặc định: now theo Asia/Ho_Chi_Minh).
    """
    amount: int
    txn_ref: str
    ip_address: str
    order_info: str = "Thanh toan don hang"
    order_type: str = "other"
    locale: str = "vn"
    created_at: Optional[datetime] = None

    def __post_init__(self):
        if self.amount < 0:
            raise ValueError("amount phải là số không âm.")
        if not self.txn_ref:
            raise ValueError("txn_ref không được để trống.")
        if not self.ip_address:
            raise ValueError("ip_address không được để trống.")
        if self.created_at is None:
            import pytz
            tz = pytz.timezone("Asia/Ho_Chi_Minh")
            self.created_at = datetime.now(tz)


@dataclass
class VNPayCreateURLResult:
    """Kết quả trả về từ VNPayService.create_payment_url()."""
    payment_url: str
    query_params: dict          # params gốc (không có hash), tiện debug/log
    secure_hash: str            # chữ ký đã tính


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class VNPayService:
    """
    Dịch vụ tạo URL thanh toán VNPay.

    Sử dụng:
        service = VNPayService()                      # đọc config từ env
        service = VNPayService(config=VNPayConfig(    # hoặc inject thủ công
            tmn_code="...", hash_secret="..."
        ))

        result = service.create_payment_url(VNPayCreateURLRequest(
            amount=199000,
            txn_ref="uuid-...",
            ip_address="127.0.0.1",
        ))
        # result.payment_url  →  redirect người dùng đến đây
    """

    VERSION = "2.1.0"
    COMMAND = "pay"
    CURRENCY = "VND"

    def __init__(self, config: Optional[VNPayConfig] = None) -> None:
        self._config = config or VNPayConfig()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def create_payment_url(self, req: VNPayCreateURLRequest) -> VNPayCreateURLResult:
        """
        Tạo URL thanh toán VNPay đầy đủ (bao gồm chữ ký HMAC-SHA512).

        Raises:
            ValueError: Nếu config thiếu tmn_code / hash_secret.
        """
        self._config.validate()

        params = self._build_params(req)
        secure_hash = self._sign(params)
        payment_url = self._assemble_url(params, secure_hash)

        return VNPayCreateURLResult(
            payment_url=payment_url,
            query_params=params,
            secure_hash=secure_hash,
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_params(self, req: VNPayCreateURLRequest) -> dict:
        """Tạo dict tham số gửi lên VNPay (chưa có vnp_SecureHash)."""
        return {
            "vnp_Version":   self.VERSION,
            "vnp_Command":   self.COMMAND,
            "vnp_TmnCode":   self._config.tmn_code,
            "vnp_Amount":    str(req.amount * 100),         # VNPay yêu cầu * 100
            "vnp_CurrCode":  self.CURRENCY,
            "vnp_TxnRef":    req.txn_ref,
            "vnp_OrderInfo": req.order_info,
            "vnp_OrderType": req.order_type,
            "vnp_Locale":    req.locale,
            "vnp_ReturnUrl": self._config.return_url,
            "vnp_IpAddr":    req.ip_address,
            "vnp_CreateDate": req.created_at.strftime("%Y%m%d%H%M%S"),
        }

    def _sign(self, params: dict) -> str:
        """
        Tạo chữ ký HMAC-SHA512.

        Quy tắc VNPay:
          1. Sắp xếp params theo key (alphabet).
          2. Bỏ qua key rỗng và key 'vnp_SecureHash'.
          3. Encode mỗi value bằng quote_plus (space → '+').
          4. Nối thành chuỗi key=value&... rồi HMAC-SHA512 với hash_secret.
        """
        hash_data = "&".join(
            f"{k}={self._encode(v)}"
            for k, v in sorted(params.items())
            if v and k != "vnp_SecureHash"
        )
        return hmac.new(
            self._config.hash_secret.encode("utf-8"),
            hash_data.encode("utf-8"),
            hashlib.sha512,
        ).hexdigest()

    def _assemble_url(self, params: dict, secure_hash: str) -> str:
        """Ghép query string + chữ ký thành URL thanh toán hoàn chỉnh."""
        query_string = "&".join(
            f"{k}={self._encode(v)}"
            for k, v in sorted(params.items())
            if v
        )
        return f"{self._config.payment_url}?{query_string}&vnp_SecureHash={secure_hash}"

    @staticmethod
    def _encode(value: str) -> str:
        """URL-encode theo chuẩn VNPay (quote_plus, space → '+')."""
        return quote_plus(str(value), safe="")


# ---------------------------------------------------------------------------
# Response code helper (tách ra khỏi view)
# ---------------------------------------------------------------------------

VNPAY_RESPONSE_MESSAGES: dict[str, str] = {
    "00": "Giao dịch thành công.",
    "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
    "09": "Thẻ/Tài khoản chưa đăng ký InternetBanking.",
    "10": "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.",
    "11": "Hết hạn chờ thanh toán. Vui lòng thực hiện lại giao dịch.",
    "12": "Thẻ/Tài khoản bị khóa.",
    "13": "Sai mật khẩu xác thực giao dịch (OTP).",
    "24": "Khách hàng hủy giao dịch.",
    "51": "Tài khoản không đủ số dư.",
    "65": "Tài khoản vượt quá hạn mức giao dịch trong ngày.",
    "75": "Ngân hàng thanh toán đang bảo trì.",
    "79": "Sai mật khẩu thanh toán quá số lần quy định.",
    "99": "Lỗi khác hoặc không xác định.",
}


def get_vnpay_response_message(code: str) -> str:
    """Trả về mô tả kết quả giao dịch theo mã VNPay."""
    return VNPAY_RESPONSE_MESSAGES.get(code, "Lỗi không xác định.")