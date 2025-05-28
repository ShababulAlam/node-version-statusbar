# Changelog

All notable changes to the "Node Version Status Bar" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Planned: Support for multiple Node.js version managers (nvm, fnm, volta)
- Planned: npm/yarn version display option
- Planned: Package.json engine version comparison

## [1.0.0] - 2025-05-28

### Added
- 🎉 Initial release of Node Version Status Bar extension
- ✨ Display current Node.js version in VS Code status bar
- 📋 Click to copy Node.js version to clipboard
- 🔄 Manual refresh command to update displayed version
- ⚙️ Configurable status bar text format with `{version}` placeholder
- 🛡️ Error handling for missing or inaccessible Node.js installations
- 📱 Status bar warning/error indicators for different states
- 🎨 Customizable display options through VS Code settings
- 🔧 Auto-refresh capability with configurable intervals
- 📝 Comprehensive documentation and README
- 🧪 TypeScript implementation with proper error handling
- 🎯 Lightweight implementation with minimal performance impact

### Configuration Options
- `nodeVersion.showInStatusBar` - Toggle status bar display
- `nodeVersion.statusBarText` - Customize display format
- `nodeVersion.refreshInterval` - Auto-refresh interval setting

### Commands
- `Node Version: Refresh Node Version` - Manual refresh
- `Node Version: Copy Node Version` - Copy to clipboard

### Technical Details
- Built with TypeScript for type safety
- Uses child_process.exec for Node.js version detection
- Implements proper disposal pattern for VS Code resources
- Follows VS Code extension best practices
- Includes comprehensive error handling and fallback mechanisms

---

## Version Template for Future Releases

### [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security improvements

---

## Release Notes Format

### Major Version (X.0.0)
- Breaking changes
- Major new features
- Significant architectural changes

### Minor Version (X.Y.0)
- New features
- Enhancements
- Non-breaking changes

### Patch Version (X.Y.Z)
- Bug fixes
- Small improvements
- Documentation updates

---

## Contribution Guidelines for Changelog

When contributing to this project, please:

1. **Add entries to [Unreleased]** section first
2. **Use consistent formatting** with existing entries
3. **Include appropriate emoji** for visual scanning
4. **Group changes by type** (Added, Changed, Fixed, etc.)
5. **Be descriptive** but concise in change descriptions
6. **Link to issues/PRs** when relevant: `([#123](link-to-issue))`
