from django.db.models.signals import post_migrate
from django.contrib.auth import get_user_model
from django.dispatch import receiver
from django.conf import settings

from learningapi import models

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from .models import *

@receiver(post_migrate)
def create_default_superuser_and_tags(sender, **kwargs):
    User = get_user_model()
    # Tạo superuser mặc định nếu chưa có
    if not User.objects.filter(is_superuser=True).exists():
        User.objects.create_superuser(
            username="admin",
            email="admin@example.com",
            password="123"
        )

    # Tạo các tag mặc định nếu chưa có
    default_tags = [
        # Thời lượng
        "Short-term (<5h)",
        "Medium-term (5–20h)",
        "Long-term (>20h)",

        # Trình độ
        "Beginner",
        "Intermediate",
        "Advanced",
        "Expert",

        # Chứng chỉ
        "Student",
        "Certified",
        "Non-certified",

        # Ngôn ngữ
        "Vietnamese",
        "English",

        # Công nghệ thông tin (IT)
        "Information Technology",
        "Programming",
        "Web Development",
        "Mobile Development",
        "Cloud Computing",
        "DevOps",
        "Database",
        "Software Engineering",

        # AI & Dữ liệu
        "Artificial Intelligence",
        "Machine Learning",
        "Deep Learning",
        "Data Science",
        "Big Data",
        "Data Analytics",
        "Data Engineering",

        # An ninh mạng
        "Cybersecurity",
        "Network Security",
        "Ethical Hacking",
        "Blockchain",
        "Cryptography",

        # Design
        "Graphic Design",
        "UI/UX Design",
        "Product Design",
        "3D Design",
        "Animation",
        "Video Editing",

        # Kinh doanh & Quản lý
        "Business",
        "Entrepreneurship",
        "Project Management",
        "Digital Marketing",
        "Finance",
        "E-commerce",

        # Kỹ năng mềm
        "Communication",
        "Leadership",
        "Critical Thinking",
        "Time Management",
        "Teamwork",

        # Ngôn ngữ khác
        "Japanese",
        "Korean",
        "Chinese",
        "French",
        "German",
    ]
    # Luôn tạo các tag mặc định nếu chưa có
    from learningapi.models import Tag
    for tag_name in default_tags:
        Tag.objects.get_or_create(name=tag_name)

@receiver(post_delete, sender=Document)
def delete_chunks_on_document_delete(sender, instance, **kwargs):
    Chunk.objects.filter(document=instance).delete()

@receiver(post_save, sender=Document)
def update_chunks_on_document_update(sender, instance, created, **kwargs):
    # Nếu là update (không phải tạo mới), và file/url thay đổi thì xóa chunk cũ và ingest lại
    if not created:
        old_instance = Document.objects.get(pk=instance.pk)
        # Chỉ ingest nếu file là string (tức là đã upload xong)
        if (old_instance.file != instance.file or old_instance.url != instance.url) and isinstance(instance.file, str):
            Chunk.objects.filter(document=instance).delete()
            from .services.document_ingestion import ingest_document
            ingest_document(instance)