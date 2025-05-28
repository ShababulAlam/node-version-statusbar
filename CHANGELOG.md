# Changelog

All notable changes to the "Node Version Switch Status Bar" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Workspace-specific Node.js version management
- Package.json engine version comparison and warnings
- Integration with .nvmrc files
- Custom installation paths support

## [1.1.0] - 2025-05-28

### Added
- 🚀 **Node.js Version Switching**: Click status bar to switch between installed Node.js versions
- 🛠️ **Multi-Manager Support**: Support for nvm, fnm, and volta version managers
- 📦 **Install New Versions**: Install new Node.js versions directly from VS Code
- 🎯 **Smart Version Detection**: Automatically detects available version managers and installed versions
- ⚡ **Quick Pick Interface**: Beautiful version picker with current version highlighting
- 🔧 **Integrated Terminal**: Uses VS Code terminal for version switching operations
- 📋 **Enhanced Commands**: New commands for switching and installing versions

### Changed
- 🖱️ **Status Bar Click Behavior**: Now opens version picker instead of copying (copy still available via command)
- 💡 **Improved Tooltips**: More informative tooltips with switching instructions
- 🎨 **Better Error States**: Enhanced error handling with actionable suggestions

### New Commands
- `Node Version: Switch Node Version` - Interactive version picker
- `Node Version: Install Node Version` - Install new Node.js versions

### New Configuration Options
- `nodeVersion.preferredManager` - Choose preferred version manager (auto, nvm, fnm, volta)
- `nodeVersion.showSwitchButton` - Enable/disable status bar click to switch

### Technical Improvements
- 🏗️ **Modular Architecture**: Separated version manager logic for better maintainability
- 🔍 **Enhanced Detection**: Better parsing of version manager outputs
- 🛡️ **Robust Error Handling**: Comprehensive error handling for all supported managers
- ⚡ **Performance Optimized**: Cached version manager detection

### Compatibility
- ✅ **Backward Compatible**: All existing functionality preserved
- 🔄 **Existing Settings**: All v1.0.0 settings continue to work
- 📱 **Cross-Platform**: Tested on Windows, macOS, and Linux

## [1.0.0] - 2025-05-28

### Added
- 🎉 Initial release of Node Version Switch Status Bar extension
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

## Migration Guide

### From v1.0.0 to v1.1.0

**No Breaking Changes** - Your existing configuration will continue to work exactly as before.

#### New Behavior
- **Status Bar Click**: Now opens version picker instead of copying version
- **Copy Function**: Still available via Command Palette (`Ctrl+Shift+P` → "Copy Node Version")

#### New Features You Can Use
1. **Switch Versions**: Click the status bar to see and switch between installed Node.js versions
2. **Install Versions**: Use Command Palette → "Install Node Version" to add new versions
3. **Version Manager Support**: Automatic detection of nvm, fnm, and volta

#### New Settings (Optional)
```json
{
  "nodeVersion.preferredManager": "auto",  // or "nvm", "fnm", "volta"
  "nodeVersion.showSwitchButton": true     // disable if you prefer old behavior
}
```

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