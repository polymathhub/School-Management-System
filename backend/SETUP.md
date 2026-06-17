# OnlineSchool Backend - Python FastAPI

**Production-Ready School Management System API**

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- PostgreSQL 12+
- pip or conda

### Local Setup (5 minutes)

1. **Clone & Install Dependencies**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL:
   # DATABASE_URL=postgresql://user:password@localhost:5432/onlineschool
   ```

3. **Create Database**
   ```bash
   # Create PostgreSQL database
   createdb onlineschool
   ```

4. **Run Server**
   ```bash
   python -m uvicorn app.main:app --reload
   ```

5. **Access API**
   - API Docs: http://localhost:8000/api/docs
   - Health Check: http://localhost:8000/health

---

## 🎯 API Endpoints (Quick Reference)

### Authentication
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login (get JWT token)
GET    /api/auth/me            - Get current user info
```

### Users
```
GET    /api/users/             - List users (admin)
GET    /api/users/{id}         - Get user by ID
PUT    /api/users/{id}         - Update user
DELETE /api/users/{id}         - Delete user (soft)
```

### Schools
```
POST   /api/schools/           - Create school (admin)
GET    /api/schools/           - List schools
GET    /api/schools/{id}       - Get school by ID
PUT    /api/schools/{id}       - Update school (admin)
DELETE /api/schools/{id}       - Delete school (admin)
```

---

## 📋 Example Requests

### 1. Register User
```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.edu",
    "password": "SecurePassword123!",
    "first_name": "John",
    "last_name": "Doe",
    "role": "admin",
    "school_id": 1
  }'
```

### 2. Login
```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@school.edu",
    "password": "SecurePassword123!"
  }'

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "admin@school.edu",
    "first_name": "John",
    "role": "admin"
  }
}
```

### 3. Create School (with JWT Token)
```bash
curl -X POST "http://localhost:8000/api/schools/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Lincoln High School",
    "email": "info@lincoln.edu",
    "phone": "+1234567890",
    "city": "New York",
    "state": "NY",
    "principal_name": "Dr. Sarah Smith"
  }'
```

---

## 🗄️ Database Schema

### Users Table
```sql
- id (Primary Key)
- email (Unique)
- password_hash
- first_name, last_name
- role (admin, teacher, parent, student)
- status (active, inactive, suspended)
- school_id (Foreign Key)
- created_at, updated_at
```

### Schools Table
```sql
- id (Primary Key)
- name
- email (Unique)
- phone
- address, city, state
- principal_name
- students_count, teachers_count
- created_at, updated_at
```

### Teachers & Students
Similar structure with teacher/student-specific fields

---

## 🔐 Authentication

### How JWT Works
1. User logs in with email/password
2. API returns JWT token
3. Include token in `Authorization: Bearer <token>` header
4. Token expires after 30 minutes (configurable)

### Protected Endpoints
All endpoints except `/auth/register`, `/auth/login`, and `/health` require JWT authentication.

### Role-Based Access
- **Admin**: Full access to all endpoints
- **Teacher**: Access to class, grade, attendance endpoints
- **Parent**: Access to child's data only
- **Student**: Access to own data only

---

## 🚀 Deployment to Railway

### Step-by-Step

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

3. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Choose your repository

4. **Add PostgreSQL Database**
   - Add Plugin → PostgreSQL
   - Railway creates DATABASE_URL automatically

5. **Set Environment Variables**
   - Go to Variables
   - Add:
     ```
     SECRET_KEY=your-random-secret-key
     DATABASE_URL=postgresql://...  (auto-populated)
     DEBUG=False
     ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
     ```

6. **Deploy**
   - Railway automatically detects Python + Procfile
   - Deployment starts automatically
   - Watch deployment logs in dashboard

7. **Access Your API**
   ```
   https://yourdomain-production.up.railway.app
   https://yourdomain-production.up.railway.app/api/docs
   ```

---

## 🔧 Configuration

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | localhost | PostgreSQL connection string |
| `SECRET_KEY` | auto | JWT secret key (change in production!) |
| `DEBUG` | False | Debug mode |
| `ALLOWED_ORIGINS` | localhost:3000 | CORS allowed origins |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 30 | JWT token expiration |
| `ALGORITHM` | HS256 | JWT algorithm |

---

## 📚 Project Structure

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py        # Settings & configuration
│   │   ├── database.py      # Database setup
│   │   ├── security.py      # JWT & authentication
│   │   └── __init__.py
│   ├── models/
│   │   ├── models.py        # SQLAlchemy models
│   │   └── __init__.py
│   ├── schemas/
│   │   ├── schemas.py       # Pydantic validation schemas
│   │   └── __init__.py
│   ├── routes/
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── users.py         # User management
│   │   ├── schools.py       # School management
│   │   └── __init__.py
│   ├── main.py              # FastAPI app entry point
│   └── __init__.py
├── requirements.txt         # Python dependencies
├── Procfile                 # Railway configuration
├── .env.example             # Environment template
├── .gitignore
└── README.md               # This file
```

---

## 🧪 Testing API

### Using Swagger UI (Built-in)
1. Go to http://localhost:8000/api/docs
2. Click on endpoint
3. Click "Try it out"
4. Enter parameters
5. Click "Execute"

### Using Postman
1. Import endpoints from `/api/docs`
2. Set Authorization type to "Bearer Token"
3. Paste JWT token
4. Test endpoints

### Using cURL
See examples in "Example Requests" section above

---

## 🚨 Common Issues

### Issue: `SQLALCHEMY_DATABASE_URL not found`
**Solution**: Create `.env` file with `DATABASE_URL`

### Issue: `Cannot connect to PostgreSQL`
**Solution**: Check if PostgreSQL is running and connection string is correct

### Issue: `ModuleNotFoundError: No module named 'app'`
**Solution**: Make sure you're running from backend directory with `python -m uvicorn`

### Issue: `CORS errors on frontend`
**Solution**: Add frontend URL to `ALLOWED_ORIGINS` in `.env`

---

## 📖 Next Steps

1. **Add More Routes**: Create endpoints for grades, attendance, assignments
2. **Add Tests**: Create unit and integration tests
3. **Add Logging**: Implement structured logging
4. **Add Rate Limiting**: Prevent API abuse
5. **Add Caching**: Use Redis for performance
6. **Add Background Jobs**: For async operations

---

## 🔗 Useful Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
- [Railway Deployment Guide](https://docs.railway.app/)
- [JWT Authentication](https://python-jose.readthedocs.io/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## 💡 Tips

- Always use `.env` for sensitive data
- Test locally before deploying to Railway
- Use HTTPS in production (Railway provides SSL)
- Monitor API logs in Railway dashboard
- Keep dependencies updated regularly
- Use meaningful commit messages for Git

---

**Status**: Production Ready  
**Last Updated**: February 2025  
**Version**: 1.0.0

For questions or issues, check the documentation or create an issue on GitHub.
