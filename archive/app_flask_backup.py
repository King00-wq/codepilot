import os
import logging
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from database import init_db, get_db
from auth_service import signup_user, login_user, verify_token, create_reset_token, reset_password
from ai_service import process_ai_request
from session_service import create_session, get_session, get_user_history, delete_session, update_session_title
from user_service import get_profile, update_profile, change_password, get_settings, update_settings, handle_file_upload, get_analytics_summary

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s: %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=os.environ.get('ALLOWED_ORIGINS', '*'), supports_credentials=True)

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per hour"],
    storage_uri="memory://"
)

init_db()

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authentication required"}), 401
        token = auth_header.split(' ', 1)[1]
        payload = verify_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired session. Please login again."}), 401
        request.user_id = payload['user_id']
        request.user_email = payload['email']
        return f(*args, **kwargs)
    return decorated

def sanitize_string(value: str, max_len: int = 1000) -> str:
    if not isinstance(value, str):
        return ''
    return value.strip()[:max_len]

# ─── Auth Routes ─────────────────────────────────────────────────────────────

@app.route('/api/signup', methods=['POST'])
@limiter.limit("10 per hour")
def signup():
    data = request.get_json(silent=True) or {}
    result, status = signup_user(
        sanitize_string(data.get('username', ''), 50),
        sanitize_string(data.get('email', ''), 254),
        data.get('password', '')
    )
    if status >= 400:
        logger.warning(f"Signup failed: {data.get('email', 'unknown')}")
    return jsonify(result), status

@app.route('/api/login', methods=['POST'])
@limiter.limit("20 per hour")
def login():
    data = request.get_json(silent=True) or {}
    result, status = login_user(
        sanitize_string(data.get('email', ''), 254),
        data.get('password', '')
    )
    if status >= 400:
        logger.warning(f"Login failed: {data.get('email', 'unknown')}")
    return jsonify(result), status

@app.route('/api/logout', methods=['POST'])
@require_auth
def logout():
    logger.info(f"User {request.user_id} logged out")
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/forgot-password', methods=['POST'])
@limiter.limit("5 per hour")
def forgot_password():
    data = request.get_json(silent=True) or {}
    result, status = create_reset_token(sanitize_string(data.get('email', ''), 254))
    return jsonify(result), status

@app.route('/api/reset-password', methods=['POST'])
@limiter.limit("5 per hour")
def do_reset_password():
    data = request.get_json(silent=True) or {}
    result, status = reset_password(
        sanitize_string(data.get('token', ''), 200),
        data.get('new_password', '')
    )
    return jsonify(result), status

@app.route('/api/auth/me', methods=['GET'])
@require_auth
def get_me():
    result, status = get_profile(request.user_id)
    return jsonify(result), status

# ─── AI Routes ───────────────────────────────────────────────────────────────

@app.route('/api/ai/<action_type>', methods=['POST'])
@require_auth
@limiter.limit("30 per hour")
def ai_action(action_type):
    valid_actions = {'explain', 'debug', 'optimize', 'generate_docs', 'convert'}
    if action_type not in valid_actions:
        return jsonify({"error": "Invalid action type"}), 400

    data = request.get_json(silent=True) or {}
    session_id = data.get('session_id')

    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    db = get_db()
    session = db.execute(
        'SELECT id FROM sessions WHERE id = ? AND user_id = ?',
        (session_id, request.user_id)
    ).fetchone()
    db.close()

    if not session:
        return jsonify({"error": "Session not found or unauthorized"}), 403

    result, status = process_ai_request(
        session_id=session_id,
        user_id=request.user_id,
        prompt=sanitize_string(data.get('prompt', ''), 2000),
        code=sanitize_string(data.get('code', ''), 50000),
        action_type=action_type,
        target_language=sanitize_string(data.get('target_language', ''), 50)
    )

    if status >= 400:
        logger.error(f"AI request failed for user {request.user_id}: {result}")

    return jsonify(result), status

# ─── Session Routes ───────────────────────────────────────────────────────────

@app.route('/api/sessions', methods=['POST'])
@require_auth
def new_session():
    result, status = create_session(request.user_id)
    return jsonify(result), status

@app.route('/api/sessions/<int:session_id>', methods=['GET'])
@require_auth
def fetch_session(session_id):
    result, status = get_session(session_id, request.user_id)
    return jsonify(result), status

@app.route('/api/sessions/<int:session_id>', methods=['PUT'])
@require_auth
def update_session(session_id):
    data = request.get_json(silent=True) or {}
    result, status = update_session_title(
        session_id, request.user_id,
        sanitize_string(data.get('title', ''), 100)
    )
    return jsonify(result), status

@app.route('/api/sessions/<int:session_id>', methods=['DELETE'])
@require_auth
def remove_session(session_id):
    result, status = delete_session(session_id, request.user_id)
    return jsonify(result), status

@app.route('/api/history', methods=['GET'])
@require_auth
def history():
    search = sanitize_string(request.args.get('search', ''), 100)
    filter_type = sanitize_string(request.args.get('filter', 'all'), 50)
    sort = request.args.get('sort', 'newest')
    if sort not in ('newest', 'oldest'):
        sort = 'newest'
    result, status = get_user_history(request.user_id, search or None, filter_type, sort)
    return jsonify(result), status

# ─── User / Profile Routes ────────────────────────────────────────────────────

@app.route('/api/profile', methods=['GET'])
@require_auth
def profile():
    result, status = get_profile(request.user_id)
    return jsonify(result), status

@app.route('/api/profile', methods=['PUT'])
@require_auth
def update_user_profile():
    data = request.get_json(silent=True) or {}
    safe_data = {}
    if 'username' in data:
        safe_data['username'] = sanitize_string(data['username'], 50)
    if 'profile_picture' in data:
        safe_data['profile_picture'] = sanitize_string(data['profile_picture'], 500)
    result, status = update_profile(request.user_id, safe_data)
    return jsonify(result), status

@app.route('/api/profile/password', methods=['PUT'])
@require_auth
@limiter.limit("5 per hour")
def update_password():
    data = request.get_json(silent=True) or {}
    result, status = change_password(
        request.user_id,
        data.get('current_password', ''),
        data.get('new_password', '')
    )
    return jsonify(result), status

@app.route('/api/settings', methods=['GET'])
@require_auth
def fetch_settings():
    result, status = get_settings(request.user_id)
    return jsonify(result), status

@app.route('/api/settings', methods=['PUT'])
@require_auth
def save_settings():
    data = request.get_json(silent=True) or {}
    result, status = update_settings(request.user_id, data)
    return jsonify(result), status

@app.route('/api/upload', methods=['POST'])
@require_auth
@limiter.limit("20 per hour")
def upload_file():
    data = request.get_json(silent=True) or {}
    content = data.get('content', '')
    filename = sanitize_string(data.get('filename', ''), 255)
    if not filename:
        return jsonify({"error": "Filename is required"}), 400
    result, status = handle_file_upload(content, filename)
    return jsonify(result), status

@app.route('/api/analytics', methods=['GET'])
@require_auth
def analytics():
    result, status = get_analytics_summary(request.user_id)
    return jsonify(result), status

# ─── Error Handlers ───────────────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed"}), 405

@app.errorhandler(429)
def rate_limit_exceeded(e):
    return jsonify({"error": "Too many requests. Please slow down and try again later."}), 429

@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Internal server error: {e}")
    return jsonify({"error": "An internal server error occurred."}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "version": "1.0.0"}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'production') == 'development'
    logger.info(f"Starting AI Code Helper backend on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
