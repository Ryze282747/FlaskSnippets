const jinjaSnippets = [
  {
    id: "jinja:html5",
    name: "HTML5 Template",
    prefix: "jinjahtml",
    category: "jinja",
    description: "Create a basic HTML5 page using Jinja.",
    body: [
      "<!DOCTYPE html>",
      "<html lang=\"en\">",
      "<head>",
      "    <meta charset=\"UTF-8\">",
      "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">",
      "    <title>${1:My Flask App}</title>",
      "</head>",
      "<body>",
      "    ${2:}",
      "</body>",
      "</html>"
    ],
    tags: [ "html", "template", "jinja" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:extends",
    name: "Extend Base Template",
    prefix: "jinjaextends",
    category: "jinja",
    description: "Extend a shared base template.",
    body: [
      "{% extends \"${1:base.html}\" %}",
      "",
      "{% block ${2:content} %}",
      "    ${3:}",
      "{% endblock %}"
    ],
    tags: [ "inheritance", "template" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:block",
    name: "Template Block",
    prefix: "jinjablock",
    category: "jinja",
    description: "Define a reusable template block.",
    body: [
      "{% block ${1:content} %}",
      "    ${2:}",
      "{% endblock %}"
    ],
    tags: [ "block", "inheritance" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:include",
    name: "Include Template",
    prefix: "jinjainclude",
    category: "jinja",
    description: "Include another template file.",
    body: [
      "{% include \"${1:partials/navbar.html}\" %}"
    ],
    tags: [ "include", "template" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:if",
    name: "If Statement",
    prefix: "jinjaif",
    category: "jinja",
    description: "Create a Jinja conditional.",
    body: [
      "{% if ${1:condition} %}",
      "    ${2:}",
      "{% endif %}"
    ],
    tags: [ "condition", "if" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:if-else",
    name: "If Else Statement",
    prefix: "jinjaifelse",
    category: "jinja",
    description: "Create a Jinja if-else conditional.",
    body: [
      "{% if ${1:condition} %}",
      "    ${2:}",
      "{% else %}",
      "    ${3:}",
      "{% endif %}"
    ],
    tags: [ "condition", "if", "else" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:if-elif",
    name: "If Elif Else Statement",
    prefix: "jinjaelif",
    category: "jinja",
    description: "Create a conditional with multiple branches.",
    body: [
      "{% if ${1:condition} %}",
      "    ${2:}",
      "{% elif ${3:other_condition} %}",
      "    ${4:}",
      "{% else %}",
      "    ${5:}",
      "{% endif %}"
    ],
    tags: [ "condition", "elif", "else" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:for",
    name: "For Loop",
    prefix: "jinjafor",
    category: "jinja",
    description: "Loop through a collection in a template.",
    body: [
      "{% for ${1:item} in ${2:items} %}",
      "    ${3:}",
      "{% endfor %}"
    ],
    tags: [ "loop", "for" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:for-empty",
    name: "For Loop with Empty State",
    prefix: "jinjaforempty",
    category: "jinja",
    description: "Display fallback content when a collection is empty.",
    body: [
      "{% for ${1:item} in ${2:items} %}",
      "    ${3:}",
      "{% else %}",
      "    ${4:No items found.}",
      "{% endfor %}"
    ],
    tags: [ "loop", "empty-state" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:variable",
    name: "Output Variable",
    prefix: "jinjavariable",
    category: "jinja",
    description: "Render a variable in a Jinja template.",
    body: [
      "{{ ${1:variable} }}"
    ],
    tags: [ "variable", "output" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:default-filter",
    name: "Default Filter",
    prefix: "jinjadefault",
    category: "jinja",
    description: "Provide a fallback value when a variable is undefined or false.",
    body: [
      "{{ ${1:variable}|default(\"${2:Default value}\", true) }}"
    ],
    tags: [ "filter", "default" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:length-filter",
    name: "Length Filter",
    prefix: "jinjalength",
    category: "jinja",
    description: "Get the length of a collection.",
    body: [
      "{{ ${1:items}|length }}"
    ],
    tags: [ "filter", "length" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:upper-filter",
    name: "Uppercase Filter",
    prefix: "jinjaupper",
    category: "jinja",
    description: "Convert text to uppercase.",
    body: [
      "{{ ${1:value}|upper }}"
    ],
    tags: [ "filter", "string" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:lower-filter",
    name: "Lowercase Filter",
    prefix: "jinjalower",
    category: "jinja",
    description: "Convert text to lowercase.",
    body: [
      "{{ ${1:value}|lower }}"
    ],
    tags: [ "filter", "string" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:date-filter",
    name: "Format Date",
    prefix: "jinjadate",
    category: "jinja",
    description: "Format a date value using strftime.",
    body: [
      "{{ ${1:created_at}.strftime(\"${2:%Y-%m-%d}\") }}"
    ],
    tags: [ "filter", "date", "format" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:url-for",
    name: "Generate URL",
    prefix: "jinjaurlfor",
    category: "jinja",
    description: "Generate a URL using Flask's url_for function.",
    body: [
      "{{ url_for(\"${1:main.index}\") }}"
    ],
    tags: [ "flask", "url", "navigation" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:url-for-args",
    name: "Generate URL with Arguments",
    prefix: "jinjaurlargs",
    category: "jinja",
    description: "Generate a URL with dynamic route arguments.",
    body: [
      "{{ url_for(\"${1:items.details}\", ${2:item_id}=${3:item.id}) }}"
    ],
    tags: [ "flask", "url", "arguments" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:static",
    name: "Static File URL",
    prefix: "jinjastatic",
    category: "jinja",
    description: "Generate a URL for a static asset.",
    body: [
      "{{ url_for(\"static\", filename=\"${1:css/style.css}\") }}"
    ],
    tags: [ "flask", "static", "assets" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:flash",
    name: "Display Flash Messages",
    prefix: "jinjaflash",
    category: "jinja",
    description: "Render categorized Flask flash messages.",
    body: [
      "{% with messages = get_flashed_messages(with_categories=true) %}",
      "    {% if messages %}",
      "        {% for category, message in messages %}",
      "            <div class=\"alert alert-{{ category }}\">",
      "                {{ message }}",
      "            </div>",
      "        {% endfor %}",
      "    {% endif %}",
      "{% endwith %}"
    ],
    tags: [ "flask", "flash", "messages" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:form",
    name: "HTML Form",
    prefix: "jinjaform",
    category: "jinja",
    description: "Create an HTML form with a CSRF token.",
    body: [
      "<form method=\"${1:POST}\" action=\"{{ url_for('${2:auth.login}') }}\">",
      "    <input type=\"hidden\" name=\"csrf_token\" value=\"{{ csrf_token() }}\">",
      "    ${3:}",
      "    <button type=\"submit\">${4:Submit}</button>",
      "</form>"
    ],
    tags: [ "form", "csrf", "html" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:wtf-form",
    name: "Flask-WTF Form",
    prefix: "jinjawtfform",
    category: "jinja",
    description: "Render a Flask-WTF form with field errors.",
    body: [
      "<form method=\"POST\">",
      "    {{ form.hidden_tag() }}",
      "",
      "    <div>",
      "        {{ form.${1:email}.label }}",
      "        {{ form.${1:email}(class=\"${2:form-control}\") }}",
      "        {% for error in form.${1:email}.errors %}",
      "            <small class=\"error\">{{ error }}</small>",
      "        {% endfor %}",
      "    </div>",
      "",
      "    {{ form.${3:submit}(class=\"${4:btn btn-primary}\") }}",
      "</form>"
    ],
    tags: [ "flask-wtf", "form", "validation" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:macro",
    name: "Jinja Macro",
    prefix: "jinjamacro",
    category: "jinja",
    description: "Define a reusable Jinja macro.",
    body: [
      "{% macro ${1:input_field}(field) %}",
      "    <div class=\"form-group\">",
      "        {{ field.label }}",
      "        {{ field(**kwargs) }}",
      "    </div>",
      "{% endmacro %}"
    ],
    tags: [ "macro", "reusable", "forms" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:with",
    name: "With Statement",
    prefix: "jinjawith",
    category: "jinja",
    description: "Define scoped variables inside a template.",
    body: [
      "{% with ${1:message} = ${2:\"Hello\"} %}",
      "    {{ ${1:message} }}",
      "{% endwith %}"
    ],
    tags: [ "with", "variables" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:comment",
    name: "Jinja Comment",
    prefix: "jinjacomment",
    category: "jinja",
    description: "Add a comment that is not rendered in the output.",
    body: [
      "{# ${1:Comment} #}"
    ],
    tags: [ "comment" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:autoescape",
    name: "Autoescape Block",
    prefix: "jinjaautoescape",
    category: "jinja",
    description: "Explicitly control automatic escaping. Disabling it can expose templates to XSS.",
    body: [
      "{% autoescape ${1:true} %}",
      "    ${2:}",
      "{% endautoescape %}"
    ],
    tags: [ "escaping", "security" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:for-index",
    name: "Loop Index",
    prefix: "jinjaindex",
    category: "jinja",
    description: "Access the current loop index and iteration information.",
    body: [
      "{{ loop.index }}",
      "{{ loop.index0 }}",
      "{{ loop.first }}",
      "{{ loop.last }}"
    ],
    tags: [ "loop", "index", "iteration" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:for-reversed",
    name: "Reverse Loop",
    prefix: "jinjareverse",
    category: "jinja",
    description: "Iterate over a collection in reverse order.",
    body: [
      "{% for ${1:item} in ${2:items}|reverse %}",
      "    ${3:}",
      "{% endfor %}"
    ],
    tags: [ "loop", "reverse" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:for-recursive",
    name: "Recursive Loop",
    prefix: "jinjarecursive",
    category: "jinja",
    description: "Render nested collections using a recursive loop.",
    body: [
      "{% for ${1:item} in ${2:items} recursive %}",
      "    {{ item.name }}",
      "    {% if item.children %}",
      "        <ul>{{ loop(item.children) }}</ul>",
      "    {% endif %}",
      "{% endfor %}"
    ],
    tags: [ "loop", "recursive", "nested" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:set",
    name: "Set Variable",
    prefix: "jinjaset",
    category: "jinja",
    description: "Assign a value to a template variable.",
    body: [
      "{% set ${1:total} = ${2:0} %}"
    ],
    tags: [ "variable", "assignment" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:set-capture",
    name: "Capture Block Content",
    prefix: "jinjacapture",
    category: "jinja",
    description: "Capture rendered block content into a variable.",
    body: [
      "{% set ${1:content} %}",
      "    ${2:}",
      "{% endset %}"
    ],
    tags: [ "variable", "capture", "block" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:filter-block",
    name: "Filter Block",
    prefix: "jinjafilterblock",
    category: "jinja",
    description: "Apply a filter to an entire block of content.",
    body: [
      "{% filter ${1:upper} %}",
      "    ${2:content}",
      "{% endfilter %}"
    ],
    tags: [ "filter", "block" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:apply-filter",
    name: "Apply Multiple Filters",
    prefix: "jinjafilters",
    category: "jinja",
    description: "Chain multiple filters on a value.",
    body: [
      "{{ ${1:value}|${2:trim}|${3:title} }}"
    ],
    tags: [ "filter", "chain", "format" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:escape",
    name: "Escape HTML",
    prefix: "jinjaescape",
    category: "jinja",
    description: "Escape HTML-sensitive characters in a value.",
    body: [
      "{{ ${1:value}|e }}"
    ],
    tags: [ "filter", "escape", "security" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:truncate",
    name: "Truncate Text",
    prefix: "jinjatruncate",
    category: "jinja",
    description: "Shorten text to a specified length.",
    body: [
      "{{ ${1:description}|truncate(${2:100}) }}"
    ],
    tags: [ "filter", "text", "truncate" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:join",
    name: "Join Collection",
    prefix: "jinjajoin",
    category: "jinja",
    description: "Join collection values into a single string.",
    body: [
      "{{ ${1:items}|join(\", \") }}"
    ],
    tags: [ "filter", "join", "collection" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:replace",
    name: "Replace Text",
    prefix: "jinjareplace",
    category: "jinja",
    description: "Replace occurrences of text in a string.",
    body: [
      "{{ ${1:value}|replace(\"${2:old}\", \"${3:new}\") }}"
    ],
    tags: [ "filter", "replace", "string" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:round",
    name: "Round Number",
    prefix: "jinjaround",
    category: "jinja",
    description: "Round a numeric value.",
    body: [
      "{{ ${1:price}|round(${2:2}) }}"
    ],
    tags: [ "filter", "number", "round" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:sort",
    name: "Sort Collection",
    prefix: "jinjasort",
    category: "jinja",
    description: "Sort a collection by its values or attributes.",
    body: [
      "{% for ${1:item} in ${2:items}|sort(attribute=\"${3:name}\") %}",
      "    ${4:}",
      "{% endfor %}"
    ],
    tags: [ "filter", "sort", "collection" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:selectattr",
    name: "Filter by Attribute",
    prefix: "jinjaselectattr",
    category: "jinja",
    description: "Select collection items matching an attribute test.",
    body: [
      "{% for ${1:item} in ${2:items}|selectattr(\"${3:active}\") %}",
      "    ${4:}",
      "{% endfor %}"
    ],
    tags: [ "filter", "selectattr", "collection" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:map",
    name: "Map Collection Attribute",
    prefix: "jinjamap",
    category: "jinja",
    description: "Extract an attribute from each item in a collection.",
    body: [
      "{{ ${1:items}|map(attribute=\"${2:name}\")|list }}"
    ],
    tags: [ "filter", "map", "collection" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:dict-access",
    name: "Dictionary Access",
    prefix: "jinjadict",
    category: "jinja",
    description: "Access a dictionary value by key.",
    body: [
      "{{ ${1:user}[\"${2:name}\"] }}"
    ],
    tags: [ "dictionary", "variable", "access" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:attribute-access",
    name: "Object Attribute",
    prefix: "jinjaattr",
    category: "jinja",
    description: "Access an object attribute.",
    body: [
      "{{ ${1:user}.${2:name} }}"
    ],
    tags: [ "object", "attribute", "variable" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:defined",
    name: "Check If Defined",
    prefix: "jinjadefined",
    category: "jinja",
    description: "Check whether a variable is defined.",
    body: [
      "{% if ${1:variable} is defined %}",
      "    ${2:}",
      "{% endif %}"
    ],
    tags: [ "test", "defined", "condition" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:none",
    name: "Check If None",
    prefix: "jinjanone",
    category: "jinja",
    description: "Check whether a value is none.",
    body: [
      "{% if ${1:value} is none %}",
      "    ${2:}",
      "{% endif %}"
    ],
    tags: [ "test", "none", "condition" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:even",
    name: "Check Even Number",
    prefix: "jinjaeven",
    category: "jinja",
    description: "Check whether a number is even.",
    body: [
      "{% if ${1:number} is even %}",
      "    ${2:}",
      "{% endif %}"
    ],
    tags: [ "test", "number", "condition" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:odd",
    name: "Check Odd Number",
    prefix: "jinjaodd",
    category: "jinja",
    description: "Check whether a number is odd.",
    body: [
      "{% if ${1:number} is odd %}",
      "    ${2:}",
      "{% endif %}"
    ],
    tags: [ "test", "number", "condition" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:call",
    name: "Call Macro",
    prefix: "jinjacall",
    category: "jinja",
    description: "Call a macro that accepts a caller block.",
    body: [
      "{% call ${1:render_field}(${2:field}) %}",
      "    ${3:}",
      "{% endcall %}"
    ],
    tags: [ "macro", "call", "caller" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:import",
    name: "Import Macros",
    prefix: "jinjaimport",
    category: "jinja",
    description: "Import macros from another template file.",
    body: [
      "{% from \"${1:macros.html}\" import ${2:input_field} %}"
    ],
    tags: [ "macro", "import", "template" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:import-as",
    name: "Import Macros as Namespace",
    prefix: "jinjaimportas",
    category: "jinja",
    description: "Import macros under a namespace.",
    body: [
      "{% import \"${1:macros.html}\" as ${2:forms} %}",
      "{{ ${2:forms}.${3:input_field}(${4:field}) }}"
    ],
    tags: [ "macro", "import", "namespace" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:pluralize",
    name: "Pluralize Text",
    prefix: "jinjaplural",
    category: "jinja",
    description: "Display singular or plural text based on a count.",
    body: [
      "{{ ${1:count} }} ${1:count} {% if ${1:count} == 1 %}${2:item}{% else %}${3:items}{% endif %}"
    ],
    tags: [ "condition", "plural", "count" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:csrf-hidden",
    name: "CSRF Hidden Field",
    prefix: "jinjacsrffield",
    category: "jinja",
    description: "Render a Flask-WTF CSRF hidden field.",
    body: [
      "{{ csrf_token() }}"
    ],
    tags: [ "flask", "csrf", "security" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:current-user",
    name: "Current User",
    prefix: "jinjacurrentuser",
    category: "jinja",
    description: "Render information about the authenticated Flask-Login user.",
    body: [
      "{% if current_user.is_authenticated %}",
      "    {{ current_user.${1:username} }}",
      "{% else %}",
      "    ${2:Guest}",
      "{% endif %}"
    ],
    tags: [ "flask", "login", "user" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:request-method",
    name: "Request Method",
    prefix: "jinjarequestmethod",
    category: "jinja",
    description: "Access the current request method.",
    body: [
      "{{ request.method }}"
    ],
    tags: [ "flask", "request", "method" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:request-args",
    name: "Request Query Arguments",
    prefix: "jinjarequestargs",
    category: "jinja",
    description: "Access a query parameter from the current request.",
    body: [
      "{{ request.args.get(\"${1:page}\", ${2:1}) }}"
    ],
    tags: [ "flask", "request", "query" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:request-path",
    name: "Request Path",
    prefix: "jinjarequestpath",
    category: "jinja",
    description: "Render the current request path.",
    body: [
      "{{ request.path }}"
    ],
    tags: [ "flask", "request", "path" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:config",
    name: "Application Config",
    prefix: "jinjaconfig",
    category: "jinja",
    description: "Access a Flask application configuration value.",
    body: [
      "{{ config[\"${1:SECRET_KEY}\"] }}"
    ],
    tags: [ "flask", "config", "application" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:static-css",
    name: "Stylesheet Link",
    prefix: "jinjacss",
    category: "jinja",
    description: "Include a static CSS file.",
    body: [
      "<link rel=\"stylesheet\" href=\"{{ url_for('static', filename='${1:css/style.css}') }}\">"
    ],
    tags: [ "flask", "static", "css" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:static-js",
    name: "JavaScript Script",
    prefix: "jinjajs",
    category: "jinja",
    description: "Include a static JavaScript file.",
    body: [
      "<script src=\"{{ url_for('static', filename='${1:js/script.js}') }}\" defer></script>"
    ],
    tags: [ "flask", "static", "javascript" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:static-image",
    name: "Static Image",
    prefix: "jinjaimage",
    category: "jinja",
    description: "Render an image from the static folder.",
    body: [
      "<img src=\"{{ url_for('static', filename='${1:images/photo.png}') }}\" alt=\"${2:Description}\">"
    ],
    tags: [ "flask", "static", "image" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:active-link",
    name: "Active Navigation Link",
    prefix: "jinjaactivelink",
    category: "jinja",
    description: "Apply a class when the current request endpoint matches.",
    body: [
      "<a href=\"{{ url_for('${1:main.index}') }}\"",
      "   class=\"{% if request.endpoint == '${1:main.index}' %}active{% endif %}\">",
      "    ${2:Home}",
      "</a>"
    ],
    tags: [ "flask", "navigation", "active" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:pagination",
    name: "Pagination Controls",
    prefix: "jinjapagination",
    category: "jinja",
    description: "Render previous and next links for a Flask-SQLAlchemy pagination object.",
    body: [
      "{% if ${1:pagination}.has_prev %}",
      "    <a href=\"{{ url_for('${2:main.index}', page=${1:pagination}.prev_num) }}\">Previous</a>",
      "{% endif %}",
      "",
      "{% if ${1:pagination}.has_next %}",
      "    <a href=\"{{ url_for('${2:main.index}', page=${1:pagination}.next_num) }}\">Next</a>",
      "{% endif %}"
    ],
    tags: [ "flask", "pagination", "navigation" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:pagination-pages",
    name: "Pagination Page Numbers",
    prefix: "jinjapages",
    category: "jinja",
    description: "Render page number links from a pagination object.",
    body: [
      "{% for page_num in ${1:pagination}.iter_pages() %}",
      "    {% if page_num %}",
      "        {% if page_num == ${1:pagination}.page %}",
      "            <strong>{{ page_num }}</strong>",
      "        {% else %}",
      "            <a href=\"{{ url_for('${2:main.index}', page=page_num) }}\">{{ page_num }}</a>",
      "        {% endif %}",
      "    {% else %}",
      "        <span>…</span>",
      "    {% endif %}",
      "{% endfor %}"
    ],
    tags: [ "flask", "pagination", "navigation" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:table",
    name: "Dynamic HTML Table",
    prefix: "jinjatable",
    category: "jinja",
    description: "Render a table from a collection of objects.",
    body: [
      "<table>",
      "    <thead>",
      "        <tr>",
      "            <th>${1:Name}</th>",
      "            <th>${2:Value}</th>",
      "        </tr>",
      "    </thead>",
      "    <tbody>",
      "        {% for ${3:item} in ${4:items} %}",
      "            <tr>",
      "                <td>{{ ${3:item}.${5:name} }}</td>",
      "                <td>{{ ${3:item}.${6:value} }}</td>",
      "            </tr>",
      "        {% else %}",
      "            <tr><td colspan=\"2\">${7:No records found}</td></tr>",
      "        {% endfor %}",
      "    </tbody>",
      "</table>"
    ],
    tags: [ "html", "table", "loop" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:select",
    name: "Dynamic Select Options",
    prefix: "jinjaselect",
    category: "jinja",
    description: "Render select options from a collection.",
    body: [
      "<select name=\"${1:category}\">",
      "    {% for ${2:item} in ${3:items} %}",
      "        <option value=\"{{ ${2:item}.id }}\">{{ ${2:item}.name }}</option>",
      "    {% endfor %}",
      "</select>"
    ],
    tags: [ "html", "form", "select", "loop" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:checkboxes",
    name: "Dynamic Checkboxes",
    prefix: "jinjacheckboxes",
    category: "jinja",
    description: "Render checkboxes from a collection.",
    body: [
      "{% for ${1:item} in ${2:items} %}",
      "    <label>",
      "        <input type=\"checkbox\" name=\"${3:choices}\" value=\"{{ ${1:item}.id }}\">",
      "        {{ ${1:item}.name }}",
      "    </label>",
      "{% endfor %}"
    ],
    tags: [ "html", "form", "checkbox", "loop" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:radio",
    name: "Dynamic Radio Buttons",
    prefix: "jinjaradio",
    category: "jinja",
    description: "Render radio buttons from a collection.",
    body: [
      "{% for ${1:item} in ${2:items} %}",
      "    <label>",
      "        <input type=\"radio\" name=\"${3:choice}\" value=\"{{ ${1:item}.id }}\">",
      "        {{ ${1:item}.name }}",
      "    </label>",
      "{% endfor %}"
    ],
    tags: [ "html", "form", "radio", "loop" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:checked",
    name: "Checked Form Value",
    prefix: "jinjachecked",
    category: "jinja",
    description: "Mark an option as checked when it matches the submitted value.",
    body: [
      "{% if ${1:item}.id == ${2:selected_id} %}checked{% endif %}"
    ],
    tags: [ "html", "form", "checked", "condition" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:selected",
    name: "Selected Option",
    prefix: "jinjaselected",
    category: "jinja",
    description: "Mark a select option as selected when it matches the current value.",
    body: [
      "{% if ${1:item}.id == ${2:selected_id} %}selected{% endif %}"
    ],
    tags: [ "html", "form", "selected", "condition" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:form-errors",
    name: "Display All Form Errors",
    prefix: "jinjaformerrors",
    category: "jinja",
    description: "Display validation errors for every Flask-WTF form field.",
    body: [
      "{% for field in ${1:form} %}",
      "    {% for error in field.errors %}",
      "        <div class=\"error\">",
      "            {{ field.label.text }}: {{ error }}",
      "        </div>",
      "    {% endfor %}",
      "{% endfor %}"
    ],
    tags: [ "flask-wtf", "form", "errors", "validation" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:form-field",
    name: "Reusable Form Field",
    prefix: "jinjafield",
    category: "jinja",
    description: "Render a form field with label, widget, and validation errors.",
    body: [
      "<div class=\"form-group\">",
      "    {{ ${1:field}.label }}",
      "    {{ ${1:field}(class=\"${2:form-control}\") }}",
      "    {% for error in ${1:field}.errors %}",
      "        <small class=\"error\">{{ error }}</small>",
      "    {% endfor %}",
      "</div>"
    ],
    tags: [ "flask-wtf", "form", "field", "validation" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:form-submit",
    name: "Form Submit Button",
    prefix: "jinjasubmit",
    category: "jinja",
    description: "Render a Flask-WTF submit field.",
    body: [
      "{{ ${1:form}.submit(class=\"${2:btn btn-primary}\") }}"
    ],
    tags: [ "flask-wtf", "form", "submit" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:form-hidden",
    name: "Hidden Form Field",
    prefix: "jinjahidden",
    category: "jinja",
    description: "Render a hidden Flask-WTF field.",
    body: [
      "{{ ${1:form}.${2:hidden_field}(value=\"${3:value}\") }}"
    ],
    tags: [ "flask-wtf", "form", "hidden" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:json",
    name: "Render JSON",
    prefix: "jinjajson",
    category: "jinja",
    description: "Serialize a value as JSON for embedding in a template.",
    body: [
      "{{ ${1:data}|tojson }}"
    ],
    tags: [ "filter", "json", "data" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:tojson-script",
    name: "JSON Script Data",
    prefix: "jinjajsonscript",
    category: "jinja",
    description: "Safely expose server data to JavaScript using Jinja's tojson filter.",
    body: [
      "<script>",
      "    const ${1:data} = {{ ${2:data}|tojson }};",
      "</script>"
    ],
    tags: [ "javascript", "json", "data" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:debug",
    name: "Debug Variable",
    prefix: "jinjadebug",
    category: "jinja",
    description: "Temporarily inspect a variable in rendered HTML.",
    body: [
      "<pre>{{ ${1:value}|pprint }}</pre>"
    ],
    tags: [ "debug", "filter", "development" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:spaceless",
    name: "Whitespace Control",
    prefix: "jinjawhitespace",
    category: "jinja",
    description: "Control whitespace around Jinja template tags.",
    body: [
      "{%- ${1:statement} -%}"
    ],
    tags: [ "whitespace", "syntax", "formatting" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:raw",
    name: "Raw Block",
    prefix: "jinjaraw",
    category: "jinja",
    description: "Prevent Jinja from interpreting template syntax inside a block.",
    body: [
      "{% raw %}",
      "    ${1:{{ example }}}",
      "{% endraw %}"
    ],
    tags: [ "raw", "syntax" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:verbatim",
    name: "Verbatim Template Syntax",
    prefix: "jinjaverbatim",
    category: "jinja",
    description: "Output literal template syntax inside a raw block.",
    body: [
      "{% raw %}{{ ${1:variable} }}{% endraw %}"
    ],
    tags: [ "raw", "literal", "syntax" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:cycle",
    name: "Alternate Row Classes",
    prefix: "jinjacycle",
    category: "jinja",
    description: "Alternate CSS classes while iterating over a collection.",
    body: [
      "{% for ${1:item} in ${2:items} %}",
      "    <div class=\"{{ loop.cycle('${3:odd}', '${4:even}') }}\">",
      "        {{ ${1:item} }}",
      "    </div>",
      "{% endfor %}"
    ],
    tags: [ "loop", "cycle", "html" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:changed",
    name: "Detect Changed Loop Value",
    prefix: "jinjachanged",
    category: "jinja",
    description: "Detect when a loop value changes.",
    body: [
      "{% for ${1:item} in ${2:items}|sort(attribute='${3:category}') %}",
      "    {% if loop.changed(${1:item}.${3:category}) %}",
      "        <h3>{{ ${1:item}.${3:category} }}</h3>",
      "    {% endif %}",
      "    ${4:}",
      "{% endfor %}"
    ],
    tags: [ "loop", "changed", "grouping" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:groupby",
    name: "Group Collection",
    prefix: "jinjagroupby",
    category: "jinja",
    description: "Group collection items by an attribute.",
    body: [
      "{% for ${1:group}, ${2:items} in ${3:items}|groupby('${4:category}') %}",
      "    <h3>{{ ${1:group} }}</h3>",
      "    {% for item in ${2:items} %}",
      "        {{ item.name }}",
      "    {% endfor %}",
      "{% endfor %}"
    ],
    tags: [ "filter", "groupby", "collection" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:if-expression",
    name: "Inline Conditional",
    prefix: "jinjaconditional",
    category: "jinja",
    description: "Choose a value using an inline conditional expression.",
    body: [
      "{{ '${1:Yes}' if ${2:condition} else '${3:No}' }}"
    ],
    tags: [ "condition", "inline", "expression" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:ternary-class",
    name: "Conditional CSS Class",
    prefix: "jinjaclass",
    category: "jinja",
    description: "Apply a CSS class based on a condition.",
    body: [
      "<div class=\"${1:card} {% if ${2:condition} %}${3:active}{% endif %}\">",
      "    ${4:}",
      "</div>"
    ],
    tags: [ "html", "css", "condition" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:if-in",
    name: "Membership Check",
    prefix: "jinjain",
    category: "jinja",
    description: "Check whether a value exists in a collection.",
    body: [
      "{% if ${1:value} in ${2:collection} %}",
      "    ${3:}",
      "{% endif %}"
    ],
    tags: [ "condition", "membership", "collection" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:if-not",
    name: "Negated Condition",
    prefix: "jinjanot",
    category: "jinja",
    description: "Run a block when a condition is false.",
    body: [
      "{% if not ${1:condition} %}",
      "    ${2:}",
      "{% endif %}"
    ],
    tags: [ "condition", "not", "logic" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:elif",
    name: "Else If Branch",
    prefix: "jinjaelseif",
    category: "jinja",
    description: "Add an additional conditional branch.",
    body: [
      "{% elif ${1:condition} %}",
      "    ${2:}"
    ],
    tags: [ "condition", "elif" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:with-context",
    name: "With Context Include",
    prefix: "jinjaincludecontext",
    category: "jinja",
    description: "Include a template while explicitly passing the current context.",
    body: [
      "{% include \"${1:partials/card.html}\" with context %}"
    ],
    tags: [ "include", "context", "template" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:without-context",
    name: "Include Without Context",
    prefix: "jinjaincludenocontext",
    category: "jinja",
    description: "Include a template without passing the current context.",
    body: [
      "{% include \"${1:partials/card.html}\" without context %}"
    ],
    tags: [ "include", "context", "template" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:ignore-missing",
    name: "Optional Include",
    prefix: "jinjaoptionalinclude",
    category: "jinja",
    description: "Include a template only if it exists.",
    body: [
      "{% include \"${1:partials/optional.html}\" ignore missing %}"
    ],
    tags: [ "include", "optional", "template" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:extends-scope",
    name: "Extend Template with Scoped Blocks",
    prefix: "jinjaextendscope",
    category: "jinja",
    description: "Define a block that receives the current template context.",
    body: [
      "{% block ${1:content} scoped %}",
      "    ${2:}",
      "{% endblock %}"
    ],
    tags: [ "inheritance", "block", "scope" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:super",
    name: "Parent Block Content",
    prefix: "jinjasuper",
    category: "jinja",
    description: "Render the parent template block content.",
    body: [
      "{{ super() }}"
    ],
    tags: [ "inheritance", "block", "super" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:call-config",
    name: "Flask Config Conditional",
    prefix: "jinjaconfigif",
    category: "jinja",
    description: "Render content based on a Flask configuration setting.",
    body: [
      "{% if config.get('${1:FEATURE_ENABLED}', false) %}",
      "    ${2:}",
      "{% endif %}"
    ],
    tags: [ "flask", "config", "condition" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:request-user-agent",
    name: "Request User Agent",
    prefix: "jinjauseragent",
    category: "jinja",
    description: "Access the current request user-agent string.",
    body: [
      "{{ request.user_agent.string }}"
    ],
    tags: [ "flask", "request", "user-agent" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:request-url",
    name: "Request URL",
    prefix: "jinjarequesturl",
    category: "jinja",
    description: "Render the current full request URL.",
    body: [
      "{{ request.url }}"
    ],
    tags: [ "flask", "request", "url" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:request-referrer",
    name: "Request Referrer",
    prefix: "jinjareferrer",
    category: "jinja",
    description: "Access the referring URL when available.",
    body: [
      "{{ request.referrer or '' }}"
    ],
    tags: [ "flask", "request", "referrer" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:request-json",
    name: "Request JSON Data",
    prefix: "jinjarequestjson",
    category: "jinja",
    description: "Access JSON data attached to the current request, if available.",
    body: [
      "{{ request.get_json(silent=true) }}"
    ],
    tags: [ "flask", "request", "json" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:session",
    name: "Session Value",
    prefix: "jinjasession",
    category: "jinja",
    description: "Read a value from the Flask session.",
    body: [
      "{{ session.get('${1:user_id}') }}"
    ],
    tags: [ "flask", "session", "value" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:session-if",
    name: "Session Conditional",
    prefix: "jinjasessionif",
    category: "jinja",
    description: "Render content when a session value exists.",
    body: [
      "{% if session.get('${1:user_id}') %}",
      "    ${2:}",
      "{% endif %}"
    ],
    tags: [ "flask", "session", "condition" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:flash-category",
    name: "Flash Message Category",
    prefix: "jinjaflashcategory",
    category: "jinja",
    description: "Render a flash message with its category.",
    body: [
      "{% for category, message in get_flashed_messages(with_categories=true) %}",
      "    <div class=\"alert alert-{{ category }}\" role=\"alert\">",
      "        {{ message }}",
      "    </div>",
      "{% endfor %}"
    ],
    tags: [ "flask", "flash", "category" ],
    scope: [ "html" ]
  },
  {
    id: "jinja:csrf-form",
    name: "Flask-WTF CSRF Form",
    prefix: "jinjacsrfwtf",
    category: "jinja",
    description: "Render the CSRF token using a Flask-WTF form object.",
    body: [
      "<form method=\"POST\">",
      "    {{ ${1:form}.csrf_token }}",
      "    ${2:}",
      "</form>"
    ],
    tags: [ "flask-wtf", "csrf", "form" ],
    scope: [ "html" ]
  },
];

export default jinjaSnippets;
