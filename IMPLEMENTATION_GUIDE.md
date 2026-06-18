# Implementation Guide: Transforming the System to Production

**How to use this guide**: Each section contains:
1. **Problem** - What's currently broken
2. **Solution** - Production code implementation
3. **Integration** - How to integrate with existing code

---

# PART 1: IMMEDIATE FIXES (Phase 3 - Authentication)

## Step 1.1: Fix Backend Authentication

**File**: `backend/app/main.py` (Fix duplicate root endpoint)

**Current Issue**: There are two `@app.get("/")` endpoints defined (lines ~47 and ~85)

**Solution**:
```python
# Remove the second duplicate endpoint at line ~85
# Keep only the first one (lines ~42-51):

@app.get("/")
async def root():
    """Serve the main HTML file"""
    html_file = os.path.join(project_root, "onlineschool.html")
    if os.path.exists(html_file):
        return FileResponse(html_file, media_type="text/html")
    return {
        "message": "Welcome to OnlineSchool API",
        "version": settings.APP_VERSION,
        "docs": "/api/docs"
    }
```

**Impact**: Fixes application startup error

---

## Step 1.2: Create API Client Library

**File**: `public/js/api-client.js` (NEW FILE)

```javascript
/**
 * API Client for OnlineSchool Management System
 * Handles all backend communication with JWT authentication
 */

const API_BASE = `${window.location.origin}/api`;

class APIClient {
  /**
   * Get stored auth token from localStorage
   */
  static getToken() {
    return localStorage.getItem('authToken');
  }

  /**
   * Get authorization headers with JWT
   */
  static getHeaders() {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Generic request method
   * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} endpoint - API endpoint path
   * @param {object} data - Request body (optional)
   * @returns {Promise<object>} Response JSON
   */
  static async request(method, endpoint, data = null) {
    try {
      const options = {
        method,
        headers: this.getHeaders(),
      };
      
      if (data) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(`${API_BASE}${endpoint}`, options);
      
      // Handle 401 - token expired or invalid
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/';
        return null;
      }
      
      // Handle network errors
      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * AUTHENTICATION ENDPOINTS
   */
  static login(email, password) {
    return this.request('POST', '/auth/login', { email, password });
  }

  static register(userData) {
    return this.request('POST', '/auth/register', userData);
  }

  static getCurrentUser() {
    return this.request('GET', '/auth/me');
  }

  /**
   * USER ENDPOINTS
   */
  static getUsers(skip = 0, limit = 10) {
    return this.request('GET', `/users?skip=${skip}&limit=${limit}`);
  }

  static getUser(userId) {
    return this.request('GET', `/users/${userId}`);
  }

  static updateUser(userId, userData) {
    return this.request('PUT', `/users/${userId}`, userData);
  }

  static deleteUser(userId) {
    return this.request('DELETE', `/users/${userId}`);
  }

  /**
   * SCHOOL ENDPOINTS
   */
  static getSchools(skip = 0, limit = 10) {
    return this.request('GET', `/schools?skip=${skip}&limit=${limit}`);
  }

  static getSchool(schoolId) {
    return this.request('GET', `/schools/${schoolId}`);
  }

  static createSchool(schoolData) {
    return this.request('POST', '/schools', schoolData);
  }

  static updateSchool(schoolId, schoolData) {
    return this.request('PUT', `/schools/${schoolId}`, schoolData);
  }

  /**
   * STUDENT ENDPOINTS (to be implemented)
   */
  static getStudents(skip = 0, limit = 10) {
    return this.request('GET', `/students?skip=${skip}&limit=${limit}`);
  }

  static getStudent(studentId) {
    return this.request('GET', `/students/${studentId}`);
  }

  static createStudent(studentData) {
    return this.request('POST', '/students', studentData);
  }

  static updateStudent(studentId, studentData) {
    return this.request('PUT', `/students/${studentId}`, studentData);
  }

  static deleteStudent(studentId) {
    return this.request('DELETE', `/students/${studentId}`);
  }

  /**
   * TEACHER ENDPOINTS (to be implemented)
   */
  static getTeachers(skip = 0, limit = 10) {
    return this.request('GET', `/teachers?skip=${skip}&limit=${limit}`);
  }

  static getTeacher(teacherId) {
    return this.request('GET', `/teachers/${teacherId}`);
  }

  static createTeacher(teacherData) {
    return this.request('POST', '/teachers', teacherData);
  }

  static updateTeacher(teacherId, teacherData) {
    return this.request('PUT', `/teachers/${teacherId}`, teacherData);
  }

  /**
   * CLASS ENDPOINTS (to be implemented)
   */
  static getClasses(skip = 0, limit = 10) {
    return this.request('GET', `/classes?skip=${skip}&limit=${limit}`);
  }

  static getClass(classId) {
    return this.request('GET', `/classes/${classId}`);
  }

  static getClassStudents(classId) {
    return this.request('GET', `/classes/${classId}/students`);
  }

  static createClass(classData) {
    return this.request('POST', '/classes', classData);
  }

  static enrollStudent(classId, studentId) {
    return this.request('POST', `/classes/${classId}/students`, { student_id: studentId });
  }

  /**
   * GRADE ENDPOINTS (to be implemented)
   */
  static getClassGrades(classId) {
    return this.request('GET', `/grades/class/${classId}`);
  }

  static getStudentGrades(studentId) {
    return this.request('GET', `/grades/student/${studentId}`);
  }

  static submitGrade(gradeData) {
    return this.request('POST', '/grades', gradeData);
  }

  static updateGrade(gradeId, gradeData) {
    return this.request('PUT', `/grades/${gradeId}`, gradeData);
  }

  /**
   * ATTENDANCE ENDPOINTS (to be implemented)
   */
  static getAttendance(classId, date) {
    return this.request('GET', `/attendance/class/${classId}?date=${date}`);
  }

  static submitAttendance(attendanceData) {
    return this.request('POST', '/attendance', attendanceData);
  }

  /**
   * ANNOUNCEMENT ENDPOINTS (to be implemented)
   */
  static getAnnouncements() {
    return this.request('GET', '/announcements');
  }

  static createAnnouncement(announcementData) {
    return this.request('POST', '/announcements', announcementData);
  }

  static deleteAnnouncement(announcementId) {
    return this.request('DELETE', `/announcements/${announcementId}`);
  }

  /**
   * EVENT ENDPOINTS (to be implemented)
   */
  static getEvents() {
    return this.request('GET', '/events');
  }

  static createEvent(eventData) {
    return this.request('POST', '/events', eventData);
  }

  static submitRSVP(eventId, status) {
    return this.request('POST', `/events/${eventId}/rsvp`, { status });
  }

  /**
   * MESSAGE ENDPOINTS (to be implemented)
   */
  static getMessages() {
    return this.request('GET', '/messages');
  }

  static sendMessage(messageData) {
    return this.request('POST', '/messages', messageData);
  }

  /**
   * ASSIGNMENT ENDPOINTS (to be implemented)
   */
  static getAssignments(classId) {
    return this.request('GET', `/assignments/class/${classId}`);
  }

  static createAssignment(assignmentData) {
    return this.request('POST', '/assignments', assignmentData);
  }

  static submitAssignment(assignmentId, submissionData) {
    return this.request('POST', `/assignments/${assignmentId}/submissions`, submissionData);
  }
}
```

---

## Step 1.3: Update HTML to Include API Client

**File**: `onlineschool.html` (Top of `<head>` section, before other scripts)

Add just before the closing `</head>` tag:
```html
<script src="/static/js/api-client.js" async></script>
```

---

## Step 1.4: Replace Hardcoded Login with Real Authentication

**File**: `onlineschool.html` (Find and replace the authentication section)

**Current Code** (lines ~5460-5530):
```javascript
var ROLES = {
  admin:   { email:'admin@onlineschool.com',   pass:'admin123', ... },
  teacher: { email:'teacher@onlineschool.com', pass:'teacher123', ... },
  parent:  { email:'parent@onlineschool.com',  pass:'parent123', ... },
  student: { email:'student@onlineschool.com', pass:'student123', ... }
};
var currentRole = null;
var currentDash = null;

function fillDemo() {
  if (!currentRole) return;
  var cfg = ROLES[currentRole];
  document.getElementById('login-email').value = cfg.email;
  document.getElementById('login-password').value = cfg.pass;
}

function handleLogin(e) {
  e.preventDefault();
  var email = document.getElementById('login-email').value.trim();
  var pass  = document.getElementById('login-password').value;
  var cfg = currentRole ? ROLES[currentRole] : null;
  if (cfg && email === cfg.email && pass === cfg.pass) {
    closeAuth();
    showDashboard(currentRole);
  } else {
    document.getElementById('login-error').classList.add('show');
  }
}
```

**New Code** (REPLACE with):
```javascript
var currentRole = null;
var currentDash = null;
var currentUser = null;

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  
  // Hide previous error
  errorEl.classList.remove('show');
  
  // Show loading state
  const loginBtn = e.target.querySelector('button[type="submit"]');
  const originalText = loginBtn.textContent;
  loginBtn.textContent = 'Logging in...';
  loginBtn.disabled = true;
  
  try {
    // Call real API
    const response = await APIClient.login(email, password);
    
    if (!response.access_token) {
      throw new Error(response.detail || 'Login failed');
    }
    
    // Store token and user data
    localStorage.setItem('authToken', response.access_token);
    currentUser = response.user;
    localStorage.setItem('userData', JSON.stringify(response.user));
    currentRole = response.user.role.toLowerCase();
    
    // Hide error, close auth, show dashboard
    closeAuth();
    showDashboard(currentRole);
    
  } catch (error) {
    console.error('Login error:', error);
    errorEl.textContent = error.message || 'Invalid email or password';
    errorEl.classList.add('show');
  } finally {
    // Restore button state
    loginBtn.textContent = originalText;
    loginBtn.disabled = false;
  }
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  currentUser = null;
  currentRole = null;
  closeDashboard();
  openAuth();
}
```

---

## Step 1.5: Update Dashboard Initialization

**File**: `onlineschool.html` (Find the `showDashboard` function)

**Current Code**:
```javascript
function showDashboard(role) {
  currentDash = role;
  var cfg = ROLES[role];
  document.getElementById(cfg.dash).classList.add('open');
  document.body.style.overflow = 'hidden';
  initTableFeatures();
  if (role === 'teacher') initAttendance();
}
```

**New Code** (REPLACE with):
```javascript
async function showDashboard(role) {
  currentDash = role;
  
  // Use real user data instead of ROLES config
  const dashboardMap = {
    'admin': 'dash-admin',
    'teacher': 'dash-teacher',
    'parent': 'dash-parent',
    'student': 'dash-student'
  };
  
  const dashId = dashboardMap[role];
  if (!dashId) {
    console.error('Invalid role:', role);
    return;
  }
  
  const dashEl = document.getElementById(dashId);
  if (!dashEl) {
    console.error('Dashboard not found:', dashId);
    return;
  }
  
  dashEl.classList.add('open');
  document.body.style.overflow = 'hidden';
  
  // Update profile info with real user data
  if (currentUser) {
    const avatarEl = dashEl.querySelector('.app-avatar');
    const nameEl = dashEl.querySelector('.pd-name');
    const emailEl = dashEl.querySelector('.pd-email');
    
    if (avatarEl && !avatarEl.querySelector('img')) {
      const initials = (currentUser.first_name[0] + (currentUser.last_name[0] || '')).toUpperCase();
      avatarEl.textContent = initials;
    }
    if (nameEl) nameEl.textContent = `${currentUser.first_name} ${currentUser.last_name}`;
    if (emailEl) emailEl.textContent = currentUser.email;
  }
  
  // Initialize data loading based on role
  if (role === 'admin') {
    loadAdminData();
  } else if (role === 'teacher') {
    loadTeacherData();
  } else if (role === 'parent') {
    loadParentData();
  } else if (role === 'student') {
    loadStudentData();
  }
  
  initTableFeatures();
}
```

---

## Step 1.6: Add Loading Functions (Stub Implementations)

**File**: `onlineschool.html` (Add these new functions after `showDashboard`)

```javascript
// These will be fully implemented in Phase 4
async function loadAdminData() {
  try {
    // Load students
    const students = await APIClient.getStudents(0, 50);
    console.log('Students loaded:', students);
    // Update dashboard with real data (detailed implementation in Phase 4)
  } catch (error) {
    console.error('Failed to load admin data:', error);
    showErrorMessage('Failed to load data. Please try again.');
  }
}

async function loadTeacherData() {
  try {
    // Load teacher's classes
    const classes = await APIClient.getClasses(0, 10);
    console.log('Classes loaded:', classes);
  } catch (error) {
    console.error('Failed to load teacher data:', error);
    showErrorMessage('Failed to load data. Please try again.');
  }
}

async function loadParentData() {
  try {
    // Load child's information
    const user = await APIClient.getCurrentUser();
    console.log('Parent data loaded:', user);
  } catch (error) {
    console.error('Failed to load parent data:', error);
    showErrorMessage('Failed to load data. Please try again.');
  }
}

async function loadStudentData() {
  try {
    // Load student's schedule and grades
    const user = await APIClient.getCurrentUser();
    console.log('Student data loaded:', user);
  } catch (error) {
    console.error('Failed to load student data:', error);
    showErrorMessage('Failed to load data. Please try again.');
  }
}

function showErrorMessage(message) {
  const errorEl = document.createElement('div');
  errorEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef5350;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    z-index: 9999;
    font-size: 14px;
  `;
  errorEl.textContent = message;
  document.body.appendChild(errorEl);
  setTimeout(() => errorEl.remove(), 5000);
}
```

---

## Step 1.7: Update Profile Modal to Use Real Data

**File**: `onlineschool.html` (Find `openProfileModal` function)

**New Code**:
```javascript
function openProfileModal(role) {
  closeAllDropdowns();
  
  // Use current user data instead of ROLES
  const user = currentUser;
  if (!user) {
    showErrorMessage('User data not loaded');
    return;
  }
  
  document.getElementById('profile-modal').dataset.editRole = currentRole;
  document.getElementById('pm-name-input').value = `${user.first_name} ${user.last_name}`;
  document.getElementById('pm-email-input').value = user.email;
  document.getElementById('pm-role-input').value = user.role;
  document.getElementById('pm-phone-input').value = user.phone || '';
  document.getElementById('pm-location-input').value = '';
  
  // Avatar
  const pmAv = document.getElementById('pm-avatar-preview');
  const initials = (user.first_name[0] + (user.last_name[0] || '')).toUpperCase();
  pmAv.textContent = initials;
  
  document.getElementById('pm-success').style.display = 'none';
  document.getElementById('pm-fields-wrap').style.display = '';
  document.getElementById('profile-modal').classList.add('open');
}
```

---

## Step 1.8: Add Page Initialization Check

**File**: `onlineschool.html` (Add at the very bottom of the JavaScript section)

```javascript
// Check if user is already logged in on page load
document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('authToken');
  const userData = localStorage.getItem('userData');
  
  if (token && userData) {
    try {
      currentUser = JSON.parse(userData);
      currentRole = currentUser.role.toLowerCase();
      
      // Verify token is still valid
      APIClient.getCurrentUser().then(response => {
        if (response && response.id) {
          // Token is valid, show appropriate dashboard
          showDashboard(currentRole);
        } else {
          // Token invalid, clear storage and show login
          logout();
        }
      }).catch(error => {
        console.log('Session expired');
        logout();
      });
    } catch (e) {
      console.error('Failed to restore session:', e);
      logout();
    }
  }
});
```

---

## Step 1.9: Update Logout Button

**File**: `onlineschool.html` (Find logout button handlers)

Replace any onclick handlers that close dashboards with:
```javascript
function handleLogout(e) {
  if (e) e.preventDefault();
  logout(); // Calls the logout function defined above
}
```

---

# PART 2: BACKEND - CREATE STUDENT ENDPOINT (Example)

## Step 2.1: Create Student Schema

**File**: `backend/app/schemas/schemas.py` (Add these schemas)

```python
from typing import Optional
from pydantic import BaseModel, EmailStr

class StudentBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    grade_level: str
    enrollment_number: str
    
class StudentCreate(StudentBase):
    password: str
    school_id: int

class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    grade_level: Optional[str] = None

class StudentResponse(StudentBase):
    id: int
    user_id: int
    school_id: int
    
    class Config:
        from_attributes = True
```

---

## Step 2.2: Create Student Routes

**File**: `backend/app/routes/students.py` (NEW FILE)

```python
"""Student Management Routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Student, School
from app.schemas.schemas import StudentResponse, StudentCreate, StudentUpdate

router = APIRouter(prefix="/api/students", tags=["students"])


@router.post("/", response_model=StudentResponse)
def create_student(
    student_data: StudentCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new student (admin only)"""
    
    # Verify current user is admin
    user = db.query(User).filter(User.id == int(current_user["user_id"])).first()
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create students"
        )
    
    # Check if email already exists
    existing = db.query(User).filter(User.email == student_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if school exists
    school = db.query(School).filter(School.id == student_data.school_id).first()
    if not school:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="School not found"
        )
    
    # Create user account for student
    from app.core.security import SecurityUtils
    hashed_password = SecurityUtils.hash_password(student_data.password)
    new_user = User(
        email=student_data.email,
        password_hash=hashed_password,
        first_name=student_data.first_name,
        last_name=student_data.last_name,
        phone=student_data.phone,
        role="student",
        school_id=student_data.school_id,
        is_verified=True
    )
    db.add(new_user)
    db.flush()
    
    # Create student record
    new_student = Student(
        user_id=new_user.id,
        school_id=student_data.school_id,
        enrollment_number=student_data.enrollment_number,
        grade_level=student_data.grade_level
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
    return StudentResponse(
        id=new_student.id,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        email=new_user.email,
        phone=new_user.phone,
        grade_level=new_student.grade_level,
        enrollment_number=new_student.enrollment_number,
        user_id=new_user.id,
        school_id=new_student.school_id
    )


@router.get("/", response_model=List[StudentResponse])
def list_students(
    skip: int = 0,
    limit: int = 10,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all students (admin/teacher)"""
    
    user = db.query(User).filter(User.id == int(current_user["user_id"])).first()
    if user.role not in ["admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view students"
        )
    
    students = db.query(Student).offset(skip).limit(limit).all()
    results = []
    for student in students:
        user_obj = db.query(User).filter(User.id == student.user_id).first()
        if user_obj:
            results.append(StudentResponse(
                id=student.id,
                first_name=user_obj.first_name,
                last_name=user_obj.last_name,
                email=user_obj.email,
                phone=user_obj.phone,
                grade_level=student.grade_level,
                enrollment_number=student.enrollment_number,
                user_id=student.user_id,
                school_id=student.school_id
            ))
    return results


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single student"""
    
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    user_obj = db.query(User).filter(User.id == student.user_id).first()
    return StudentResponse(
        id=student.id,
        first_name=user_obj.first_name,
        last_name=user_obj.last_name,
        email=user_obj.email,
        phone=user_obj.phone,
        grade_level=student.grade_level,
        enrollment_number=student.enrollment_number,
        user_id=student.user_id,
        school_id=student.school_id
    )


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    student_data: StudentUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a student (admin only)"""
    
    # Verify admin
    user = db.query(User).filter(User.id == int(current_user["user_id"])).first()
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update students"
        )
    
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Update student fields
    update_data = student_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(student, key, value)
    
    db.add(student)
    db.commit()
    db.refresh(student)
    
    user_obj = db.query(User).filter(User.id == student.user_id).first()
    return StudentResponse(
        id=student.id,
        first_name=user_obj.first_name,
        last_name=user_obj.last_name,
        email=user_obj.email,
        phone=user_obj.phone,
        grade_level=student.grade_level,
        enrollment_number=student.enrollment_number,
        user_id=student.user_id,
        school_id=student.school_id
    )


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a student (admin only)"""
    
    # Verify admin
    user = db.query(User).filter(User.id == int(current_user["user_id"])).first()
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete students"
        )
    
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Soft delete user
    user_obj = db.query(User).filter(User.id == student.user_id).first()
    user_obj.status = "inactive"
    db.add(user_obj)
    db.commit()
```

---

## Step 2.3: Register Student Routes in Main App

**File**: `backend/app/main.py` (Add import and include router)

```python
# Add to imports section:
from app.routes import auth, users, schools, students

# Add after the schools router (around line 70):
app.include_router(students.router)
```

---

## Step 2.4: Create Migrations Script

**File**: `backend/migrations.py` (NEW FILE)

```python
"""Database migration script to create new tables"""
from app.core.database import engine, Base
from app.models.models import (
    Student, Teacher, ClassEnrollment, Attendance, Grade,
    Assignment, Submission, Message, Announcement, Event,
    EventRSVP, Subject, Book, BookBorrowing
)

def create_all_tables():
    """Create all tables in the database"""
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")

if __name__ == "__main__":
    create_all_tables()
```

---

# PART 3: TESTING THE CHANGES

## Step 3.1: Test Login Flow

**Test Using curl**:
```bash
# Start backend server
cd backend
python -m uvicorn app.main:app --reload

# Test login (in another terminal)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@greenwood.edu","password":"Admin123!"}'

# Expected response:
# {"access_token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...","token_type":"bearer","user":{"id":1,"email":"admin@greenwood.edu",...}}
```

## Step 3.2: Test Creating a Student

```bash
curl -X POST http://localhost:8000/api/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "first_name":"John",
    "last_name":"Doe",
    "email":"john.doe@school.edu",
    "password":"StudentPass123!",
    "phone":"+1-234-567-8900",
    "grade_level":"Grade 9",
    "enrollment_number":"STU-001",
    "school_id":1
  }'
```

---

# NEXT IMMEDIATE ACTIONS

1. **Backup current code**: `git commit -am "Backup before production migration"`

2. **Apply Step 1.1**: Fix duplicate root endpoint in `backend/app/main.py`

3. **Apply Step 1.2**: Create `public/js/api-client.js`

4. **Apply Step 1.4**: Replace hardcoded login in HTML

5. **Apply Step 1.8**: Add page initialization check

6. **Test in browser**: 
   - Open http://localhost:8000 (should show login)
   - Try login with test credentials from database
   - Should work with real auth

7. **Apply Step 2.1-2.3**: Create student endpoints in backend

8. **Test student creation**: Use curl commands above

9. **Next phase**: Implement remaining Tier 1 entities following same pattern

---

**This implementation guide gives you the concrete code changes needed. Each step builds on the previous one. Start with Part 1 (authentication) before moving to Part 2 (backend endpoints).**
