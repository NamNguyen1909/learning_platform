# 🎓 Smart Learning Platform

[![Deployment Status](https://img.shields.io/badge/Deploy-Render.com-blue?style=flat-square)](https://render.com)
[![Django](https://img.shields.io/badge/Django-5.2.5-green?style=flat-square&logo=django)](https://djangoproject.com/)
[![React](https://img.shields.io/badge/React-19.1.1-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-7.3.2-blue?style=flat-square&logo=mui)](https://mui.com/)

## Table of Contents
- [Introduction](#introduction)
- [Technologies Used](#technologies-used)
- [Features](#features)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
- [Deployment](#deployment)
- [License](#license)
- [Contributing](#contributing)
- [Contact](#contact)
# learning_platform

## Introduction
The **Smart Learning Platform** is a modern, scalable solution for online education. It supports course management, user roles (admin, instructor, learner, center), secure payments, progress tracking, and social login. The platform is built for flexibility, performance, and a seamless user experience.

### Key Features
- **Course Management**: CRUD for courses, documents, notes, and progress tracking
- **User Roles**: Admin, instructor, learner, and training center with custom permissions
- **Payment Integration**: Secure payments (VNPay, free course registration)
- **Social Login**: Google, GitHub authentication
- **Progress Tracking**: Real-time course progress and completion
- **Media Management**: Cloudinary integration for course and user media
- **Responsive UI**: Material UI-based frontend for all devices
- **API Documentation**: Swagger and ReDoc for easy API exploration

## Technologies Used
### 🗄️ Backend
- **Django 5.2.5** & **Django REST Framework**
- **MySQL** (default, can use SQLite for dev)
- **JWT Authentication** & **OAuth2**
- **Cloudinary & Supabase** for media
- **Gunicorn** for production

### 🎨 Frontend
- **React 19.1.1**
- **Material-UI 7.3.2**
- **Vite**
- **Axios**
- **React Router**

### 💳 Payment & Social Login
- **VNPay** integration
- **Google, GitHub**

### 🚀 Hosting & Deployment
- **Render.com**
- **Cloudinary & Supabase**

## Architecture

### Monorepo Structure
```
learning_platform/                # 📁 Project Root
├── learning_platform/            # Django Project
│   ├── settings.py               # Django settings
│   ├── urls.py                   # URL routing
│   ├── wsgi.py                   # WSGI app
├── learningapi/                  # Django App
│   ├── models.py                 # Data models
│   ├── serializers.py            # DRF serializers
│   ├── views.py                  # API endpoints
│   ├── permissions.py            # Custom permissions
│   ├── admin.py                  # Django admin config
│   ├── urls.py                   # App-level routing
│   └── migrations/               # DB migrations
├── frontend/                     # React Frontend
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.js            # Build config
│   ├── src/                      # Source code
│   │   ├── components/           # UI components
│   │   ├── pages/                # Page components
│   │   ├── services/             # API service layer
│   │   ├── hooks/                # Custom hooks
│   │   └── themes/               # MUI theme config
│   └── public/                   # Static assets
├── requirements.txt              # Python dependencies
├── seed.py                       # Data seeding script
├── render.yaml                   # Deployment config
├── LICENSE                       # License
└── README.md                     # Project documentation
```

### Development Workflow

#### Backend
```bash
pip install -r requirements.txt
python manage.py makemigrations && python manage.py migrate
python seed.py  # optional
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Build for Production
```bash
npm run build
# Backend: see render.yaml for Gunicorn config
```

## Setup Instructions

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **MySQL** (or SQLite for dev)
- **Cloudinary & Supabase account** (for media)
- **VNPay merchant account** (for payments, optional for dev)

### Backend Setup
1. **Clone the Repository**
   ```bash
   git clone https://github.com/NamNguyen1909/learning_platform.git
   cd learning_platform
   ```
2. **Create Virtual Environment**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # or
   source venv/bin/activate  # macOS/Linux
   ```
3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```
4. **Configure Environment Variables**
   Create a `.env` file in the project root:
   ```env
   DATABASE_URL=mysql://user:pass@localhost:3306/learning_platform_db
   SECRET_KEY=your-django-secret-key
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   SOCIAL_AUTH_GOOGLE_OAUTH2_KEY=your-google-key
   SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET=your-google-secret
   SOCIAL_AUTH_GITHUB_KEY=your-github-key
   SOCIAL_AUTH_GITHUB_SECRET=your-github-secret
   ```
5. **Database Setup**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser  # optional
   python seed.py  # optional
   ```
6. **Start Development Server**
   ```bash
   python manage.py runserver
   ```
   - **API Base URL**: `http://localhost:8000/api/`
   - **Admin Interface**: `http://localhost:8000/admin/`
   - **API Docs**: `http://localhost:8000/swagger/`

### Frontend Setup
1. **Navigate to Frontend Directory**
   ```bash
   cd frontend
   ```
2. **Install Dependencies**
   ```bash
   npm install
   ```
3. **Configure Environment Variables**
   Create a `.env.local` file in `frontend`:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
4. **Start Development Server**
   ```bash
   npm run dev
   ```
   - **Frontend URL**: `http://localhost:5173`

## API Endpoints

### 🔐 Authentication
- `POST /api/auth/token/`: JWT login
- `POST /api/auth/token/refresh/`: JWT refresh
- `/auth/login/google-oauth2/`, `/auth/login/github/`: Social login
- `GET /api/users/current_user/`: Get current user info

### 📚 Course Management
- `GET /api/courses/`: List courses
- `POST /api/courses/`: Create course
- `GET /api/courses/{id}/`: Course details
- `POST /api/courses/{id}/progress/`: Update progress
- `POST /api/payments/`: Create payment
- `POST /api/payments/create-url/`: Create VNPay payment URL

### 📊 Statistics & Admin
- `GET /api/statistics/`: System statistics
- `GET /api/users/`: User management

### 📄 API Documentation
- **Swagger UI**: `/swagger/`
- **ReDoc**: `/redoc/`

## Deployment

### Production Deployment with Render.com
See `render.yaml` for full configuration. Key steps:
- **Backend**: Gunicorn, environment variables, Cloudinary,Supabase , social login keys
- **Frontend**: Build with Vite, serve static files
- **Environment Variables**: Set secrets and API URLs for production

### Local Production-like Deployment
```bash
# Backend
export DEBUG=False
python manage.py collectstatic --noinput
# Start with Gunicorn (see render.yaml)
# Frontend
npm run build
npx serve dist -s -p 5173
```

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing
Contributions are welcome! To contribute:
1. **Fork the Repository**
2. **Create Feature Branch**
3. **Make Changes** (follow code style, add tests, update docs)
4. **Test Your Changes**
   - Backend: `python manage.py test`
   - Frontend: `npm run lint`
5. **Commit and Push**
6. **Submit Pull Request**

### Development Guidelines
- **Code Style**: PEP 8 for Python, ESLint for JS
- **Testing**: Write unit tests for new APIs/components
- **Documentation**: Update README and inline docs
- **Environment**: Test in dev and production-like setups

## Contact
For support or collaboration:
- **Nam Nguyen**: namnguyen19092004@gmail.com

---

<div align="center">

**🎓 Built with ❤️ for modern online learning**

</div>

