from django.db.models import F
from .models import Chunk
from openai import OpenAI
import numpy as np
from pgvector.django import CosineDistance
import os

from sentence_transformers import SentenceTransformer
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
def generate_ai_answer(course, question: str, allow_web: bool = False):
    """
    Sinh câu trả lời từ AI Tutor cho 1 course cụ thể.
    - course: đối tượng Course
    - question: câu hỏi của user
    - allow_web: nếu True thì có thể gọi thêm công cụ search (chưa triển khai ở đây)
    """
    # 1. Lấy embedding câu hỏi
    q_emb = get_embedding(question)

    # 2. Truy vấn các chunk gần nhất trong DB bằng cosine similarity
    # Dùng annotation với pgvector.cosine_distance
    chunks = (
        Chunk.objects
        .filter(course=course)
        .annotate(distance=CosineDistance("embedding", q_emb))
        .order_by("distance")[:10]
    )

    if not chunks.exists():
        context = "Không tìm thấy tài liệu nào liên quan trong khoá học."
    else:
        context = "\n\n".join(c.text for c in chunks)

    # 3. Tạo prompt
    prompt = f"""
Bạn là AI tutor cho khóa học "{course.title}".
Dựa trên tài liệu sau, hãy trả lời một cách rõ ràng, súc tích:

---
{context}
---

Câu hỏi của học viên: {question}

Yêu cầu:
- Nếu tài liệu không có thông tin, hãy nói "Tài liệu chưa đề cập, bạn có muốn tôi tra cứu thêm không?".
- Trả lời bằng tiếng Việt, văn phong thân thiện, dễ hiểu.
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
    answer = response.text

    # 5. Trả về answer + nguồn
    sources = [c.document.title for c in chunks]
    return answer, sources
