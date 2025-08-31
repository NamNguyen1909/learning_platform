from django.db.models.signals import post_migrate
from django.contrib.auth import get_user_model
from django.dispatch import receiver
from django.conf import settings

from learningapi import models

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
        "Short-term (<5h)",
        "Medium-term (5–20h)",
        "Long-term (>20h)",
        "Beginner",
        "Intermediate",
        "Advanced",
        "Expert",
        "Student",
        "Certified",
        "Non-certified",
        "Vietnamese",
        "English",
    ]
    # Giả sử model Tag có trường 'name'
    Tag = getattr(models, "Tag", None)
    if Tag:
        for tag_name in default_tags:
            Tag.objects.get_or_create(name=tag_name)