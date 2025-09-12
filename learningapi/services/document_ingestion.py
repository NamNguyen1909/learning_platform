import os
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
    Trích xuất text từ file hoặc URL của Document.
    """
    text = ""

    # Nếu có file (Supabase/S3)
    if doc.file:
        file_path = os.path.join(settings.MEDIA_ROOT, doc.file)
        if doc.file.lower().endswith(".pdf"):
            text = extract_text_from_pdf(file_path)
        elif doc.file.lower().endswith(".docx"):
            text = extract_text_from_docx(file_path)
        elif doc.file.lower().endswith(".txt"):
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
    # Nếu có URL (ví dụ YouTube hoặc web link)
    elif doc.url:
        if "youtube.com" in doc.url or "youtu.be" in doc.url:
            text = extract_youtube_transcript(doc.url)
        else:
            text = requests.get(doc.url, timeout=20).text

    return text


def extract_text_from_pdf(file_path):
    text = ""
    with fitz.open(file_path) as pdf:
        for page in pdf:
            text += page.get_text()
    return text


def extract_text_from_docx(file_path):
    text = ""
    doc = docx.Document(file_path)
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text


def extract_youtube_transcript(url: str):
    """
    Lấy transcript từ video YouTube.
    """
    try:
        # Tách video_id từ URL
        if "youtu.be" in url:
            video_id = url.split("/")[-1].split("?")[0]
        else:
            from urllib.parse import urlparse, parse_qs
            qs = parse_qs(urlparse(url).query)
            video_id = qs.get("v", [""])[0]

        if not video_id:
            return ""

        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['vi', 'en'])
        text = " ".join([entry['text'] for entry in transcript if entry['text'].strip()])
        return text
    except Exception as e:
        print(f"[Ingest] Error fetching YouTube transcript: {e}")
        return ""


# --- Chunking ---
def split_into_chunks(text, chunk_size=500, overlap=50):
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk_words = words[i:i + chunk_size]
        chunks.append(" ".join(chunk_words))
        i += chunk_size - overlap
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
