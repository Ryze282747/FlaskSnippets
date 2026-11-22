
const extensionSnippets = [
  {
    id: "extensions:sqlalchemy-import",
    name: "Import Flask-SQLAlchemy",
    prefix: "sqlalchemyimport",
    category: "extensions",
    description: "Import SQLAlchemy and create the database extension instance.",
    body: [
      "from flask_sqlalchemy import SQLAlchemy",
      "",
      "db = SQLAlchemy()"
    ],
    tags: [ "sqlalchemy", "database", "import" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:sqlalchemy-init",
    name: "Initialize SQLAlchemy",
    prefix: "dbinit",
    category: "extensions",
    description: "Initialize Flask-SQLAlchemy with the application.",
    body: [
      "from app.extensions import db",
      "",
      "db.init_app(${1:app})"
    ],
    tags: [ "sqlalchemy", "database", "init" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:sqlalchemy-model",
    name: "SQLAlchemy Model",
    prefix: "dbmodel",
    category: "extensions",
    description: "Create a Flask-SQLAlchemy model with common columns.",
    body: [
      "from app.extensions import db",
      "",
      "class ${1:User}(db.Model):",
      "    __tablename__ = \"${2:users}\"",
      "",
      "    id = db.Column(db.Integer, primary_key=True)",
      "    ${3:name} = db.Column(db.String(${4:120}), nullable=False)",
      "    created_at = db.Column(",
      "        db.DateTime,",
      "        server_default=db.func.now(),",
      "        nullable=False",
      "    )",
      "",
      "    def __repr__(self):",
      "        return f\"<${1:User} {self.id}>\""
    ],
    tags: [ "sqlalchemy", "model", "database" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:sqlalchemy-relationship",
    name: "SQLAlchemy Relationship",
    prefix: "dbrelationship",
    category: "extensions",
    description: "Define a one-to-many SQLAlchemy relationship. Add a matching foreign key and back_populates relationship to the related model.",
    body: [
      "${1:posts} = db.relationship(",
      "    \"${2:Post}\",",
      "    back_populates=\"${3:author}\"",
      ")"
    ],
    tags: [ "sqlalchemy", "relationship", "database" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:sqlalchemy-transaction",
    name: "Database Transaction",
    prefix: "dbtransaction",
    category: "extensions",
    description: "Commit a database transaction and roll it back if an error occurs.",
    body: [
      "try:",
      "    db.session.add(${1:instance})",
      "    db.session.commit()",
      "except Exception:",
      "    db.session.rollback()",
      "    raise"
    ],
    tags: [ "sqlalchemy", "transaction", "database" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:migrate-import",
    name: "Import Flask-Migrate",
    prefix: "migrateimport",
    category: "extensions",
    description: "Create the Flask-Migrate extension instance.",
    body: [
      "from flask_migrate import Migrate",
      "",
      "migrate = Migrate()"
    ],
    tags: [ "migrate", "database", "import" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:migrate-init",
    name: "Initialize Flask-Migrate",
    prefix: "migrateinit",
    category: "extensions",
    description: "Connect Flask-Migrate to the application and database.",
    body: [
      "from app.extensions import db, migrate",
      "",
      "migrate.init_app(${1:app}, db)"
    ],
    tags: [ "migrate", "database", "init" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:migrate-command",
    name: "Migration Command Reference",
    prefix: "migratecommands",
    category: "extensions",
    description: "Common Flask-Migrate CLI commands.",
    body: [
      "# Initialize migrations (once per project):",
      "# flask db init",
      "",
      "# Generate a migration:",
      "# flask db migrate -m \"${1:describe changes}\"",
      "",
      "# Apply migrations:",
      "# flask db upgrade",
      "",
      "# Roll back one migration:",
      "# flask db downgrade"
    ],
    tags: [ "migrate", "database", "commands" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:login-import",
    name: "Import Flask-Login",
    prefix: "loginimport",
    category: "extensions",
    description: "Create a Flask-Login manager instance.",
    body: [
      "from flask_login import LoginManager",
      "",
      "login_manager = LoginManager()"
    ],
    tags: [ "login", "authentication", "import" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:login-init",
    name: "Initialize Flask-Login",
    prefix: "logininit",
    category: "extensions",
    description: "Configure Flask-Login for the application.",
    body: [
      "from app.extensions import login_manager",
      "",
      "login_manager.init_app(${1:app})",
      "login_manager.login_view = \"${2:auth.login}\"",
      "login_manager.login_message_category = \"${3:info}\""
    ],
    tags: [ "login", "authentication", "init" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:login-user-loader",
    name: "Flask-Login User Loader",
    prefix: "userloader",
    category: "extensions",
    description: "Load a user from the database using their ID.",
    body: [
      "from app.extensions import login_manager, db",
      "from app.models import ${1:User}",
      "",
      "@login_manager.user_loader",
      "def load_user(user_id):",
      "    try:",
      "        return db.session.get(${1:User}, int(user_id))",
      "    except (TypeError, ValueError):",
      "        return None"
    ],
    tags: [ "login", "authentication", "user-loader" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:login-required",
    name: "Login Required Route",
    prefix: "loginrequired",
    category: "extensions",
    description: "Protect a Flask route so only authenticated users can access it.",
    body: [
      "from flask_login import login_required",
      "",
      "@${1:bp}.route(\"${2:/dashboard}\")",
      "@login_required",
      "def ${3:dashboard}():",
      "    return ${4:render_template(\"dashboard.html\")}"
    ],
    tags: [ "login", "authentication", "route" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:login-user-actions",
    name: "Flask-Login User Actions",
    prefix: "loginactions",
    category: "extensions",
    description: "Log in, log out, and access the current user.",
    body: [
      "from flask_login import login_user, logout_user, current_user",
      "",
      "# Log in:",
      "login_user(${1:user})",
      "",
      "# Access the current user:",
      "current_user",
      "",
      "# Log out:",
      "logout_user()"
    ],
    tags: [ "login", "authentication", "session" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:wtf-import",
    name: "Import Flask-WTF",
    prefix: "wtfimport",
    category: "extensions",
    description: "Import Flask-WTF form tools and validators.",
    body: [
      "from flask_wtf import FlaskForm",
      "from wtforms import StringField, PasswordField, SubmitField",
      "from wtforms.validators import DataRequired, Length"
    ],
    tags: [ "wtf", "forms", "validation", "import" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:wtf-form",
    name: "Flask-WTF Form",
    prefix: "wtfform",
    category: "extensions",
    description: "Create a validated Flask-WTF form.",
    body: [
      "from flask_wtf import FlaskForm",
      "from wtforms import StringField, SubmitField",
      "from wtforms.validators import DataRequired, Length",
      "",
      "class ${1:ExampleForm}(FlaskForm):",
      "    ${2:name} = StringField(",
      "        \"${3:Name}\",",
      "        validators=[DataRequired(), Length(max=${4:120})]",
      "    )",
      "    submit = SubmitField(\"${5:Submit}\")"
    ],
    tags: [ "wtf", "forms", "validation" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:wtf-csrf",
    name: "Enable Flask-WTF CSRF",
    prefix: "wtfcsrf",
    category: "extensions",
    description: "Configure CSRF protection using Flask-WTF.",
    body: [
      "from flask_wtf.csrf import CSRFProtect",
      "",
      "csrf = CSRFProtect()",
      "csrf.init_app(${1:app})"
    ],
    tags: [ "wtf", "csrf", "security" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:cors-import",
    name: "Import Flask-CORS",
    prefix: "corsimport",
    category: "extensions",
    description: "Import Flask-CORS.",
    body: [
      "from flask_cors import CORS"
    ],
    tags: [ "cors", "api", "import" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:cors-config",
    name: "Configure Flask-CORS",
    prefix: "corsconfig",
    category: "extensions",
    description: "Allow configured origins to access API routes.",
    body: [
      "from flask_cors import CORS",
      "",
      "CORS(",
      "    ${1:app},",
      "    resources={",
      "        r\"/api/*\": {",
      "            \"origins\": [\"${2:https://example.com}\"]",
      "        }",
      "    }",
      ")"
    ],
    tags: [ "cors", "api", "security", "configuration" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:mail-import",
    name: "Import Flask-Mail",
    prefix: "mailimport",
    category: "extensions",
    description: "Create a Flask-Mail extension instance.",
    body: [
      "from flask_mail import Mail, Message",
      "",
      "mail = Mail()"
    ],
    tags: [ "mail", "email", "import" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:mail-init",
    name: "Initialize Flask-Mail",
    prefix: "mailinit",
    category: "extensions",
    description: "Initialize Flask-Mail with the application.",
    body: [
      "from app.extensions import mail",
      "",
      "mail.init_app(${1:app})"
    ],
    tags: [ "mail", "email", "init" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:mail-send",
    name: "Send Email",
    prefix: "mailsend",
    category: "extensions",
    description: "Create and send an email using Flask-Mail.",
    body: [
      "from flask_mail import Message",
      "from app.extensions import mail",
      "",
      "message = Message(",
      "    subject=\"${1:Subject}\",",
      "    recipients=[\"${2:recipient@example.com}\"],",
      "    body=\"${3:Email body}\"",
      ")",
      "",
      "mail.send(message)"
    ],
    tags: [ "mail", "email", "send" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:limiter-import",
    name: "Import Flask-Limiter",
    prefix: "limiterimport",
    category: "extensions",
    description: "Create a Flask-Limiter instance.",
    body: [
      "from flask_limiter import Limiter",
      "from flask_limiter.util import get_remote_address",
      "",
      "limiter = Limiter(",
      "    key_func=get_remote_address",
      ")"
    ],
    tags: [ "limiter", "rate-limit", "import" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:limiter-init",
    name: "Initialize Flask-Limiter",
    prefix: "limiterinit",
    category: "extensions",
    description: "Initialize Flask-Limiter with the application.",
    body: [
      "from app.extensions import limiter",
      "",
      "limiter.init_app(${1:app})"
    ],
    tags: [ "limiter", "rate-limit", "init" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:limiter-route",
    name: "Rate-Limited Route",
    prefix: "ratelimit",
    category: "extensions",
    description: "Apply a rate limit to a Flask route.",
    body: [
      "@${1:bp}.route(\"${2:/api/resource}\")",
      "@limiter.limit(\"${3:10 per minute}\")",
      "def ${4:resource}():",
      "    return ${5:jsonify({\"message\": \"OK\"})}"
    ],
    tags: [ "limiter", "rate-limit", "route" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:marshmallow-import",
    name: "Import Flask-Marshmallow",
    prefix: "marshmallowimport",
    category: "extensions",
    description: "Create a Flask-Marshmallow extension instance.",
    body: [
      "from flask_marshmallow import Marshmallow",
      "",
      "ma = Marshmallow()"
    ],
    tags: [ "marshmallow", "serialization", "import" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:marshmallow-init",
    name: "Initialize Flask-Marshmallow",
    prefix: "marshmallowinit",
    category: "extensions",
    description: "Initialize Flask-Marshmallow with the application.",
    body: [
      "from app.extensions import ma",
      "",
      "ma.init_app(${1:app})"
    ],
    tags: [ "marshmallow", "serialization", "init" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:marshmallow-schema",
    name: "SQLAlchemy Auto Schema",
    prefix: "sqlaschema",
    category: "extensions",
    description: "Create a Marshmallow schema for a SQLAlchemy model.",
    body: [
      "from app.extensions import ma",
      "from app.models import ${1:User}",
      "",
      "class ${2:UserSchema}(ma.SQLAlchemyAutoSchema):",
      "    class Meta:",
      "        model = ${1:User}",
      "        load_instance = True"
    ],
    tags: [ "marshmallow", "schema", "sqlalchemy", "serialization" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:cache-import",
    name: "Import Flask-Caching",
    prefix: "cacheimport",
    category: "extensions",
    description: "Create a Flask-Caching instance.",
    body: [
      "from flask_caching import Cache",
      "",
      "cache = Cache()"
    ],
    tags: [ "cache", "performance", "import" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:cache-init",
    name: "Initialize Flask-Caching",
    prefix: "cacheinit",
    category: "extensions",
    description: "Initialize caching with the Flask application.",
    body: [
      "from app.extensions import cache",
      "",
      "cache.init_app(${1:app}, config={",
      "    \"CACHE_TYPE\": \"${2:SimpleCache}\",",
      "    \"CACHE_DEFAULT_TIMEOUT\": ${3:300}",
      "})"
    ],
    tags: [ "cache", "performance", "configuration" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:cache-route",
    name: "Cache Route Response",
    prefix: "cacheview",
    category: "extensions",
    description: "Cache the response from a Flask view.",
    body: [
      "@${1:cache}.cached(timeout=${2:300})",
      "def ${3:expensive_view}():",
      "    ${4:return \"Cached response\"}"
    ],
    tags: [ "cache", "performance", "route" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:cache-function",
    name: "Cache Function Result",
    prefix: "cachememoize",
    category: "extensions",
    description: "Cache the result of a function using Flask-Caching.",
    body: [
      "@cache.memoize(timeout=${1:300})",
      "def ${2:get_data}(${3:item_id}):",
      "    ${4:return load_data(item_id)}"
    ],
    tags: [ "cache", "memoize", "performance" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:cache-clear",
    name: "Clear Application Cache",
    prefix: "cacheclear",
    category: "extensions",
    description: "Clear all cached values.",
    body: [
      "cache.clear()"
    ],
    tags: [ "cache", "clear", "maintenance" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:socketio-import",
    name: "Import Flask-SocketIO",
    prefix: "socketioimport",
    category: "extensions",
    description: "Create a Flask-SocketIO instance.",
    body: [
      "from flask_socketio import SocketIO",
      "",
      "socketio = SocketIO()"
    ],
    tags: [ "socketio", "websocket", "realtime" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:socketio-init",
    name: "Initialize Flask-SocketIO",
    prefix: "socketioinit",
    category: "extensions",
    description: "Initialize Socket.IO with the Flask application.",
    body: [
      "from app.extensions import socketio",
      "",
      "socketio.init_app(${1:app}, cors_allowed_origins=${2:[]})"
    ],
    tags: [ "socketio", "websocket", "initialization" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:socketio-event",
    name: "Register Socket.IO Event",
    prefix: "socketioevent",
    category: "extensions",
    description: "Register a handler for an incoming Socket.IO event.",
    body: [
      "from flask_socketio import emit",
      "",
      "@socketio.on(\"${1:message}\")",
      "def ${2:handle_message}(data):",
      "    emit(\"${3:response}\", {",
      "        \"message\": data",
      "    })"
    ],
    tags: [ "socketio", "event", "realtime" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:socketio-emit",
    name: "Emit Socket.IO Event",
    prefix: "socketioemit",
    category: "extensions",
    description: "Send an event to connected Socket.IO clients.",
    body: [
      "socketio.emit(",
      "    \"${1:notification}\",",
      "    {\"message\": \"${2:Hello}\"},",
      "    room=${3:room_id}",
      ")"
    ],
    tags: [ "socketio", "emit", "realtime" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:socketio-run",
    name: "Run Socket.IO Server",
    prefix: "socketiorun",
    category: "extensions",
    description: "Start the Flask application using the Socket.IO server.",
    body: [
      "if __name__ == \"__main__\":",
      "    socketio.run(",
      "        app,",
      "        host=\"${1:127.0.0.1}\",",
      "        port=${2:5000},",
      "        debug=${3:True}",
      "    )"
    ],
    tags: [ "socketio", "server", "run" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:jwt-import",
    name: "Import Flask-JWT-Extended",
    prefix: "jwtimport",
    category: "extensions",
    description: "Create a Flask-JWT-Extended instance.",
    body: [
      "from flask_jwt_extended import JWTManager",
      "",
      "jwt = JWTManager()"
    ],
    tags: [ "jwt", "authentication", "import" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:jwt-init",
    name: "Initialize Flask-JWT-Extended",
    prefix: "jwtinit",
    category: "extensions",
    description: "Initialize JWT authentication with the Flask application.",
    body: [
      "from app.extensions import jwt",
      "",
      "jwt.init_app(${1:app})"
    ],
    tags: [ "jwt", "authentication", "initialization" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:jwt-create",
    name: "Create JWT Access Token",
    prefix: "jwtcreate",
    category: "extensions",
    description: "Create an access token for an authenticated identity.",
    body: [
      "from flask_jwt_extended import create_access_token",
      "",
      "access_token = create_access_token(",
      "    identity=str(${1:user.id})",
      ")"
    ],
    tags: [ "jwt", "token", "authentication" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:jwt-protect",
    name: "Protect JWT Route",
    prefix: "jwtprotect",
    category: "extensions",
    description: "Require a valid JWT access token to access a route.",
    body: [
      "from flask_jwt_extended import jwt_required, get_jwt_identity",
      "",
      "@${1:bp}.route(\"${2:/api/profile}\")",
      "@jwt_required()",
      "def ${3:profile}():",
      "    current_identity = get_jwt_identity()",
      "    return {\"identity\": current_identity}"
    ],
    tags: [ "jwt", "authentication", "route" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:jwt-refresh",
    name: "Create JWT Refresh Token",
    prefix: "jwtrefresh",
    category: "extensions",
    description: "Create a refresh token for renewing access tokens.",
    body: [
      "from flask_jwt_extended import create_refresh_token",
      "",
      "refresh_token = create_refresh_token(",
      "    identity=str(${1:user.id})",
      ")"
    ],
    tags: [ "jwt", "refresh-token", "authentication" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:jwt-refresh-route",
    name: "JWT Token Refresh Route",
    prefix: "jwtrefreshroute",
    category: "extensions",
    description: "Create a route that issues a new access token from a valid refresh token.",
    body: [
      "from flask import jsonify",
      "from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token",
      "",
      "@${1:bp}.route(\"${2:/api/refresh}\", methods=[\"POST\"])",
      "@jwt_required(refresh=True)",
      "def ${3:refresh}():",
      "    identity = get_jwt_identity()",
      "    access_token = create_access_token(identity=identity)",
      "    return jsonify(access_token=access_token)"
    ],
    tags: [ "jwt", "refresh-token", "route" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:bcrypt-import",
    name: "Import Flask-Bcrypt",
    prefix: "bcryptimport",
    category: "extensions",
    description: "Create a Flask-Bcrypt instance.",
    body: [
      "from flask_bcrypt import Bcrypt",
      "",
      "bcrypt = Bcrypt()"
    ],
    tags: [ "bcrypt", "password", "security" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:bcrypt-init",
    name: "Initialize Flask-Bcrypt",
    prefix: "bcryptinit",
    category: "extensions",
    description: "Initialize Flask-Bcrypt with the application.",
    body: [
      "from app.extensions import bcrypt",
      "",
      "bcrypt.init_app(${1:app})"
    ],
    tags: [ "bcrypt", "password", "initialization" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:bcrypt-hash",
    name: "Generate Bcrypt Password Hash",
    prefix: "bcryptgenerate",
    category: "extensions",
    description: "Generate a password hash using Flask-Bcrypt.",
    body: [
      "password_hash = bcrypt.generate_password_hash(",
      "    ${1:password}",
      ").decode(\"utf-8\")"
    ],
    tags: [ "bcrypt", "password", "hashing" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:bcrypt-check",
    name: "Verify Bcrypt Password",
    prefix: "bcryptcheck",
    category: "extensions",
    description: "Check a password against a stored Bcrypt hash.",
    body: [
      "if bcrypt.check_password_hash(${1:user.password_hash}, ${2:password}):",
      "    ${3:pass}"
    ],
    tags: [ "bcrypt", "password", "verification" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:session-import",
    name: "Import Flask-Session",
    prefix: "sessionimport",
    category: "extensions",
    description: "Import the Flask-Session extension.",
    body: [
      "from flask_session import Session",
      "",
      "session_ext = Session()"
    ],
    tags: [ "session", "storage", "import" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:session-init",
    name: "Initialize Flask-Session",
    prefix: "sessioninit",
    category: "extensions",
    description: "Configure server-side session storage.",
    body: [
      "from app.extensions import session_ext",
      "",
      "${1:app}.config[\"SESSION_TYPE\"] = \"${2:filesystem}\"",
      "session_ext.init_app(${1:app})"
    ],
    tags: [ "session", "storage", "configuration" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:compress-import",
    name: "Import Flask-Compress",
    prefix: "compressimport",
    category: "extensions",
    description: "Create a Flask-Compress instance.",
    body: [
      "from flask_compress import Compress",
      "",
      "compress = Compress()"
    ],
    tags: [ "compression", "performance", "import" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:compress-init",
    name: "Initialize Flask-Compress",
    prefix: "compressinit",
    category: "extensions",
    description: "Enable response compression for the Flask application.",
    body: [
      "from app.extensions import compress",
      "",
      "compress.init_app(${1:app})"
    ],
    tags: [ "compression", "performance", "initialization" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:talisman-import",
    name: "Import Flask-Talisman",
    prefix: "talismanimport",
    category: "extensions",
    description: "Import Flask-Talisman for HTTP security headers.",
    body: [
      "from flask_talisman import Talisman"
    ],
    tags: [ "security", "headers", "import" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:talisman-config",
    name: "Configure Flask-Talisman",
    prefix: "talismanconfig",
    category: "extensions",
    description: "Configure HTTP security headers and HTTPS behavior.",
    body: [
      "Talisman(",
      "    ${1:app},",
      "    force_https=${2:True},",
      "    content_security_policy=${3:None}",
      ")"
    ],
    tags: [ "security", "https", "headers" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:babel-import",
    name: "Import Flask-Babel",
    prefix: "babelimport",
    category: "extensions",
    description: "Create a Flask-Babel instance.",
    body: [
      "from flask_babel import Babel",
      "",
      "babel = Babel()"
    ],
    tags: [ "babel", "translation", "localization" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:babel-init",
    name: "Initialize Flask-Babel",
    prefix: "babelinit",
    category: "extensions",
    description: "Initialize Flask-Babel with the Flask application.",
    body: [
      "from app.extensions import babel",
      "",
      "babel.init_app(${1:app})"
    ],
    tags: [ "babel", "translation", "initialization" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:babel-translate",
    name: "Translate Text",
    prefix: "babeltranslate",
    category: "extensions",
    description: "Mark a string for translation using Flask-Babel.",
    body: [
      "from flask_babel import gettext",
      "",
      "${1:translated_text} = gettext(\"${2:Hello, world!}\")"
    ],
    tags: [ "babel", "translation", "localization" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:babel-lazy-translate",
    name: "Lazy Translate Text",
    prefix: "babellazy",
    category: "extensions",
    description: "Create a lazily evaluated translated string.",
    body: [
      "from flask_babel import lazy_gettext",
      "",
      "${1:label} = lazy_gettext(\"${2:Username}\")"
    ],
    tags: [ "babel", "translation", "lazy" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:admin-import",
    name: "Import Flask-Admin",
    prefix: "adminimport",
    category: "extensions",
    description: "Create a Flask-Admin instance.",
    body: [
      "from flask_admin import Admin",
      "",
      "admin = Admin(name=\"${1:Administration}\")"
    ],
    tags: [ "admin", "dashboard", "import" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:admin-init",
    name: "Initialize Flask-Admin",
    prefix: "admininit",
    category: "extensions",
    description: "Initialize Flask-Admin with the Flask application.",
    body: [
      "from app.extensions import admin",
      "",
      "admin.init_app(${1:app})"
    ],
    tags: [ "admin", "dashboard", "initialization" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:admin-model-view",
    name: "Register Admin Model View",
    prefix: "adminmodelview",
    category: "extensions",
    description: "Add a SQLAlchemy model to the Flask-Admin interface.",
    body: [
      "from flask_admin.contrib.sqla import ModelView",
      "from app.extensions import admin, db",
      "from app.models import ${1:User}",
      "",
      "admin.add_view(ModelView(${1:User}, db.session))"
    ],
    tags: [ "admin", "model", "sqlalchemy" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:apscheduler-import",
    name: "Import Flask-APScheduler",
    prefix: "schedulerimport",
    category: "extensions",
    description: "Create a Flask-APScheduler instance.",
    body: [
      "from flask_apscheduler import APScheduler",
      "",
      "scheduler = APScheduler()"
    ],
    tags: [ "scheduler", "tasks", "background" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:apscheduler-init",
    name: "Initialize Flask-APScheduler",
    prefix: "schedulerinit",
    category: "extensions",
    description: "Initialize the task scheduler with the Flask application.",
    body: [
      "from app.extensions import scheduler",
      "",
      "scheduler.init_app(${1:app})",
      "scheduler.start()"
    ],
    tags: [ "scheduler", "tasks", "initialization" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:apscheduler-job",
    name: "Register Scheduled Job",
    prefix: "schedulerjob",
    category: "extensions",
    description: "Register a recurring scheduled task.",
    body: [
      "@scheduler.task(",
      "    \"interval\",",
      "    id=\"${1:cleanup_job}\",",
      "    seconds=${2:60}",
      ")",
      "def ${3:cleanup}():",
      "    ${4:print(\"Running scheduled task\")}"
    ],
    tags: [ "scheduler", "tasks", "interval" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:restful-import",
    name: "Import Flask-RESTful",
    prefix: "restfulimport",
    category: "extensions",
    description: "Create a Flask-RESTful API instance.",
    body: [
      "from flask_restful import Api",
      "",
      "api = Api()"
    ],
    tags: [ "restful", "api", "import" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:restful-init",
    name: "Initialize Flask-RESTful",
    prefix: "restfulinit",
    category: "extensions",
    description: "Attach Flask-RESTful to the Flask application.",
    body: [
      "from app.extensions import api",
      "",
      "api.init_app(${1:app})"
    ],
    tags: [ "restful", "api", "initialization" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:restful-resource",
    name: "Create RESTful Resource",
    prefix: "restfulresource",
    category: "extensions",
    description: "Create a Flask-RESTful resource with GET and POST methods.",
    body: [
      "from flask_restful import Resource",
      "",
      "class ${1:ItemResource}(Resource):",
      "    def get(self, ${2:item_id}):",
      "        return {\"id\": ${2:item_id}}",
      "",
      "    def post(self):",
      "        ${3:return {\"message\": \"Created\"}, 201}"
    ],
    tags: [ "restful", "resource", "api" ],
    scope: [ "python" ]
  },
  {
    id: "extensions:restful-add-resource",
    name: "Register RESTful Resource",
    prefix: "restfuladd",
    category: "extensions",
    description: "Register a resource class with a Flask-RESTful API.",
    body: [
      "api.add_resource(${1:ItemResource}, \"${2:/items}\")"
    ],
    tags: [ "restful", "resource", "registration" ],
    scope: [ "python" ]
  }
];

export default extensionSnippets;
