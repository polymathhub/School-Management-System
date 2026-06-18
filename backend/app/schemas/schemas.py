"""Pydantic Schemas - Request/Response validation"""
from __future__ import annotations
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ==================== User Schemas ====================

class UserResponse(BaseModel):
    """User response schema"""
    id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    role: str
    status: str
    is_verified: bool
    school_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    """Create user schema"""
    email: EmailStr
    password: str = Field(..., min_length=12)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = None
    role: str = Field(..., pattern="^(admin|teacher|parent|student)$")
    school_id: Optional[int] = None


class UserUpdate(BaseModel):
    """Update user schema"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None


# ==================== Auth Schemas ====================

class AuthRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str = Field(..., min_length=6)


class AuthResponse(BaseModel):
    """Login response schema"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Token data payload"""
    sub: str
    role: str


# ==================== School Schemas ====================

class SchoolCreate(BaseModel):
    """Create school schema"""
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    established_year: Optional[int] = None
    principal_name: Optional[str] = None


class SchoolUpdate(BaseModel):
    """Update school schema"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    principal_name: Optional[str] = None


class SchoolResponse(BaseModel):
    """School response schema"""
    id: int
    name: str
    email: str
    phone: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    postal_code: Optional[str]
    established_year: Optional[int]
    principal_name: Optional[str]
    students_count: int
    teachers_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ==================== Teacher Schemas ====================

class TeacherCreate(BaseModel):
    """Create teacher schema"""
    user_id: int
    employee_id: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = 0


class TeacherResponse(BaseModel):
    """Teacher response schema"""
    id: int
    user_id: int
    school_id: int
    employee_id: Optional[str]
    specialization: Optional[str]
    experience_years: int
    
    class Config:
        from_attributes = True


# ==================== Student Schemas ====================

class StudentCreate(BaseModel):
    """Create student schema"""
    user_id: int
    enrollment_number: Optional[str] = None
    grade_level: Optional[str] = None
    parent_id: Optional[int] = None


class StudentResponse(BaseModel):
    """Student response schema"""
    id: int
    user_id: int
    school_id: int
    enrollment_number: Optional[str]
    grade_level: Optional[str]
    parent_id: Optional[int]
    
    class Config:
        from_attributes = True


# ==================== Class Schemas ====================

class ClassCreate(BaseModel):
    """Create class schema"""
    name: str = Field(..., min_length=1, max_length=100)
    grade_level: str = Field(..., min_length=1, max_length=50)
    school_id: int
    class_teacher_id: Optional[int] = None
    capacity: Optional[int] = 50


class ClassResponse(BaseModel):
    """Class response schema"""
    id: int
    name: str
    grade_level: str
    school_id: int
    class_teacher_id: Optional[int]
    capacity: int
    
    class Config:
        from_attributes = True


# ==================== Generic Schemas ====================

class ErrorResponse(BaseModel):
    """Error response schema"""
    detail: str
    error_code: Optional[str] = None


class SuccessResponse(BaseModel):
    """Generic success response"""
    message: str
    data: Optional[dict] = None
