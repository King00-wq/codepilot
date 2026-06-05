from fastapi import APIRouter, HTTPException, Depends

from schemas import UpdateProfileRequest, ChangePasswordRequest, UpdateSettingsRequest, FileUploadRequest
from user_service import get_profile, update_profile, change_password, get_settings, update_settings, handle_file_upload, get_analytics
from dependencies import get_current_user, CurrentUser

router = APIRouter(prefix="/api", tags=["users"])


@router.get("/profile")
def profile(current_user: CurrentUser = Depends(get_current_user)):
    try:
        return get_profile(current_user.user_id)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/profile")
def update_user_profile(
    body: UpdateProfileRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    try:
        return update_profile(current_user.user_id, body.username, body.profile_picture)
    except ValueError as e:
        status_code = 409 if "taken" in str(e).lower() else 400
        raise HTTPException(status_code=status_code, detail=str(e))


@router.put("/profile/password")
def update_password(
    body: ChangePasswordRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    try:
        return change_password(current_user.user_id, body.current_password, body.new_password)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/settings")
def fetch_settings(current_user: CurrentUser = Depends(get_current_user)):
    return get_settings(current_user.user_id)


@router.put("/settings")
def save_settings(
    body: UpdateSettingsRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    try:
        return update_settings(
            current_user.user_id,
            body.notifications,
            body.workspace_preferences,
            body.security_preferences,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/upload")
def upload_file(
    body: FileUploadRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    try:
        return handle_file_upload(body.filename, body.content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/analytics")
def analytics(current_user: CurrentUser = Depends(get_current_user)):
    return get_analytics(current_user.user_id)
