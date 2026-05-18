def send_notification_email(user, notification):
	from django.core.mail import EmailMultiAlternatives
	from django.conf import settings
	
	print('Sending email to', user.email)

	subject = notification.title
	from_email = settings.DEFAULT_FROM_EMAIL
	to = [user.email]
	text_content = notification.message
	html_content = f"""
	<html>
	<head>
		<style>
			body {{ font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
			.container {{ max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }}
			.header {{ background-color: #007bff; color: #ffffff; padding: 10px; text-align: center; border-radius: 8px 8px 0 0; }}
			.content {{ padding: 20px; }}
			.footer {{ text-align: center; padding: 10px; font-size: 12px; color: #666; }}
		</style>
	</head>
	<body>
		<div class="container">
			<div class="header">
				<h2>{notification.title}</h2>
			</div>
			<div class="content">
				<p>Xin chào {user.full_name or user.username},</p>
				<p>{notification.message}</p>
				<p>Trân trọng,<br>Đội ngũ Smart Learning Platform</p>
			</div>
			<div class="footer">
				<p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
			</div>
		</div>
	</body>
	</html>
	"""
	msg = EmailMultiAlternatives(subject, text_content, from_email, to)
	msg.attach_alternative(html_content, "text/html")
	msg.send()
