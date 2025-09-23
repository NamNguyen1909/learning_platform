from django.db.models import F
from ..models import Chunk
from openai import OpenAI
import numpy as np
from pgvector.django import CosineDistance
import os


import google.generativeai as genai

# --- Embedding ---
# OpenAI text-embedding-ada-002: 1536 chiều.
# OpenAI text-embedding-3-large: 3072 chiều.
# HuggingFace all-MiniLM-L6-v2: 384 chiều.

#OpenAI
# def get_embedding(text: str) -> np.ndarray:
#     """
#     Sinh embedding cho text bằng OpenAI.
#     """
#     client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
#     response = client.embeddings.create(
#         input=text,
#         model="text-embedding-3-large"  # nên dùng model mới, chuẩn hơn
#     )
#     return np.array(response.data[0].embedding, dtype=np.float32)

# HuggingFace (dev mode)
def get_embedding(text: str) -> np.ndarray:
    """
    Sinh embedding cho text bằng HuggingFace (dev mode).
    """
    # Dùng mô hình nhẹ, phổ biến cho dev
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    emb = model.encode(text)
    return np.array(emb, dtype=np.float32)

# Google Generative AI (Gemini)
# def get_embedding(text: str) -> np.ndarray:
#     """
#     Sinh embedding cho text bằng Gemini (Google Generative AI).
#     """
#     genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
#     # Đúng cách: gọi trực tiếp genai.embed_content
#     response = genai.embed_content(
#         model="models/embedding-001",
#         content=text,
#         task_type="retrieval_document"  # hoặc "retrieval_query" nếu là câu hỏi
#     )
#     emb = response["embedding"]
#     return np.array(emb, dtype=np.float32)

# --- RAG main ---
def generate_ai_answer(course, question: str, allow_web: bool = False, history=None):
    """
    Sinh câu trả lời từ AI Tutor cho 1 course cụ thể.
    - history: list các dict {"question": ..., "answer": ...}
    - always trích nguồn: nếu từ document thì ghi title, nếu từ internet thì ghi link
    """
    q_emb = get_embedding(question)
    chunks = (
        Chunk.objects
        .filter(course=course)
        .annotate(distance=CosineDistance("embedding", q_emb))
        .order_by("distance")[:10]
    )

    # 1. Chuẩn bị context và nguồn
    if not chunks.exists():
        context = "Không tìm thấy tài liệu nào liên quan trong khoá học."
        sources = []
    else:
        context = "\n\n".join(c.text for c in chunks)
        sources = [c.document.title for c in chunks]

    # 2. Lịch sử hội thoại
    history_prompt = ""
    if history:
        for turn in history:
            history_prompt += f"\nHọc viên: {turn['question']}\nAI: {turn['answer']}\n"

    # 3. Prompt cho AI: luôn yêu cầu trích nguồn
    prompt = f"""
Bạn là AI tutor cho khóa học "{course.title}".
Lịch sử hội thoại trước đó:
{history_prompt}
---
{context}
---

Câu hỏi của học viên: {question}

Yêu cầu:
- Chỉ trả lời dựa trên tài liệu của khoá học nếu có thông tin liên quan.
- Nếu trả lời dựa trên tài liệu, hãy ghi rõ nguồn bằng tiêu đề tài liệu (VD: "Nguồn: {', '.join(sources) if sources else '[không có]'}").
- Nếu tài liệu không có thông tin, hãy nói rõ "Tài liệu chưa đề cập, tôi sẽ tìm trên internet cho bạn." và tự động tìm kiếm trên internet, trả lời ngắn gọn, dễ hiểu, kèm đường link nguồn tham khảo.
- Luôn trả lời bằng tiếng Việt, văn phong thân thiện, dễ hiểu.
- Luôn ghi rõ nguồn tham khảo cuối câu trả lời.
    """

    # 4. Gọi GPT

    #dev mode với LM Studio
    # client = OpenAI(
    #     base_url="http://localhost:1234/v1",
    #     api_key="lm-studio"  # dummy key
    # )

    # resp = client.chat.completions.create(
    #     model="openai/gpt-oss-20b",
    #     messages=[
    #         {"role": "system", "content": "Bạn là AI tutor."},
    #         {"role": "user", "content": prompt}
    #     ]
    # )

    #OpenAI
    # client = OpenAI()
    # resp = client.chat.completions.create(
    #     model="gpt-4o-mini",
    #     messages=[{"role": "user", "content": prompt}],
    #     temperature=0.3,
    #     max_tokens=800
    # )
    # answer = resp.choices[0].message.content

    # Google Generative AI (Gemini)
    genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    answer = response.text.strip()

    # 4. Nếu AI trả lời là "Tài liệu chưa đề cập..." thì tìm trên internet
    if "Tài liệu chưa đề cập" in answer or "không có thông tin" in answer or not chunks.exists():
        # Prompt lại cho AI tìm trên internet, yêu cầu trả lời kèm link nguồn
        web_prompt = f"""
Bạn là AI tutor cho khóa học "{course.title}".
Câu hỏi của học viên: {question}

Yêu cầu:
- Tìm kiếm thông tin trên internet để trả lời câu hỏi trên.
- Trả lời ngắn gọn, dễ hiểu, bằng tiếng Việt.
- Luôn ghi rõ nguồn tham khảo (đường link) cuối câu trả lời
- Khi ghi nguồn tham khảo, hãy để đường link đầy đủ. Ví dụ: "Nguồn: https://example.com"
"""
        web_response = model.generate_content(web_prompt)
        answer = web_response.text.strip()
        # Trích xuất link nguồn từ câu trả lời (nếu có)
        import re
        links = re.findall(r'(https?://[^\s]+)', answer)
        sources = links if links else ["Internet"]
    print("Sources:", sources)
    print("Answer:", answer)
    return answer, sources
