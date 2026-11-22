const authenticationSnippets = [
  {
    id: "authentication:password-hash",
    name: "Hash Password",
    prefix: "passwordhash",
    category: "authentication",
    description: "Generate a secure password hash using Werkzeug.",
    body: [
      "from werkzeug.security import generate_password_hash",
      "",
      "${1:password_hash} = generate_password_hash(${2:password})"
    ],
    tags: [ "password", "security", "hashing" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:password-check",
    name: "Verify Password",
    prefix: "passwordcheck",
    category: "authentication",
    description: "Verify a password against its stored hash.",
    body: [
      "from werkzeug.security import check_password_hash",
      "",
      "if check_password_hash(${1:user.password_hash}, ${2:password}):",
      "    ${3:pass}"
    ],
    tags: [ "password", "security", "verification" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:register-user",
    name: "Register User",
    prefix: "registeruser",
    category: "authentication",
    description: "Create a user account with a securely hashed password.",
    body: [
      "from werkzeug.security import generate_password_hash",
      "from app.extensions import db",
      "from app.models import ${1:User}",
      "",
      "user = ${1:User}(",
      "    username=${2:username},",
      "    email=${3:email},",
      "    password_hash=generate_password_hash(${4:password})",
      ")",
      "",
      "db.session.add(user)",
      "db.session.commit()"
    ],
    tags: [ "registration", "password", "database" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:login-user",
    name: "Authenticate User",
    prefix: "authenticateuser",
    category: "authentication",
    description: "Find a user and verify their password inside a reusable function.",
    body: [
      "from werkzeug.security import check_password_hash",
      "from app.models import ${1:User}",
      "",
      "def ${2:authenticate_user}(email, password):",
      "    user = ${1:User}.query.filter_by(email=email).first()",
      "",
      "    if user and check_password_hash(user.password_hash, password):",
      "        return user",
      "",
      "    return None"
    ],
    tags: [ "login", "authentication", "password" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:login-route",
    name: "Login Route",
    prefix: "loginroute",
    category: "authentication",
    description: "Authenticate a user and create a Flask-Login session.",
    body: [
      "from flask import request, redirect, url_for, flash, render_template",
      "from flask_login import login_user",
      "from werkzeug.security import check_password_hash",
      "from app.models import ${1:User}",
      "",
      "@${2:auth_bp}.route(\"${3:/login}\", methods=[\"GET\", \"POST\"])",
      "def ${4:login}():",
      "    if request.method == \"POST\":",
      "        email = request.form.get(\"email\", \"\")",
      "        password = request.form.get(\"password\", \"\")",
      "        user = ${1:User}.query.filter_by(email=email).first()",
      "",
      "        if user and check_password_hash(user.password_hash, password):",
      "            login_user(user)",
      "            return redirect(url_for(\"${5:main.index}\"))",
      "",
      "        flash(\"Invalid email or password.\", \"error\")",
      "",
      "    return render_template(\"${6:auth/login.html}\")"
    ],
    tags: [ "login", "authentication", "route" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:logout-route",
    name: "Logout Route",
    prefix: "logoutroute",
    category: "authentication",
    description: "Log out the current user and redirect them.",
    body: [
      "from flask import redirect, url_for",
      "from flask_login import login_required, logout_user",
      "",
      "@${1:auth_bp}.route(\"${2:/logout}\")",
      "@login_required",
      "def ${3:logout}():",
      "    logout_user()",
      "    return redirect(url_for(\"${4:auth.login}\"))"
    ],
    tags: [ "logout", "authentication", "route" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:user-loader",
    name: "Load User by ID",
    prefix: "authuserloader",
    category: "authentication",
    description: "Register a Flask-Login user loader callback. The ID type must match your user model's primary key.",
    body: [
      "from app.extensions import login_manager, db",
      "from app.models import ${1:User}",
      "",
      "@login_manager.user_loader",
      "def load_user(user_id):",
      "    return db.session.get(${1:User}, user_id)"
    ],
    tags: [ "login", "user-loader", "authentication" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:current-user",
    name: "Access Current User",
    prefix: "currentuser",
    category: "authentication",
    description: "Access the currently authenticated user.",
    body: [
      "from flask_login import current_user",
      "",
      "if current_user.is_authenticated:",
      "    ${1:username} = current_user.username"
    ],
    tags: [ "login", "current-user", "authentication" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:login-required",
    name: "Protect Route",
    prefix: "authrequired",
    category: "authentication",
    description: "Require authentication before allowing access to a route.",
    body: [
      "from flask import render_template",
      "from flask_login import login_required",
      "",
      "@${1:bp}.route(\"${2:/profile}\")",
      "@login_required",
      "def ${3:profile}():",
      "    return render_template(\"${4:profile.html}\")"
    ],
    tags: [ "login", "authorization", "protection" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:role-decorator",
    name: "Role Required Decorator",
    prefix: "rolerequired",
    category: "authentication",
    description: "Create a decorator that restricts access by user role. Requires a role attribute on your user model.",
    body: [
      "from functools import wraps",
      "from flask import abort",
      "from flask_login import current_user",
      "",
      "def ${1:role_required}(role):",
      "    def decorator(view):",
      "        @wraps(view)",
      "        def wrapped_view(*args, **kwargs):",
      "            if not current_user.is_authenticated:",
      "                abort(401)",
      "",
      "            if current_user.role != role:",
      "                abort(403)",
      "",
      "            return view(*args, **kwargs)",
      "",
      "        return wrapped_view",
      "",
      "    return decorator"
    ],
    tags: [ "roles", "authorization", "decorator" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:admin-required",
    name: "Admin Required Decorator",
    prefix: "adminrequired",
    category: "authentication",
    description: "Restrict a route to authenticated administrators. Requires a role attribute on your user model.",
    body: [
      "from functools import wraps",
      "from flask import abort",
      "from flask_login import current_user",
      "",
      "def ${1:admin_required}(view):",
      "    @wraps(view)",
      "    def wrapped_view(*args, **kwargs):",
      "        if not current_user.is_authenticated:",
      "            abort(401)",
      "",
      "        if current_user.role != \"${2:admin}\":",
      "            abort(403)",
      "",
      "        return view(*args, **kwargs)",
      "",
      "    return wrapped_view"
    ],
    tags: [ "admin", "roles", "authorization", "decorator" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:permission-decorator",
    name: "Permission Required Decorator",
    prefix: "permissionrequired",
    category: "authentication",
    description: "Restrict access based on a named user permission. Requires a has_permission() method on your user model.",
    body: [
      "from functools import wraps",
      "from flask import abort",
      "from flask_login import current_user",
      "",
      "def ${1:permission_required}(permission):",
      "    def decorator(view):",
      "        @wraps(view)",
      "        def wrapped_view(*args, **kwargs):",
      "            if not current_user.is_authenticated:",
      "                abort(401)",
      "",
      "            if not current_user.has_permission(permission):",
      "                abort(403)",
      "",
      "            return view(*args, **kwargs)",
      "",
      "        return wrapped_view",
      "",
      "    return decorator"
    ],
    tags: [ "permissions", "authorization", "decorator" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:password-change",
    name: "Change Password",
    prefix: "passwordchange",
    category: "authentication",
    description: "Verify the current password before saving a new password hash.",
    body: [
      "from werkzeug.security import generate_password_hash, check_password_hash",
      "from app.extensions import db",
      "",
      "if check_password_hash(${1:user}.password_hash, ${2:current_password}):",
      "    ${1:user}.password_hash = generate_password_hash(${3:new_password})",
      "    db.session.commit()",
      "else:",
      "    ${4:raise ValueError(\"Current password is incorrect\")}"
    ],
    tags: [ "password", "security", "update" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:logout-all",
    name: "Clear Login Session",
    prefix: "clearsession",
    category: "authentication",
    description: "Log out the current user and clear the Flask session.",
    body: [
      "from flask import session",
      "from flask_login import logout_user",
      "",
      "logout_user()",
      "session.clear()"
    ],
    tags: [ "logout", "session", "authentication" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:anonymous-check",
    name: "Check Authentication Status",
    prefix: "isauthenticated",
    category: "authentication",
    description: "Check whether the current user is authenticated.",
    body: [
      "from flask_login import current_user",
      "",
      "if current_user.is_authenticated:",
      "    ${1:pass}",
      "else:",
      "    ${2:pass}"
    ],
    tags: [ "login", "authentication", "condition" ],
    scope: [ "python" ]
  },

  // Flask-Login configuration
  {
    id: "authentication:login-manager-config",
    name: "Configure Login Manager",
    prefix: "loginmanagerconfig",
    category: "authentication",
    description: "Configure the Flask-Login manager and its login view.",
    body: [
      "login_manager.login_view = '${1:auth.login}'",
      "login_manager.login_message = '${2:Please log in to access this page.}'",
      "login_manager.login_message_category = '${3:info}'"
    ],
    tags: [ "flask-login", "configuration", "login" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:login-manager-init",
    name: "Initialize Login Manager",
    prefix: "loginmanagerinit",
    category: "authentication",
    description: "Initialize Flask-Login with the Flask application.",
    body: [
      "from flask_login import LoginManager",
      "",
      "login_manager = LoginManager()",
      "",
      "def init_login_manager(app):",
      "    login_manager.init_app(app)"
    ],
    tags: [ "flask-login", "initialization", "factory" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:unauthorized-handler",
    name: "Unauthorized Handler",
    prefix: "unauthorizedhandler",
    category: "authentication",
    description: "Customize the response when an unauthenticated user accesses a protected route.",
    body: [
      "from flask import redirect, url_for, request",
      "",
      "@login_manager.unauthorized_handler",
      "def handle_unauthorized():",
      "    return redirect(url_for('${1:auth.login}'))"
    ],
    tags: [ "flask-login", "unauthorized", "handler" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:needs-refresh-handler",
    name: "Needs Refresh Handler",
    prefix: "needsrefreshhandler",
    category: "authentication",
    description: "Customize the response when a fresh login is required.",
    body: [
      "from flask import redirect, url_for",
      "",
      "@login_manager.needs_refresh_handler",
      "def handle_needs_refresh():",
      "    return redirect(url_for('${1:auth.reauthenticate}'))"
    ],
    tags: [ "flask-login", "session", "handler" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:session-protection",
    name: "Configure Session Protection",
    prefix: "sessionprotection",
    category: "authentication",
    description: "Enable Flask-Login session protection.",
    body: [
      "login_manager.session_protection = '${1:strong}'"
    ],
    tags: [ "flask-login", "session", "security" ],
    scope: [ "python" ]
  },

  // Remember-me and fresh authentication
  {
    id: "authentication:remember-login",
    name: "Remember Me Login",
    prefix: "rememberlogin",
    category: "authentication",
    description: "Create a persistent Flask-Login session when the remember-me option is selected.",
    body: [
      "from flask_login import login_user",
      "",
      "remember = ${1:request.form.get('remember') == 'on'}",
      "login_user(${2:user}, remember=remember)"
    ],
    tags: [ "login", "remember-me", "session" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:fresh-login-required",
    name: "Require Fresh Login",
    prefix: "freshloginrequired",
    category: "authentication",
    description: "Require a recently authenticated session for sensitive operations.",
    body: [
      "from flask_login import fresh_login_required",
      "",
      "@${1:auth_bp}.route('${2:/account/security}')",
      "@fresh_login_required",
      "def ${3:security_settings}():",
      "    ${4:pass}"
    ],
    tags: [ "flask-login", "fresh-login", "security" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:confirm-login",
    name: "Confirm Fresh Login",
    prefix: "confirmlogin",
    category: "authentication",
    description: "Mark the current Flask-Login session as fresh after verifying the user's credentials.",
    body: [
      "from flask_login import confirm_login",
      "from werkzeug.security import check_password_hash",
      "",
      "if check_password_hash(${1:current_user.password_hash}, ${2:password}):",
      "    confirm_login()",
      "    ${3:return redirect(url_for('main.index'))}"
    ],
    tags: [ "flask-login", "fresh-login", "verification" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:reauthenticate-route",
    name: "Reauthentication Route",
    prefix: "reauthroute",
    category: "authentication",
    description: "Verify the current user's password and refresh their login session.",
    body: [
      "from flask import request, redirect, url_for, render_template, flash",
      "from flask_login import login_required, current_user, confirm_login",
      "from werkzeug.security import check_password_hash",
      "",
      "@${1:auth_bp}.route('${2:/reauthenticate}', methods=['GET', 'POST'])",
      "@login_required",
      "def ${3:reauthenticate}():",
      "    if request.method == 'POST':",
      "        password = request.form.get('password', '')",
      "",
      "        if check_password_hash(current_user.password_hash, password):",
      "            confirm_login()",
      "            return redirect(url_for('${4:main.index}'))",
      "",
      "        flash('Incorrect password.', 'error')",
      "",
      "    return render_template('${5:auth/reauthenticate.html}')"
    ],
    tags: [ "reauthentication", "fresh-login", "route" ],
    scope: [ "python" ]
  },

  // Password reset tokens
  {
    id: "authentication:password-reset-token-create",
    name: "Generate Password Reset Token",
    prefix: "passwordresettoken",
    category: "authentication",
    description: "Generate a time-limited signed password reset token using itsdangerous.",
    body: [
      "from itsdangerous import URLSafeTimedSerializer",
      "from flask import current_app",
      "",
      "serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])",
      "token = serializer.dumps(${1:user.id}, salt='password-reset')"
    ],
    tags: [ "password", "reset", "token", "security" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:password-reset-token-verify",
    name: "Verify Password Reset Token",
    prefix: "verifyresettoken",
    category: "authentication",
    description: "Validate a password reset token with an expiration time.",
    body: [
      "from itsdangerous import URLSafeTimedSerializer, BadSignature",
      "from flask import current_app",
      "",
      "serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])",
      "",
      "try:",
      "    user_id = serializer.loads(",
      "        ${1:token},",
      "        salt='password-reset',",
      "        max_age=${2:3600}",
      "    )",
      "except BadSignature:",
      "    user_id = None"
    ],
    tags: [ "password", "reset", "token", "verification" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:password-reset-save",
    name: "Save New Password",
    prefix: "passwordresetsave",
    category: "authentication",
    description: "Save a new password hash after validating the reset token.",
    body: [
      "from werkzeug.security import generate_password_hash",
      "from app.extensions import db",
      "",
      "${1:user}.password_hash = generate_password_hash(${2:new_password})",
      "db.session.commit()"
    ],
    tags: [ "password", "reset", "database" ],
    scope: [ "python" ]
  },

  // Email verification
  {
    id: "authentication:email-verification-token",
    name: "Generate Email Verification Token",
    prefix: "emailverifytoken",
    category: "authentication",
    description: "Generate a signed token for email address verification.",
    body: [
      "from itsdangerous import URLSafeTimedSerializer",
      "from flask import current_app",
      "",
      "serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])",
      "token = serializer.dumps(${1:user.email}, salt='email-verification')"
    ],
    tags: [ "email", "verification", "token" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:email-verification-check",
    name: "Verify Email Token",
    prefix: "checkemailtoken",
    category: "authentication",
    description: "Validate an email verification token with an expiration time.",
    body: [
      "from itsdangerous import URLSafeTimedSerializer, BadSignature",
      "from flask import current_app",
      "",
      "serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])",
      "",
      "try:",
      "    email = serializer.loads(",
      "        ${1:token},",
      "        salt='email-verification',",
      "        max_age=${2:86400}",
      "    )",
      "except BadSignature:",
      "    email = None"
    ],
    tags: [ "email", "verification", "token" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:email-mark-verified",
    name: "Mark Email as Verified",
    prefix: "markemailverified",
    category: "authentication",
    description: "Mark a user's email address as verified and save the change.",
    body: [
      "from app.extensions import db",
      "",
      "${1:user}.is_verified = True",
      "db.session.commit()"
    ],
    tags: [ "email", "verification", "database" ],
    scope: [ "python" ]
  },

  // Request-based authentication
  {
    id: "authentication:request-loader",
    name: "Flask-Login Request Loader",
    prefix: "authrequestloader",
    category: "authentication",
    description: "Load a user from an incoming request, commonly for API authentication.",
    body: [
      "from flask import request",
      "from app.models import ${1:User}",
      "",
      "@login_manager.request_loader",
      "def load_user_from_request(req):",
      "    token = req.headers.get('Authorization', '')",
      "",
      "    if not token.startswith('Bearer '):",
      "        return None",
      "",
      "    token = token.removeprefix('Bearer ')",
      "    return ${1:User}.verify_auth_token(token)"
    ],
    tags: [ "api", "request", "token", "authentication" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:token-create",
    name: "Generate Random Authentication Token",
    prefix: "authtokencreate",
    category: "authentication",
    description: "Generate a cryptographically secure random token.",
    body: [
      "import secrets",
      "",
      "${1:token} = secrets.token_urlsafe(${2:32})"
    ],
    tags: [ "token", "security", "api" ],
    scope: [ "python" ]
  },
  {
    id: "authentication:token-compare",
    name: "Compare Authentication Tokens",
    prefix: "authtokencompare",
    category: "authentication",
    description: "Compare authentication tokens using a constant-time comparison.",
    body: [
      "import secrets",
      "",
      "if secrets.compare_digest(${1:provided_token}, ${2:stored_token}):",
      "    ${3:pass}"
    ],
    tags: [ "token", "security", "comparison" ],
    scope: [ "python" ]
  }
];

export default authenticationSnippets;
