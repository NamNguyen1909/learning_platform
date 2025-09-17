import os,tempfile,re
import fitz  # PyMuPDF cho PDF
import docx
import requests
from django.conf import settings
from youtube_transcript_api import YouTubeTranscriptApi
from ..models import Chunk, Document
from ..rag_service import get_embedding

# --- Extractor ---
def extract_text(doc: Document) -> str:
    """
    Trích xuất text từ file Supabase/S3 hoặc URL của Document.
    """
    text = ""
    print(f"[Ingest] Extracting text from document {doc.id}")

    # Nếu có file trên Supabase/S3
    if doc.file:
        file_url = doc.get_url()
        print(f"[Ingest] Downloading file from {file_url}")
        response = requests.get(file_url, timeout=30)
        if response.status_code == 200:
            file_ext = doc.file.lower()
            # Tạo file tạm đúng cách
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(doc.file)[-1]) as tmp_file:
                tmp_file.write(response.content)
                temp_path = tmp_file.name
            try:
                if file_ext.endswith(".pdf"):
                    text = extract_text_from_pdf(temp_path)
                elif file_ext.endswith(".docx"):
                    text = extract_text_from_docx(temp_path)
                elif file_ext.endswith(".txt"):
                    with open(temp_path, "r", encoding="utf-8") as f:
                        text = f.read()
            finally:
                os.remove(temp_path)
        else:
            print(f"[Ingest] Failed to download file from Supabase: {response.status_code}")
    # Nếu có URL (ví dụ YouTube hoặc web link)
    elif doc.url:
        if "youtube.com" in doc.url or "youtu.be" in doc.url:
            text = extract_youtube_transcript(doc.url)
        else:
            text = requests.get(doc.url, timeout=20).text

    return text


def extract_text_from_pdf(file_path):
    print(f"[Ingest] Extracting text from PDF {file_path}")
    text = ""
    with fitz.open(file_path) as pdf:
        for page in pdf:
            text += page.get_text()
    return text


def extract_text_from_docx(file_path):
    print(f"[Ingest] Extracting text from DOCX {file_path}")
    text = ""
    doc = docx.Document(file_path)
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text


def extract_youtube_transcript(url: str):
    """
    Lấy transcript từ video YouTube.
    """

    print(f"[Ingest] Extracting transcript from YouTube URL {url}")
    try:
        # Tách video_id từ URL
        if "youtu.be" in url:
            video_id = url.split("/")[-1].split("?")[0]
            print(f"[Ingest] Extracted video ID: {video_id}")
        else:
            from urllib.parse import urlparse, parse_qs
            qs = parse_qs(urlparse(url).query)
            video_id = qs.get("v", [""])[0]
            print(f"[Ingest] Extracted video ID: {video_id}")

        if not video_id:
            return ""

        api = YouTubeTranscriptApi()
        transcript = api.fetch(video_id, languages=['vi', 'en'])
        text = " ".join([entry.text for entry in transcript if entry.text.strip()])
        return text
    except Exception as e:
        print(f"[Ingest] Error fetching YouTube transcript: {e}")
        return ""


# --- Chunking ---
def split_into_chunks(text, chunk_size=1200, overlap=100):
    sentences = re.split(r'(?<=[.!?]) +', text)  # tách theo câu đơn giản
    chunks, current = [], ""

    for sent in sentences:
        if len(current) + len(sent) <= chunk_size:
            current += " " + sent
        else:
            chunks.append(current.strip())
            # tạo overlap bằng cách lấy phần cuối chunk trước
            current = current[-overlap:] + " " + sent

    if current.strip():
        chunks.append(current.strip())

    return chunks


# --- Ingestion main ---
def ingest_document(doc: Document):
    print(f"[Ingest] Start ingesting document {doc.id} - {doc.title}")
    text = extract_text(doc)
    if not text.strip():
        print("[Ingest] No text extracted")
        return

    chunks = split_into_chunks(text)
    print(f"[Ingest] {len(chunks)} chunks generated")

    for ch in chunks:
        emb = get_embedding(ch)
        Chunk.objects.create(
            course=doc.course,
            document=doc,
            text=ch,
            embedding=emb.tolist(),
            meta={"source": doc.title}
        )

    print(f"[Ingest] Done ingesting document {doc.id}")
