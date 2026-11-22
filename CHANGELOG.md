# Changelog

All notable changes to Flask Snippets will be documented here.

## [1.0.0] - 2026-11-22

### Added

- Initial release of Flask Snippets for Acode.
- 342 built-in snippets organized into six categories:
  - Flask Core
  - Architecture
  - Extensions
  - Database
  - Authentication
  - Jinja
- Flask and Python code snippets for common development tasks and workflows.
- Jinja snippets for template development.
- Native Acode autocomplete integration for seamless snippet insertion.
- Automatic snippet suggestions using configurable prefixes.
- Language scope filtering to display relevant snippets in supported files.
- Support for Python files: `.py` and `.pyw`.
- Support for Jinja and HTML template files: `.html`, `.htm`, `.xhtml`, `.jinja`, `.jinja2`, and `.j2`.
- Configurable indentation:
  - 2 spaces
  - 4 spaces
  - 8 spaces
  - Tabs
- Plugin enable/disable setting.
- Autocomplete enable/disable setting.
- Custom snippet management through the plugin's Settings page.
- Ability to add, edit, and delete custom snippets.
- Custom snippet support for names, prefixes, descriptions, code bodies, tags, and language scopes.
- Custom snippet validation to prevent duplicate IDs and prefixes.
- Automatic assignment of the `custom` category to user-created snippets.
- Configurable snippet indentation based on the selected plugin setting.

### Notes

- Flask Snippets provides code snippets only. It does not install Python, Flask, or third-party dependencies.
- Custom snippets can be managed through the plugin's Settings page.
- Snippet suggestions use Acode's native autocomplete experience.