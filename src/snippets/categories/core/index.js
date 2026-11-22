
const coreSnippets = [
  {
    id: "flask:app",
    name: "Flask Application",
    prefix: "flask",
    category: "core",
    description: "Initialize a basic Flask application.",
    tags: [ "app", "initialization", "beginner" ],
    scope: [ "python" ],
    body: [
      "from flask import Flask",
      "",
      "app = Flask(__name__)",
      "",
      "@app.route('/')",
      "def home():",
      "    return '${1:Hello, Flask!}'",
      "",
      "if __name__ == '__main__':",
      "    app.run(debug=${2:True})"
    ]
  },
  {
    id: "flask:create-app",
    name: "Application Factory",
    prefix: "createapp",
    category: "core",
    description: "Create a Flask application using the factory pattern.",
    tags: [ "factory", "architecture", "initialization" ],
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
      "    ${1:# Register extensions and blueprints here}",
      "",
      "    return app"
    ]
  },
  {
    id: "flask:route",
    name: "Flask Route",
    prefix: "route",
    category: "core",
    description: "Create a basic Flask route.",
    tags: [ "route", "view", "endpoint" ],
    scope: [ "python" ],
    body: [
      "@app.route('/${1:path}')",
      "def ${2:view_name}():",
      "    ${3:return 'Hello, Flask!'}"
    ]
  },
  {
    id: "flask:route-methods",
    name: "Route With HTTP Methods",
    prefix: "routemethods",
    category: "core",
    description: "Create a route supporting multiple HTTP methods. Requires request from flask.",
    tags: [ "route", "http", "methods" ],
    scope: [ "python" ],
    body: [
      "from flask import request",
      "",
      "@app.route('/${1:resource}', methods=['GET', 'POST'])",
      "def ${2:resource_view}():",
      "    if request.method == 'POST':",
      "        ${3:# Handle POST request}",
      "        return '${4:Created}'",
      "",
      "    return '${5:OK}'"
    ]
  },
  {
    id: "flask:request-import",
    name: "Request Import",
    prefix: "requestimport",
    category: "core",
    description: "Import Flask request utilities.",
    tags: [ "request", "import" ],
    scope: [ "python" ],
    body: [
      "from flask import request"
    ]
  },
  {
    id: "flask:request-data",
    name: "Get Request Form Data",
    prefix: "formdata",
    category: "core",
    description: "Read submitted form values.",
    tags: [ "request", "form", "post" ],
    scope: [ "python" ],
    body: [
      "${1:username} = request.form.get('${2:username}')",
      "${3:email} = request.form.get('${4:email}')"
    ]
  },
  {
    id: "flask:request-json",
    name: "Get JSON Request Data",
    prefix: "requestjson",
    category: "core",
    description: "Read JSON data sent by an API client.",
    tags: [ "request", "json", "api" ],
    scope: [ "python" ],
    body: [
      "data = request.get_json(silent=True) or {}",
      "",
      "${1:name} = data.get('${2:name}')"
    ]
  },
  {
    id: "flask:request-args",
    name: "Get Query Parameters",
    prefix: "queryparams",
    category: "core",
    description: "Read URL query parameters.",
    tags: [ "request", "query", "parameters" ],
    scope: [ "python" ],
    body: [
      "${1:search} = request.args.get('${2:q}', '${3:}')"
    ]
  },
  {
    id: "flask:json-response",
    name: "JSON Response",
    prefix: "jsonresponse",
    category: "core",
    description: "Return a JSON response.",
    tags: [ "json", "response", "api" ],
    scope: [ "python" ],
    body: [
      "from flask import jsonify",
      "",
      "return jsonify({",
      "    '${1:message}': '${2:Success}'",
      "}), ${3:200}"
    ]
  },
  {
    id: "flask:jsonify",
    name: "JSONify Data",
    prefix: "jsonify",
    category: "core",
    description: "Convert a Python value into a JSON response.",
    tags: [ "json", "response" ],
    scope: [ "python" ],
    body: [
      "return jsonify(${1:data})"
    ]
  },
  {
    id: "flask:redirect",
    name: "Redirect To Endpoint",
    prefix: "redirect",
    category: "core",
    description: "Redirect to another Flask endpoint.",
    tags: [ "redirect", "navigation" ],
    scope: [ "python" ],
    body: [
      "from flask import redirect, url_for",
      "",
      "return redirect(url_for('${1:home}'))"
    ]
  },
  {
    id: "flask:url-for",
    name: "Generate Endpoint URL",
    prefix: "urlfor",
    category: "core",
    description: "Generate a URL for a Flask endpoint.",
    tags: [ "url", "endpoint", "navigation" ],
    scope: [ "python" ],
    body: [
      "url_for('${1:home}')"
    ]
  },
  {
    id: "flask:abort",
    name: "Abort With HTTP Error",
    prefix: "abort",
    category: "core",
    description: "Raise an HTTP error response.",
    tags: [ "error", "http", "abort" ],
    scope: [ "python" ],
    body: [
      "from flask import abort",
      "",
      "abort(${1:404})"
    ]
  },
  {
    id: "flask:error-handler",
    name: "HTTP Error Handler",
    prefix: "errorhandler",
    category: "core",
    description: "Register a custom HTTP error handler.",
    tags: [ "error", "handler", "http" ],
    scope: [ "python" ],
    body: [
      "@app.errorhandler(${1:404})",
      "def handle_not_found(error):",
      "    return {",
      "        'error': '${2:Resource not found}'",
      "    }, ${3:404}"
    ]
  },
  {
    id: "flask:make-response",
    name: "Create Custom Response",
    prefix: "makeresponse",
    category: "core",
    description: "Create and configure a Flask response object.",
    tags: [ "response", "headers", "http" ],
    scope: [ "python" ],
    body: [
      "from flask import make_response",
      "",
      "response = make_response('${1:Response body}', ${2:200})",
      "response.headers['${3:Content-Type}'] = '${4:text/plain}'",
      "",
      "return response"
    ]
  },
  {
    id: "flask:render-template",
    name: "Render HTML Template",
    prefix: "render",
    category: "core",
    description: "Render a Jinja HTML template.",
    tags: [ "template", "jinja", "html" ],
    scope: [ "python" ],
    body: [
      "from flask import render_template",
      "",
      "return render_template('${1:index.html}')"
    ]
  },
  {
    id: "flask:render-template-data",
    name: "Render Template With Data",
    prefix: "renderdata",
    category: "core",
    description: "Pass Python variables into a Jinja template.",
    tags: [ "template", "jinja", "context" ],
    scope: [ "python" ],
    body: [
      "return render_template(",
      "    '${1:index.html}',",
      "    ${2:title}='${3:Home}',",
      "    ${4:user}=user",
      ")"
    ]
  },
  {
    id: "flask:static-url",
    name: "Generate Static File URL",
    prefix: "staticurl",
    category: "core",
    description: "Generate a URL for a static file.",
    tags: [ "static", "url", "assets" ],
    scope: [ "python" ],
    body: [
      "url_for('static', filename='${1:css/style.css}')"
    ]
  },
  {
    id: "flask:before-request",
    name: "Before Request Handler",
    prefix: "beforerequest",
    category: "core",
    description: "Run a function before each request.",
    tags: [ "request", "hooks", "middleware" ],
    scope: [ "python" ],
    body: [
      "@app.before_request",
      "def before_request():",
      "    ${1:# Run before the request}",
      "    return None"
    ]
  },
  {
    id: "flask:after-request",
    name: "After Request Handler",
    prefix: "afterrequest",
    category: "core",
    description: "Modify a response after each request.",
    tags: [ "request", "response", "hooks" ],
    scope: [ "python" ],
    body: [
      "@app.after_request",
      "def after_request(response):",
      "    ${1:# Modify the response}",
      "    return response"
    ]
  },
  {
    id: "flask:cli-command",
    name: "Custom Flask CLI Command",
    prefix: "clicommand",
    category: "core",
    description: "Register a custom Flask command.",
    tags: [ "cli", "command", "management" ],
    scope: [ "python" ],
    body: [
      "@app.cli.command('${1:hello}')",
      "def ${2:hello_command}():",
      "    print('${3:Hello from Flask CLI!}')"
    ]
  },
  {
    id: "flask:request-header",
    name: "Get Request Header",
    prefix: "requestheader",
    category: "core",
    description: "Retrieve a specific HTTP header from the incoming request.",
    tags: [ "request", "headers", "http" ],
    scope: [ "python" ],
    body: [
      "from flask import request",
      "",
      "${1:authorization} = request.headers.get('${2:Authorization}')"
    ]
  },
  {
    id: "flask:request-content-type",
    name: "Get Request Content Type",
    prefix: "requestcontenttype",
    category: "core",
    description: "Get the MIME content type of the incoming request.",
    tags: [ "request", "content-type", "http" ],
    scope: [ "python" ],
    body: [
      "content_type = request.content_type"
    ]
  },
  {
    id: "flask:request-is-json",
    name: "Check JSON Request",
    prefix: "requestisjson",
    category: "core",
    description: "Check whether the incoming request contains JSON data.",
    tags: [ "request", "json", "api" ],
    scope: [ "python" ],
    body: [
      "if request.is_json:",
      "    ${1:# Handle JSON request}",
      "else:",
      "    ${2:# Handle non-JSON request}"
    ]
  },
  {
    id: "flask:request-files",
    name: "Get Uploaded Files",
    prefix: "requestfiles",
    category: "core",
    description: "Retrieve an uploaded file from the request.",
    tags: [ "request", "files", "upload" ],
    scope: [ "python" ],
    body: [
      "uploaded_file = request.files.get('${1:file}')",
      "",
      "if uploaded_file:",
      "    ${2:# Process uploaded file}"
    ]
  },
  {
    id: "flask:request-user-agent",
    name: "Get Request User Agent",
    prefix: "requestuseragent",
    category: "core",
    description: "Retrieve the user-agent string from the incoming request.",
    tags: [ "request", "user-agent", "client" ],
    scope: [ "python" ],
    body: [
      "user_agent = request.user_agent.string"
    ]
  },
  {
    id: "flask:request-remote-address",
    name: "Get Client IP Address",
    prefix: "requestip",
    category: "core",
    description: "Retrieve the remote address associated with the request.",
    tags: [ "request", "ip", "client" ],
    scope: [ "python" ],
    body: [
      "client_ip = request.remote_addr"
    ]
  },
  {
    id: "flask:request-method",
    name: "Get Request Method",
    prefix: "requestmethod",
    category: "core",
    description: "Retrieve the HTTP method used for the current request.",
    tags: [ "request", "http", "method" ],
    scope: [ "python" ],
    body: [
      "method = request.method"
    ]
  },
  {
    id: "flask:request-path",
    name: "Get Request Path",
    prefix: "requestpath",
    category: "core",
    description: "Retrieve the path of the current request.",
    tags: [ "request", "path", "url" ],
    scope: [ "python" ],
    body: [
      "path = request.path"
    ]
  },
  {
    id: "flask:request-form-getlist",
    name: "Get Multiple Form Values",
    prefix: "formgetlist",
    category: "core",
    description: "Retrieve multiple values submitted under the same form field.",
    tags: [ "request", "form", "multiple", "list" ],
    scope: [ "python" ],
    body: [
      "${1:values} = request.form.getlist('${2:items}')"
    ]
  },
  {
    id: "flask:request-args-getlist",
    name: "Get Multiple Query Values",
    prefix: "argsgetlist",
    category: "core",
    description: "Retrieve multiple values for the same URL query parameter.",
    tags: [ "request", "query", "parameters", "list" ],
    scope: [ "python" ],
    body: [
      "${1:values} = request.args.getlist('${2:tags}')"
    ]
  },
  {
    id: "flask:flash-message",
    name: "Flash Message",
    prefix: "flashmessage",
    category: "core",
    description: "Send a one-time message to the next request.",
    tags: [ "flash", "message", "notification" ],
    scope: [ "python" ],
    body: [
      "from flask import flash",
      "",
      "flash('${1:Operation completed successfully}', '${2:success}')"
    ]
  },
  {
    id: "flask:get-flash-messages",
    name: "Get Flash Messages",
    prefix: "getflashmessages",
    category: "core",
    description: "Retrieve queued flash messages, optionally with their categories.",
    tags: [ "flash", "message", "notification" ],
    scope: [ "python" ],
    body: [
      "from flask import get_flashed_messages",
      "",
      "messages = get_flashed_messages(with_categories=${1:True})"
    ]
  },
  {
    id: "flask:send-file",
    name: "Send File Response",
    prefix: "sendfile",
    category: "core",
    description: "Send a file as the response to a request.",
    tags: [ "file", "download", "response" ],
    scope: [ "python" ],
    body: [
      "from flask import send_file",
      "",
      "return send_file('${1:path/to/file.pdf}', as_attachment=${2:True})"
    ]
  },
  {
    id: "flask:send-from-directory",
    name: "Send File From Directory",
    prefix: "sendfromdirectory",
    category: "core",
    description: "Send a file from a specified directory.",
    tags: [ "file", "download", "directory" ],
    scope: [ "python" ],
    body: [
      "from flask import send_from_directory",
      "",
      "return send_from_directory(",
      "    '${1:uploads}',",
      "    '${2:filename.pdf}',",
      "    as_attachment=${3:True}",
      ")"
    ]
  },
  {
    id: "flask:response-set-cookie",
    name: "Set Response Cookie",
    prefix: "setcookie",
    category: "core",
    description: "Set a cookie on the outgoing response.",
    tags: [ "response", "cookie", "http" ],
    scope: [ "python" ],
    body: [
      "from flask import make_response",
      "",
      "response = make_response('${1:Response body}')",
      "response.set_cookie('${2:theme}', '${3:dark}')",
      "",
      "return response"
    ]
  },
  {
    id: "flask:response-delete-cookie",
    name: "Delete Response Cookie",
    prefix: "deletecookie",
    category: "core",
    description: "Remove a cookie by setting it to expire.",
    tags: [ "response", "cookie", "http" ],
    scope: [ "python" ],
    body: [
      "from flask import make_response",
      "",
      "response = make_response('${1:Response body}')",
      "response.delete_cookie('${2:theme}')",
      "",
      "return response"
    ]
  }
];

export default coreSnippets;
