# Copilot Instructions for Smart Learning Platform

## Project Overview
- **Backend:** Django 5.2+, custom user model, REST API, OAuth2/JWT, social login (Google, GitHub, Facebook), MySQL, Cloudinary for media, Celery + Redis for async tasks, Supabase for Vector DB (RAG).
- **Frontend:** React 19+ (Vite), communicates with backend via REST API, token-based authentication (JWT), Material-UI v7 Web.
- **STRICT RULE:** This is a 100% Web application. NO REACT NATIVE code or mobile patterns should ever be introduced.
- **Structure:**
  - `learning_platform/` (Django project root)
  - `learningapi/` (Django app core)
    - `models.py` (Database models)
    - `serializers.py` (DRF serializers)
    - `views.py` (Simple CRUD & Core Synchronous logic only)
    - `api_views.py` (Complex operations requiring DRF ViewSets)
    - `services/` (Standalone business logic layer - e.g., `vnpay_service.py`, `rag_service.py`)
    - `permissions.py` (Custom RBAC permission classes)
    - `consumers.py` (Django Channels ASGI WebSockets)
  - `frontend/` (Vite React Web app)

## Key Patterns & Conventions
- **API URLs:** All backend APIs are under `/api/` (see `urls.py`).
- **Authentication:**
  - JWT endpoints: `/api/auth/token/`, `/api/auth/token/refresh/`
  - Social login callbacks handled via Django endpoints.
  - User info: `/api/users/current_user/` (custom action in UserViewSet).
- **Permissions:** Custom RBAC classes (`IsInstructor`, `IsCenterManager`, `IsLearner`). Ensure proper multi-tenancy filters by checking `center_id` where applicable.
- **Frontend API:** All API calls via `frontend/src/services/apis.js`. Authentication state handled in `frontend/src/services/auth.js`.

## Developer Workflows
- **Backend:** `python manage.py runserver` | `python manage.py makemigrations && python manage.py migrate`
- **Frontend:** `cd frontend && npm install && npm run dev`

## Code Style & Language Mandate
- **STRICT REQUIREMENT:** All written code, variable names, function names, class definitions, database fields, docstrings, and inline comments MUST be written in **English**. No Vietnamese text allowed in code assets.

## Backend Architecture Rules (Hybrid & Service Layer Approach)

1. **Hybrid View Setup:**
   - Use `views.py` ONLY for **Simple CRUD & Core Logic** (single-responsibility synchronous flows).
   - Use `api_views.py` ONLY for **Complex Operations** requiring advanced DRF ViewSets (filtering, multi-action endpoints).
   - **CRITICAL:** Never mix complex ViewSet logic into `views.py`.

2. **ViewSet Constraints:**
   - DO NOT use generic `ModelViewSet` or `GenericViewSet` with blind mixins.
   - Always declare explicit view inheritance based on exact actions needed.
   - Example Pattern:
     ```python
     from rest_framework import viewsets, generics
     
     class CourseViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
         queryset = Course.objects.all()
         serializer_class = CourseSerializer
     ```

3. **Service Layer Isolation:**
   - Isolate heavy, complex business domains, algorithmic sequences, or third-party integrations (such as VNPay secure hash calculation, Supabase Vector ingestion, Celery background scheduling) into dedicated service classes inside `learningapi/services/`.
   - Views should only handle request validation, authentication checks, and invoke the respective Service layer.

4. **Database Optimization & N+1 Prevention:**
   - You MUST eliminate N+1 query overhead in EVERY database transaction fetching related structures.
   - Use `select_related()` for One-to-One and ForeignKey links (e.g., `instructor`, `center`).
   - Use `prefetch_related()` for Many-to-Many or reverse ForeignKey links (e.g., `lessons`, `materials`).

5. **Model & Admin Sync:**
   - When introducing a new model in `models.py`:
     - Create a matching entry in `serializers.py`.
     - Automatically register the model in `learningapi/admin.py` with custom `list_display` setups.

## Frontend UI & Architecture Rules (React 19 & MUI 7)

1. **Layout & Component Library:**
   - Use **Material-UI (MUI) v7** as the core web component architecture.
   - **STRICT GRID RULE:** Always use MUI Grid v2 (`import Grid from '@mui/material/Grid2'`). NEVER import or use Grid v1.
   - Wrap standard standalone pages inside a `<Container maxWidth="lg">`.

2. **Responsiveness & UX States:**
   - Layouts must be 100% fluid and responsive using MUI breakpoints (`xs`, `sm`, `md`, `lg`) on Box/Grid wrappers.
   - Always catch API loading states with visual indicators and throw explicit notifications using `Snackbar` / `Alert` components for success or failure feedback loops.

3. **State Management:**
   - Component-level UI logic: `useState`.
   - Global lightweight parameters (Theme context, Authenticated user context): React Context API.
   - Heavy corporate data metrics (Course progress tracking, shopping carts): Redux Toolkit or Zustand.

## Inter-file Editing Workflow Rules for Copilot

1. **API Registration Sync:**
   - When adding or modifying a backend endpoint (`learningapi/api_views.py` or `views.py`), Copilot must automatically scan and check the registered routers in `learningapi/urls.py`, and immediately prompt to register/update the matching API call function inside `frontend/src/services/apis.js` with the correct HTTP method.

2. **Frontend Routing Sync:**
   - When creating a new page layout inside `frontend/src/pages/`, Copilot must register the route inside `App.jsx` using React Router, and safely include the menu trigger conditionally matching user roles inside `frontend/src/components/Header.jsx`.

3. **No Silent Code Execution:**
   - Before applying any technical patch or code generation block, always present a summary in the chat indicating:
     1. Architectural impact and target files.
     2. Comprehensive code diff preview.
     3. Explicit confirmation that no React Native code is introduced and all logic is in English.

## Git Commit Messaging Rules
- When generating, suggesting, or auto-filling Git commit messages, Copilot MUST strictly follow the specifications declared in `skills/git_commit_skill.md`.
- Never generate conversational, compound sentences or past-tense headers. Keep the subject line under 50 characters, lowercase, and imperative.