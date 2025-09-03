
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'learning_platform.settings')
import django
django.setup()

from django.utils import timezone
from django.utils.timezone import localtime
import random
from faker import Faker
from datetime import timedelta


# Xóa dữ liệu từng bảng theo thứ tự phụ thuộc khóa ngoại
print('Deleting all data in tables...')
from learningapi.models import Note, UserNotification, Notification, Review, Payment, Answer, Question, DocumentCompletion, Document, CourseProgress, Course, Tag, User

# Thứ tự xóa: Note, UserNotification, Notification, Review, Payment, Answer, Question, DocumentCompletion, Document, CourseProgress, Course, Tag, User
Note.objects.all().delete()
UserNotification.objects.all().delete()
Notification.objects.all().delete()
Review.objects.all().delete()
Payment.objects.all().delete()
Answer.objects.all().delete()
Question.objects.all().delete()
DocumentCompletion.objects.all().delete()
Document.objects.all().delete()
CourseProgress.objects.all().delete()
Course.objects.all().delete()
Tag.objects.all().delete()
User.objects.exclude(is_superuser=True).delete()  # Giữ lại superuser nếu có

print('All data deleted.')


fake = Faker()

ROLES = ['learner', 'instructor', 'center']

# Tạo user giả
users = []
for _ in range(30):
    role = random.choice(ROLES)
    username = fake.user_name() + str(fake.random_int(1000, 9999))
    email = fake.email()
    phone = fake.numerify(text='0##########')
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
    users.append(user)
    print(f"Created user: {username} ({role}) - {full_name}")

# Tạo tag giả nếu chưa có
tags = []
for _ in range(10):
    tag_name = fake.word().capitalize()
    tag, _ = Tag.objects.get_or_create(name=tag_name)
    tags.append(tag)

# Tạo course giả
instructors = User.objects.filter(role='instructor')
courses = []
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
        is_active=True,
        is_published=random.choice([True, False])
    )
    course.tags.set(random.sample(tags, k=min(2, len(tags))))
    courses.append(course)
    print(f"Created course: {title}")

# Tạo CourseProgress
learners = User.objects.filter(role='learner')
for learner in learners:
    enrolled_courses = random.sample(list(courses), k=min(3, len(courses)))
    for course in enrolled_courses:
        progress = random.uniform(0, 100)
        is_completed = progress > 90
        CourseProgress.objects.create(
            learner=learner,
            course=course,
            progress=progress,
            is_completed=is_completed
        )


# Tạo Document
for course in courses:
    for _ in range(random.randint(1, 3)):
        Document.objects.create(
            course=course,
            title=fake.sentence(nb_words=3),
            uploaded_by=random.choice(users),
        )

    # Tạo DocumentCompletion cho mỗi learner với các document của các khoá học đã đăng ký (ensure unique user/document pairs)
    for learner in learners:
        enrolled_courses = CourseProgress.objects.filter(learner=learner).values_list('course', flat=True)
        docs_in_courses = Document.objects.filter(course__in=enrolled_courses)
        if not docs_in_courses:
            continue
        completed_docs = random.sample(list(docs_in_courses), k=min(random.randint(1, len(docs_in_courses)), len(docs_in_courses)))
        for doc in docs_in_courses:
            # Dùng get_or_create để tránh trùng cặp (user, document)
            is_complete = doc in completed_docs
            completed_at = timezone.make_aware(fake.date_time_this_year()) if is_complete else None
            DocumentCompletion.objects.get_or_create(
                user=learner,
                document=doc,
                defaults={
                    'is_complete': is_complete,
                    'completed_at': completed_at
                }
            )

# Tạo Question & Answer
for course in courses:
    for _ in range(random.randint(2, 5)):
        asked_by = random.choice(list(users))
        question = Question.objects.create(
            course=course,
            asked_by=asked_by,
            content=fake.sentence(nb_words=10)
        )
        # Tạo 1-2 câu trả lời cho mỗi câu hỏi
        for _ in range(random.randint(1, 2)):
            Answer.objects.create(
                question=question,
                answered_by=random.choice(list(users)),
                content=fake.sentence(nb_words=15),
                is_ai=random.choice([True, False])
            )

# Tạo Payment
for learner in learners:
    for course in random.sample(list(courses), k=min(2, len(courses))):
        Payment.objects.create(
            user=learner,
            course=course,
            amount=course.price,
            payment_method=random.choice(['momo', 'vnpay']),
            is_paid=random.choice([True, False]),
            transaction_id=fake.uuid4()
        )


# Tạo Review và reply review
for course in courses:
    review_objs = []
    for _ in range(random.randint(14, 26)):
        user = random.choice(list(users))
        review = Review.objects.create(
            course=course,
            user=user,
            rating=random.randint(1, 5),
            comment=fake.sentence(nb_words=12)
        )
        review_objs.append(review)
        # Tạo reply review cho một số review gốc
        if random.random() < 0.5:  # 50% review có reply
            reply_user = random.choice(list(users))
            Review.objects.create(
                course=course,
                user=reply_user,
                rating=None,
                comment=fake.sentence(nb_words=10),
                parent_review=review
            )

# Tạo Notification
notifications = []
for course in courses:
    for _ in range(random.randint(20, 25)):
        notification = Notification.objects.create(
            course=course,
            notification_type=random.choice(['reminder', 'update']),
            title=fake.sentence(nb_words=5),
            message=fake.paragraph(nb_sentences=2)
        )
        notifications.append(notification)

# Tạo UserNotification
for user in users:
    for notification in random.sample(notifications, k=min(15, len(notifications))):
        is_read = random.choice([True, False])
        UserNotification.objects.create(
            user=user,
            notification=notification,
            is_read=is_read,
            read_at=localtime(timezone.now()) if is_read else None
        )

# Tạo Note
documents = list(Document.objects.all())
for learner in learners:
    for _ in range(2):
        Note.objects.create(
            user=learner,
            course=random.choice(courses),
            document=random.choice(documents) if documents else None,
            video_id=fake.uuid4(),
            timestamp=random.uniform(0, 300),
            content=fake.sentence(nb_words=10)
        )

print("Seeding done for all tables!")