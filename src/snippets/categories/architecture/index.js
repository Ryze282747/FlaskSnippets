
const architectureSnippets = [
  {
    id: "flask:blueprint",
    name: "Create Blueprint",
    prefix: "blueprint",
    category: "architecture",
    description: "Create a Flask blueprint.",
    tags: [ "blueprint", "architecture", "modular" ],
    scope: [ "python" ],
    body: [
      "from flask import Blueprint",
      "",
      "${1:main}_bp = Blueprint(",
      "    '${2:main}',",
      "    __name__",
      ")"
    ]
  },
  {
    id: "flask:blueprint-prefix",
    name: "Blueprint With URL Prefix",
    prefix: "blueprintprefix",
    category: "architecture",
    description: "Create a blueprint with a URL prefix.",
    tags: [ "blueprint", "url", "prefix" ],
    scope: [ "python" ],
    body: [
      "from flask import Blueprint",
      "",
      "${1:auth}_bp = Blueprint(",
      "    '${2:auth}',",
      "    __name__,",
      "    url_prefix='/${3:auth}'",
      ")"
    ]
  },
  {
    id: "flask:blueprint-register",
    name: "Register Blueprint",
    prefix: "registerblueprint",
    category: "architecture",
    description: "Register a blueprint with the Flask application.",
    tags: [ "blueprint", "registration" ],
    scope: [ "python" ],
    body: [
      "app.register_blueprint(${1:main_bp})"
    ]
  },
  {
    id: "flask:blueprint-import",
    name: "Import and Register Blueprint",
    prefix: "importblueprint",
    category: "architecture",
    description: "Import and register a blueprint inside create_app.",
    tags: [ "blueprint", "factory", "registration" ],
    scope: [ "python" ],
    body: [
      "from app.${1:main} import ${2:main_bp}",
      "",
      "app.register_blueprint(${2:main_bp})"
    ]
  },
  {
    id: "flask:blueprint-routes",
    name: "Blueprint Routes",
    prefix: "blueprintroutes",
    category: "architecture",
    description: "Create routes inside a blueprint module.",
    tags: [ "blueprint", "routes", "views" ],
    scope: [ "python" ],
    body: [
      "from . import ${1:main_bp}",
      "",
      "",
      "@${1:main_bp}.route('/${2:path}')",
      "def ${3:view_name}():",
      "    return '${4:Hello from blueprint!}'"
    ]
  },
  {
    id: "flask:blueprint-init",
    name: "Blueprint Package Initialization",
    prefix: "blueprintinit",
    category: "architecture",
    description: "Initialize a blueprint package. The routes module imports the blueprint from this package.",
    tags: [ "blueprint", "package", "initialization" ],
    scope: [ "python" ],
    body: [
      "from flask import Blueprint",
      "",
      "${1:main}_bp = Blueprint('${2:main}', __name__)",
      "",
      "# Import routes after creating the blueprint.",
      "from . import routes"
    ]
  },
  {
    id: "flask:factory-blueprints",
    name: "Factory With Multiple Blueprints",
    prefix: "factoryblueprints",
    category: "architecture",
    description: "Register multiple blueprints in an application factory.",
    tags: [ "factory", "blueprint", "architecture" ],
    scope: [ "python" ],
    body: [
      "from flask import Flask",
      "",
      "",
      "def create_app(config_class=None):",
      "    app = Flask(__name__)",
      "",
      "    if config_class:",
      "        app.config.from_object(config_class)",
      "",
      "    from app.main import main_bp",
      "    from app.auth import auth_bp",
      "    from app.api import api_bp",
      "",
      "    app.register_blueprint(main_bp)",
      "    app.register_blueprint(auth_bp)",
      "    app.register_blueprint(api_bp)",
      "",
      "    return app"
    ]
  },
  {
    id: "flask:extension-instance",
    name: "Create Extension Instance",
    prefix: "extensioninstance",
    category: "architecture",
    description: "Create an unbound Flask extension instance.",
    tags: [ "extension", "initialization", "factory" ],
    scope: [ "python" ],
    body: [
      "from flask_${1:extension} import ${2:Extension}",
      "",
      "${3:extension} = ${2:Extension}()"
    ]
  },
  {
    id: "flask:extension-init",
    name: "Initialize Extension",
    prefix: "extensioninit",
    category: "architecture",
    description: "Initialize a Flask extension inside create_app.",
    tags: [ "extension", "factory", "initialization" ],
    scope: [ "python" ],
    body: [
      "${1:extension}.init_app(app)"
    ]
  },
  {
    id: "flask:extensions-module",
    name: "Centralized Extensions Module",
    prefix: "extensionsmodule",
    category: "architecture",
    description: "Create a centralized module for Flask extension instances.",
    tags: [ "extensions", "architecture", "organization" ],
    scope: [ "python" ],
    body: [
      "from flask_sqlalchemy import SQLAlchemy",
      "from flask_migrate import Migrate",
      "from flask_login import LoginManager",
      "",
      "db = SQLAlchemy()",
      "migrate = Migrate()",
      "login_manager = LoginManager()"
    ]
  },
  {
    id: "flask:extensions-factory",
    name: "Initialize Multiple Extensions",
    prefix: "initextensions",
    category: "architecture",
    description: "Initialize shared extension instances in an application factory.",
    tags: [ "extensions", "factory", "initialization" ],
    scope: [ "python" ],
    body: [
      "from app.extensions import db, migrate, login_manager",
      "",
      "db.init_app(app)",
      "migrate.init_app(app, db)",
      "login_manager.init_app(app)"
    ]
  },
  {
    id: "flask:config-class",
    name: "Flask Configuration Class",
    prefix: "configclass",
    category: "architecture",
    description: "Define reusable Flask configuration. Set SECRET_KEY securely through the environment.",
    tags: [ "config", "settings", "environment" ],
    scope: [ "python" ],
    body: [
      "import os",
      "",
      "",
      "class Config:",
      "    SECRET_KEY = os.environ.get('SECRET_KEY')",
      "    DEBUG = False",
      "    TESTING = False",
      "    SQLALCHEMY_TRACK_MODIFICATIONS = False"
    ]
  },
  {
    id: "flask:development-config",
    name: "Development Configuration",
    prefix: "devconfig",
    category: "architecture",
    description: "Define development-specific configuration.",
    tags: [ "config", "development", "environment" ],
    scope: [ "python" ],
    body: [
      "class DevelopmentConfig(Config):",
      "    DEBUG = True",
      "    TESTING = False"
    ]
  },
  {
    id: "flask:production-config",
    name: "Production Configuration",
    prefix: "prodconfig",
    category: "architecture",
    description: "Define production-specific configuration.",
    tags: [ "config", "production", "environment" ],
    scope: [ "python" ],
    body: [
      "class ProductionConfig(Config):",
      "    DEBUG = False",
      "    TESTING = False"
    ]
  },
  {
    id: "flask:testing-config",
    name: "Testing Configuration",
    prefix: "testconfig",
    category: "architecture",
    description: "Define testing-specific configuration.",
    tags: [ "config", "testing", "environment" ],
    scope: [ "python" ],
    body: [
      "class TestingConfig(Config):",
      "    TESTING = True",
      "    DEBUG = False"
    ]
  },
  {
    id: "flask:load-config",
    name: "Load Flask Configuration",
    prefix: "loadconfig",
    category: "architecture",
    description: "Load a configuration class into a Flask application.",
    tags: [ "config", "factory" ],
    scope: [ "python" ],
    body: [
      "app.config.from_object(${1:Config})"
    ]
  },
  {
    id: "flask:dotenv",
    name: "Load Environment Variables",
    prefix: "dotenv",
    category: "architecture",
    description: "Load environment variables from a .env file.",
    tags: [ "dotenv", "environment", "configuration" ],
    scope: [ "python" ],
    body: [
      "from dotenv import load_dotenv",
      "",
      "load_dotenv()"
    ]
  },
  {
    id: "flask:app-context",
    name: "Flask Application Context",
    prefix: "appcontext",
    category: "architecture",
    description: "Execute code within the Flask application context.",
    tags: [ "context", "application", "database" ],
    scope: [ "python" ],
    body: [
      "with app.app_context():",
      "    ${1:# Access application-bound resources}",
      "    pass"
    ]
  },
  {
    id: "flask:request-context",
    name: "Flask Request Context",
    prefix: "requestcontext",
    category: "architecture",
    description: "Create a request context for testing or standalone operations.",
    tags: [ "context", "request", "testing" ],
    scope: [ "python" ],
    body: [
      "with app.test_request_context('/${1:path}'):",
      "    ${2:# Access request-bound resources}",
      "    pass"
    ]
  },
  {
    id: "flask:current-app",
    name: "Access Current Application",
    prefix: "currentapp",
    category: "architecture",
    description: "Import Flask's current application proxy.",
    tags: [ "context", "current-app" ],
    scope: [ "python" ],
    body: [
      "from flask import current_app",
      "",
      "current_app.${1:config}"
    ]
  },
  {
    id: "flask:project-logger",
    name: "Configure Flask Logger",
    prefix: "flasklogger",
    category: "architecture",
    description: "Configure the Flask application logger.",
    tags: [ "logging", "debugging", "configuration" ],
    scope: [ "python" ],
    body: [
      "import logging",
      "",
      "app.logger.setLevel(logging.${1:INFO})",
      "app.logger.${2:info}('${3:Application started}')"
    ]
  },

  // Blueprint hooks and handlers
  {
    id: "flask:blueprint-before-request",
    name: "Blueprint Before Request",
    prefix: "blueprintbefore",
    category: "architecture",
    description: "Run a function before each request handled by a blueprint.",
    tags: [ "blueprint", "hooks", "request" ],
    scope: [ "python" ],
    body: [
      "@${1:main_bp}.before_request",
      "def before_blueprint_request():",
      "    ${2:# Run before blueprint requests}",
      "    return None"
    ]
  },
  {
    id: "flask:blueprint-after-request",
    name: "Blueprint After Request",
    prefix: "blueprintafter",
    category: "architecture",
    description: "Modify responses after requests handled by a blueprint.",
    tags: [ "blueprint", "hooks", "response" ],
    scope: [ "python" ],
    body: [
      "@${1:main_bp}.after_request",
      "def after_blueprint_request(response):",
      "    ${2:# Modify the response}",
      "    return response"
    ]
  },
  {
    id: "flask:blueprint-error-handler",
    name: "Blueprint Error Handler",
    prefix: "blueprinterror",
    category: "architecture",
    description: "Register an error handler for errors raised while handling blueprint requests.",
    tags: [ "blueprint", "error", "handler" ],
    scope: [ "python" ],
    body: [
      "@${1:main_bp}.errorhandler(${2:404})",
      "def handle_blueprint_error(error):",
      "    return {",
      "        'error': '${3:Resource not found}'",
      "    }, ${2:404}"
    ]
  },
  {
    id: "flask:blueprint-app-error-handler",
    name: "Blueprint Application Error Handler",
    prefix: "blueprintapperror",
    category: "architecture",
    description: "Register an application-wide error handler from a blueprint.",
    tags: [ "blueprint", "application", "error" ],
    scope: [ "python" ],
    body: [
      "@${1:main_bp}.app_errorhandler(${2:500})",
      "def handle_application_error(error):",
      "    return {",
      "        'error': '${3:Internal server error}'",
      "    }, ${2:500}"
    ]
  },
  {
    id: "flask:blueprint-teardown",
    name: "Blueprint Teardown Request",
    prefix: "blueprintteardown",
    category: "architecture",
    description: "Run cleanup logic after a blueprint request.",
    tags: [ "blueprint", "teardown", "cleanup" ],
    scope: [ "python" ],
    body: [
      "@${1:main_bp}.teardown_request",
      "def teardown_blueprint_request(error=None):",
      "    ${2:# Release request-specific resources}",
      "    pass"
    ]
  },
  {
    id: "flask:nested-blueprint",
    name: "Register Nested Blueprint",
    prefix: "nestedblueprint",
    category: "architecture",
    description: "Register a child blueprint under a parent blueprint.",
    tags: [ "blueprint", "nested", "modular" ],
    scope: [ "python" ],
    body: [
      "from flask import Blueprint",
      "",
      "${1:admin_bp} = Blueprint('${2:admin}', __name__)",
      "${3:users_bp} = Blueprint('${4:users}', __name__)",
      "",
      "${1:admin_bp}.register_blueprint(",
      "    ${3:users_bp},",
      "    url_prefix='/${5:users}'",
      ")",
      "",
      "app.register_blueprint(${1:admin_bp})"
    ]
  },
  {
    id: "flask:blueprint-url-rule",
    name: "Add Blueprint URL Rule",
    prefix: "blueprinturlrule",
    category: "architecture",
    description: "Register a URL rule directly on a blueprint.",
    tags: [ "blueprint", "routing", "url-rule" ],
    scope: [ "python" ],
    body: [
      "${1:main_bp}.add_url_rule(",
      "    '/${2:path}',",
      "    endpoint='${3:view_endpoint}',",
      "    view_func=${4:view_function},",
      "    methods=['${5:GET}']",
      ")"
    ]
  },
  {
    id: "flask:blueprint-cli",
    name: "Blueprint CLI Command",
    prefix: "blueprintcli",
    category: "architecture",
    description: "Register a CLI command through a blueprint.",
    tags: [ "blueprint", "cli", "command" ],
    scope: [ "python" ],
    body: [
      "@${1:main_bp}.cli.command('${2:hello}')",
      "def ${3:hello_command}():",
      "    print('${4:Hello from blueprint CLI!}')"
    ]
  },

  // Application context and template integration
  {
    id: "flask:app-context-processor",
    name: "Application Context Processor",
    prefix: "appcontextprocessor",
    category: "architecture",
    description: "Make common variables available to all templates.",
    tags: [ "context", "template", "application" ],
    scope: [ "python" ],
    body: [
      "@app.context_processor",
      "def inject_global_data():",
      "    return {",
      "        '${1:site_name}': '${2:My Flask App}'",
      "    }"
    ]
  },
  {
    id: "flask:blueprint-context-processor",
    name: "Blueprint Context Processor",
    prefix: "blueprintcontext",
    category: "architecture",
    description: "Make variables available to templates rendered by a blueprint.",
    tags: [ "blueprint", "context", "template" ],
    scope: [ "python" ],
    body: [
      "@${1:main_bp}.context_processor",
      "def inject_blueprint_data():",
      "    return {",
      "        '${2:section_name}': '${3:Main}'",
      "    }"
    ]
  },
  {
    id: "flask:shell-context",
    name: "Flask Shell Context",
    prefix: "shellcontext",
    category: "architecture",
    description: "Automatically expose useful objects in the Flask shell.",
    tags: [ "shell", "context", "cli" ],
    scope: [ "python" ],
    body: [
      "@app.shell_context_processor",
      "def make_shell_context():",
      "    return {",
      "        '${1:db}': ${2:db},",
      "        '${3:User}': ${4:User}",
      "    }"
    ]
  },
  {
    id: "flask:app-template-filter",
    name: "Register Template Filter",
    prefix: "apptemplatefilter",
    category: "architecture",
    description: "Create a custom Jinja filter available to application templates.",
    tags: [ "template", "jinja", "filter" ],
    scope: [ "python" ],
    body: [
      "@app.template_filter('${1:capitalize_words}')",
      "def ${2:capitalize_words}(value):",
      "    return value.title()"
    ]
  },
  {
    id: "flask:blueprint-template-filter",
    name: "Blueprint Template Filter",
    prefix: "blueprintfilter",
    category: "architecture",
    description: "Register a Jinja template filter through a blueprint.",
    tags: [ "blueprint", "template", "filter" ],
    scope: [ "python" ],
    body: [
      "@${1:main_bp}.app_template_filter('${2:capitalize_words}')",
      "def ${3:capitalize_words}(value):",
      "    return value.title()"
    ]
  },
  {
    id: "flask:app-template-global",
    name: "Register Template Global",
    prefix: "apptemplateglobal",
    category: "architecture",
    description: "Register a Python function as a global available in Jinja templates.",
    tags: [ "template", "jinja", "global" ],
    scope: [ "python" ],
    body: [
      "@app.template_global()",
      "def ${1:current_year}():",
      "    from datetime import datetime",
      "    return datetime.now().year"
    ]
  },

  // Application lifecycle hooks
  {
    id: "flask:teardown-app-context",
    name: "Teardown Application Context",
    prefix: "teardownappcontext",
    category: "architecture",
    description: "Release resources when an application context ends.",
    tags: [ "context", "teardown", "cleanup" ],
    scope: [ "python" ],
    body: [
      "@app.teardown_appcontext",
      "def close_resources(error=None):",
      "    ${1:# Release application-context resources}",
      "    pass"
    ]
  },
  {
    id: "flask:teardown-request",
    name: "Teardown Request",
    prefix: "teardownrequest",
    category: "architecture",
    description: "Run cleanup logic when a request context ends.",
    tags: [ "request", "teardown", "cleanup" ],
    scope: [ "python" ],
    body: [
      "@app.teardown_request",
      "def cleanup_request(error=None):",
      "    ${1:# Release request-specific resources}",
      "    pass"
    ]
  },
  {
    id: "flask:url-value-preprocessor",
    name: "URL Value Preprocessor",
    prefix: "urlvaluepreprocessor",
    category: "architecture",
    description: "Process URL values before a view function is called.",
    tags: [ "url", "routing", "preprocessor" ],
    scope: [ "python" ],
    body: [
      "@app.url_value_preprocessor",
      "def pull_values(endpoint, values):",
      "    if values:",
      "        ${1:language} = values.pop('${2:lang}', None)"
    ]
  },
  {
    id: "flask:url-defaults",
    name: "URL Defaults",
    prefix: "urldefaults",
    category: "architecture",
    description: "Add default values when Flask builds URLs.",
    tags: [ "url", "routing", "defaults" ],
    scope: [ "python" ],
    body: [
      "@app.url_defaults",
      "def add_url_defaults(endpoint, values):",
      "    values.setdefault('${1:lang}', '${2:en}')"
    ]
  },

  // Configuration loading
  {
    id: "flask:config-pyfile",
    name: "Load Configuration From Python File",
    prefix: "configpyfile",
    category: "architecture",
    description: "Load configuration values from a Python configuration file.",
    tags: [ "config", "file", "settings" ],
    scope: [ "python" ],
    body: [
      "app.config.from_pyfile('${1:config.py}', silent=${2:False})"
    ]
  },
  {
    id: "flask:config-envvar",
    name: "Load Configuration From Environment Variable",
    prefix: "configenvvar",
    category: "architecture",
    description: "Load a Python configuration file using an environment variable.",
    tags: [ "config", "environment", "settings" ],
    scope: [ "python" ],
    body: [
      "app.config.from_envvar('${1:FLASK_CONFIG}')"
    ]
  },
  {
    id: "flask:instance-relative-config",
    name: "Instance Relative Configuration",
    prefix: "instanceconfig",
    category: "architecture",
    description: "Create a Flask application with instance-relative configuration.",
    tags: [ "config", "instance", "factory" ],
    scope: [ "python" ],
    body: [
      "from flask import Flask",
      "",
      "app = Flask(",
      "    __name__,",
      "    instance_relative_config=True",
      ")",
      "",
      "app.config.from_pyfile('${1:config.py}', silent=True)"
    ]
  }
];

export default architectureSnippets;
