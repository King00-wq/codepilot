from fastapi import APIRouter, HTTPException, status, Depends
from schemas import SignupRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest
from auth_service import signup_user, login_user, request_password_reset, reset_password
from dependencies import get_current_user, CurrentUser
from user_service import get_profile

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(body: SignupRequest):
    try:
        return signup_user(body.username, body.email, body.password)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.post("/login")
def login(body: LoginRequest):
    try:
        return login_user(body.email, body.password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout")
def logout(current_user: CurrentUser = Depends(get_current_user)):
    return {"message": "Logged out successfully"}


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest):
    return request_password_reset(body.email)


@router.post("/reset-password")
def do_reset_password(body: ResetPasswordRequest):
    try:
        return reset_password(body.token, body.new_password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/auth/me")
def me(current_user: CurrentUser = Depends(get_current_user)):
    try:
        return get_profile(current_user.user_id)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
