from fastapi import APIRouter, HTTPException, Depends
from schemas import AIRequest
from ai_service import process_ai_request
from dependencies import get_current_user, CurrentUser
from database import get_db

router = APIRouter(prefix="/api/ai", tags=["ai"])

VALID_ACTIONS = {"explain", "debug", "optimize", "generate_docs", "convert"}


def _verify_session_ownership(session_id: int, user_id: int):
    db = get_db()
    try:
        row = db.execute(
            "SELECT id FROM sessions WHERE id = ? AND user_id = ?", (session_id, user_id)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=403, detail="Session not found or access denied")
    finally:
        db.close()


@router.post("/{action_type}")
def ai_action(
    action_type: str,
    body: AIRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    if action_type not in VALID_ACTIONS:
        raise HTTPException(status_code=400, detail=f"Invalid action '{action_type}'")
    print("SESSION_ID:", body.session_id)
    print("USER_ID:", current_user.user_id)

    # _verify_session_ownership(body.session_id, current_user.user_id)

    try:
        return process_ai_request(
            session_id=body.session_id,
            user_id=current_user.user_id,
            prompt=body.prompt or "",
            code=body.code or "",
            action_type=action_type,
            target_language=body.target_language,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
