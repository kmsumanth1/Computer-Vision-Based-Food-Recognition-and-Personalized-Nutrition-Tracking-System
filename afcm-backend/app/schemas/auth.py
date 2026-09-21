from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def _strip_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name is required.")
        return value


class LoginRequest(BaseModel):
    email: str = Field(max_length=255)
    password: str = Field(max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=10, max_length=200)
    password: str = Field(min_length=8, max_length=128)


class AuthUser(BaseModel):
    id: str
    name: str
    email: str
    profile_completed: bool


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser
