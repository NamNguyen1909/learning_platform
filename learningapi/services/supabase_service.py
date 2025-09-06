from supabase import create_client
from django.conf import settings

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def upload_file(file_obj, file_name: str):
    """
    Upload file lên Supabase Storage
    """
    bucket = settings.SUPABASE_BUCKET
    res = supabase.storage.from_(bucket).upload(
        file_name,
        file_obj.read(),
        {
            "content-type": "application/pdf",
            "upsert": "True"
        }
    )
    if res:
        return file_name
    return None

def get_public_url(file_name: str):
    """
    Lấy public URL của file
    """
    bucket = settings.SUPABASE_BUCKET
    return supabase.storage.from_(bucket).get_public_url(file_name)

def get_signed_url(file_name: str, expires_in: int = 3600):
    """
    Tạo signed URL có hiệu lực expires_in giây
    """
    bucket = settings.SUPABASE_BUCKET
    res = supabase.storage.from_(bucket).create_signed_url(file_name, expires_in)
    return res.get("signedURL")

def delete_file(file_name: str):
    """
    Xóa file khỏi Supabase Storage
    """
    bucket = settings.SUPABASE_BUCKET
    res = supabase.storage.from_(bucket).remove([file_name])
    return res
