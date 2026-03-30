# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-03-30

### Changed
- Unified command and settings naming in documentation to `STM32-Program-1-Click`.

### Removed
- Removed unused setting `STM32-Program-1-Click.autoBuild` to avoid confusion.
- Removed non-Windows default programmer path detection logic.
- Removed redunctant parts in documentation.

### Fixed
- Fixed status bar event subscription lifecycle by disposing all registered listeners.
- Reduced frequent global scans in status bar visibility updates by caching STM32 project detection and refreshing only on relevant workspace events (`.ioc` create/delete, workspace folder changes).
- Fixed Promise compatibility in status bar project detection flow by avoiding reliance on `Promise.finally`.
