from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional

from schemas import UpdateSessionRequest
from session_service import create_session, get_session, get_user_history, update_session, delete_session
from dependencies import get_current_user, CurrentUser

router = APIRouter(prefix="/api", tags=["sessions"])


@router.post("/sessions", status_code=201)
def new_session(current_user: CurrentUser = Depends(get_current_user)):
    return create_session(current_user.user_id)


@router.get("/sessions/{session_id}")
def fetch_session(session_id: int, current_user: CurrentUser = Depends(get_current_user)):
    try:
        return get_session(session_id, current_user.user_id)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/sessions/{session_id}")
def rename_session(
    session_id: int,
    body: UpdateSessionRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    try:
        return update_session(session_id, current_user.user_id, body.title)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/sessions/{session_id}")
def remove_session(session_id: int, current_user: CurrentUser = Depends(get_current_user)):
    try:
        return delete_session(session_id, current_user.user_id)
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/history")
def history(
    search: Optional[str] = Query(None, max_length=100),
    filter: Optional[str] = Query("all", max_length=50),
    sort: Optional[str] = Query("newest"),
    current_user: CurrentUser = Depends(get_current_user),
):
    if sort not in ("newest", "oldest"):
        sort = "newest"
    return get_user_history(current_user.user_id, search, filter, sort)
