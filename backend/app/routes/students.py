"""Student Management Routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Student
from app.schemas.schemas import StudentResponse, StudentCreate, UserCreate
import bcrypt

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("/", response_model=List[StudentResponse])
def list_students(
    skip: int = 0,
    limit: int = 50,
    school_id: int = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all students - admin and teachers can view"""
    
    # Check authorization
    user = db.query(User).filter(User.id == int(current_user["user_id"])).first()
    if user.role not in ["admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and teachers can view students"
        )
    
    # Build query
    query = db.query(Student)
    
    if school_id:
        query = query.filter(Student.school_id == school_id)
    elif user.role == "teacher":
        # Teachers can only see students in their school
        query = query.filter(Student.school_id == user.school_id)
    
    students = query.offset(skip).limit(limit).all()
    return students


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(
    student_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get student by ID"""
    
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Authorization: admin, teachers in same school, student themselves, or parent of student
    current = db.query(User).filter(User.id == int(current_user["user_id"])).first()
    if current.role == "admin":
        pass  # Admin can see everything
    elif current.role == "teacher" and current.school_id == student.school_id:
        pass  # Teacher can see students in their school
    elif current.role == "student" and current.id == student.user_id:
        pass  # Student can see themselves
    elif current.role == "parent" and current.id == student.parent_id:
        pass  # Parent can see their child
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this student"
        )
    
    return student


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student_data: StudentCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new student - admin only"""
    
    # Check authorization
    user = db.query(User).filter(User.id == int(current_user["user_id"])).first()
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create students"
        )
    
    # Check if user already exists
    if student_data.user_id:
        existing_user = db.query(User).filter(User.id == student_data.user_id).first()
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        # Check if already a student
        existing_student = db.query(Student).filter(Student.user_id == student_data.user_id).first()
        if existing_student:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a student"
            )
    
    # Create student record
    db_student = Student(
        user_id=student_data.user_id,
        school_id=user.school_id,
        enrollment_number=student_data.enrollment_number,
        grade_level=student_data.grade_level,
        parent_id=student_data.parent_id
    )
    
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    
    return db_student


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    student_data: StudentCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update student - admin only"""
    
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Check authorization - admin only for updates
    user = db.query(User).filter(User.id == int(current_user["user_id"])).first()
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update students"
        )
    
    # Update fields if provided
    if student_data.enrollment_number:
        student.enrollment_number = student_data.enrollment_number
    if student_data.grade_level:
        student.grade_level = student_data.grade_level
    if student_data.parent_id:
        student.parent_id = student_data.parent_id
    
    db.add(student)
    db.commit()
    db.refresh(student)
    
    return student


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete student (soft delete) - admin only"""
    
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Check authorization
    user = db.query(User).filter(User.id == int(current_user["user_id"])).first()
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete students"
        )
    
    # Soft delete - set user status to inactive
    student_user = db.query(User).filter(User.id == student.user_id).first()
    if student_user:
        student_user.status = "inactive"
        db.add(student_user)
    
    db.commit()
    return None
