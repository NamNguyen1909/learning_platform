import os
import django
import random
from faker import Faker

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learning_platform.settings')
django.setup()

from learningapi.models import User, Course, Tag, UserRole

fake = Faker()

ROLES = ['learner', 'instructor', 'center']

# Tạo user giả
for _ in range(30):
    role = random.choice(ROLES)
    username = fake.user_name() + str(fake.random_int(1000, 9999))
    email = fake.email()
    phone = fake.numerify(text='0##########')  # Số Việt Nam 10-11 số
    full_name = fake.name()
    user = User.objects.create_user(
        username=username,
        email=email,
        password='123456',
        role=role,
        phone=phone,
        full_name=full_name,
        is_active=True
    )
    print(f"Created user: {username} ({role}) - {full_name}")

# Tạo tag giả nếu chưa có
for _ in range(10):
    tag_name = fake.word().capitalize()
    Tag.objects.get_or_create(name=tag_name)

# Tạo course giả
instructors = User.objects.filter(role='instructor')
tags = list(Tag.objects.all())
for _ in range(15):
    if not instructors:
        break
    instructor = random.choice(instructors)
    title = fake.sentence(nb_words=4)
    description = fake.paragraph(nb_sentences=5)
    course = Course.objects.create(
        title=title,
        description=description,
        instructor=instructor,
        price=round(random.uniform(10, 200), 2),
        is_active=True
    )
    # Gán tag ngẫu nhiên
    course.tags.set(random.sample(tags, k=min(2, len(tags))))
    print(f"Created course: {title}")

print("Seeding done!")
