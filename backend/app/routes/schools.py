"""School Management Routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, School
from app.schemas.schemas import SchoolResponse, SchoolCreate, SchoolUpdate

router = APIRouter(prefix="/api/schools", tags=["schools"])


@router.post("/", response_model=SchoolResponse)
def create_school(
    school_data: SchoolCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new school (admin only)"""
    
    # Check if user is admin
    user = db.query(User).filter(User.id == int(current_user["user_id"])).first()
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create schools"
        )
    
    # Check if school with same email already exists
    existing = db.query(School).filter(School.email == school_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="School with this email already exists"
        )
    
    new_school = School(**school_data.dict())
    db.add(new_school)
    db.commit()
    db.refresh(new_school)
    
    return new_school


@router.get("/", response_model=List[SchoolResponse])
def list_schools(
    skip: int = 0,
    limit: int = 10,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all schools"""
    
    schools = db.query(School).offset(skip).limit(limit).all()
    return schools


@router.get("/{school_id}", response_model=SchoolResponse)
def get_school(
    school_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get school by ID"""
    
    school = db.query(School).filter(School.id == school_id).first()
    
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    return school


@router.put("/{school_id}", response_model=SchoolResponse)
def update_school(
    school_id: int,
    school_data: SchoolUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update school (admin only)"""
    
    # Check if user is admin
    user = db.query(User).filter(User.id == int(current_user["user_id"])).first()
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update schools"
        )
    
    school = db.query(School).filter(School.id == school_id).first()
    
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    update_data = school_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(school, key, value)
    
    db.add(school)
    db.commit()
    db.refresh(school)
    
    return school


@router.delete("/{school_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_school(
    school_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete school (admin only)"""
    
    # Check if user is admin
    user = db.query(User).filter(User.id == int(current_user["user_id"])).first()
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete schools"
        )
    
    school = db.query(School).filter(School.id == school_id).first()
    
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found"
        )
    
    db.delete(school)
    db.commit()
