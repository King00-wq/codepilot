from pydantic import BaseModel, EmailStr, field_validator, model_validator
from typing import Optional
import re


# ── Auth ──────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    confirm_password: str

    @field_validator("username")
    @classmethod
    def username_length(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Username must be at least 2 characters")
        if len(v) > 50:
            raise ValueError("Username must be at most 50 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v

    @model_validator(mode="after")
    def passwords_match(self) -> "SignupRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v


# ── AI ────────────────────────────────────────────────────────────────────────

class AIRequest(BaseModel):
    session_id: int
    code: Optional[str] = ""
    prompt: Optional[str] = ""
    target_language: Optional[str] = "JavaScript"

    @model_validator(mode="after")
    def code_or_prompt_required(self) -> "AIRequest":
        if not (self.code or "").strip() and not (self.prompt or "").strip():
            raise ValueError("Please provide code or a question")
        if len(self.code or "") > 50_000:
            raise ValueError("Code submission exceeds 50,000 character limit")
        return self


# ── Sessions ──────────────────────────────────────────────────────────────────

class UpdateSessionRequest(BaseModel):
    title: str

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty")
        return v[:100]


# ── User ──────────────────────────────────────────────────────────────────────

class UpdateProfileRequest(BaseModel):
    username: Optional[str] = None
    profile_picture: Optional[str] = None

    @field_validator("username")
    @classmethod
    def username_length(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 2:
                raise ValueError("Username must be at least 2 characters")
        return v


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v


class UpdateSettingsRequest(BaseModel):
    notifications: Optional[dict] = None
    workspace_preferences: Optional[dict] = None
    security_preferences: Optional[dict] = None


class FileUploadRequest(BaseModel):
    filename: str
    content: str
