from django.db.models import F
from .models import Chunk
from openai import OpenAI
import numpy as np
from pgvector.django import CosineDistance

# --- Embedding ---
def get_embedding(text: str) -> np.ndarray:
    """
    Sinh embedding cho text bằng OpenAI.
    """
    client = OpenAI()
    response = client.embeddings.create(
        input=text,
        model="text-embedding-3-large"  # nên dùng model mới, chuẩn hơn
    )
    return np.array(response.data[0].embedding, dtype=np.float32)


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
        .order_by("distance")[:5]
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
    client = OpenAI()
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=800
    )
    answer = resp.choices[0].message.content

    # 5. Trả về answer + nguồn
    sources = [c.document.title for c in chunks]
    return answer, sources
