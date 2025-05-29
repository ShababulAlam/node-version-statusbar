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

## [1.3.1] - 2025-05-28
### Added
- 🖥️ **Enhanced Windows NVM Support**: Terminal first approach added

## [1.3.0] - 2025-05-28

### Added
- 🔄 **Automatic VS Code Reload**: VS Code now automatically reloads after successful Node.js version switching
- ✅ **Version Switch Verification**: Extension now verifies that version switching was successful before proceeding
- 🖥️ **Enhanced Windows NVM Support**: Multiple execution methods for maximum Windows compatibility
- 📊 **Advanced Progress Reporting**: Detailed progress messages during version switching operations
- 🛡️ **Robust Fallback System**: Automatic fallback to alternative execution methods when primary methods fail
- 🔧 **Multiple Execution Strategies**: 4 different command execution methods for Windows NVM compatibility

### Fixed
- 🐛 **Windows NVM Terminal Error**: Completely resolved "NVM for Windows should be run from terminal" error
- 🔧 **Platform-Specific Execution**: Enhanced Windows platform detection with proper CMD/PowerShell execution
- 📝 **Version Format Handling**: Improved version number formatting for all Windows NVM configurations
- ⚡ **Shell Context Issues**: Automatic shell selection and environment configuration for NVM operations
- 🎯 **Command Execution Reliability**: Multiple execution methods ensure commands work across different Windows setups
- 🛠️ **Environment Variable Handling**: Proper PATH and environment variable management for NVM operations

### Changed
- 🚀 **Version Switching Flow**: Enhanced switching process with automatic verification and reload
- 💬 **User Feedback System**: More informative progress messages and success confirmations
- ⏱️ **Execution Strategy**: Primary direct execution with intelligent terminal fallback
- 🔄 **Reload Behavior**: Auto-reload by default with option to skip for user control
- 🖥️ **Terminal Integration**: Enhanced terminal creation with proper shell configuration for Windows NVM

### Technical Improvements
- 🏗️ **Multi-Method Execution**: 4-tier execution strategy for maximum Windows NVM compatibility
- 🛠️ **Enhanced Error Handling**: Comprehensive error handling with graceful fallbacks
- 📋 **Command Strategy Pattern**: Intelligent command execution with method prioritization
- 🔍 **Verification System**: Post-execution verification to ensure operations completed successfully
- 🎯 **Cross-Platform Optimization**: Platform-specific optimizations for Windows, macOS, and Linux
- 💡 **Smart Terminal Handling**: Context-aware terminal creation with proper environment setup

### Windows NVM Specific Fixes
- 🔧 **Method 1**: Direct cmd.exe shell execution with windowsHide option
- 🔧 **Method 2**: Explicit `cmd /c "command"` execution for compatibility
- 🔧 **Method 3**: PowerShell command execution as alternative
- 🔧 **Method 4**: Environment-specific execution with proper ComSpec configuration
- 🔧 **Fallback**: Enhanced terminal method with detailed step-by-step feedback
- 🔧 **Terminal Enhancement**: Persistent cmd.exe terminal with /k flag for NVM operations

### User Experience Enhancements
- ✨ **Seamless Workflow**: Version switching now feels instant and reliable
- 🎯 **Clear Feedback**: Users always know what's happening during operations
- 🛡️ **Maximum Reliability**: Multiple fallback methods ensure operations rarely fail
- 💡 **Intelligent Automation**: Smart defaults with user override options
- 🔄 **Consistent Behavior**: Reliable operation across all Windows configurations

## [1.2.0] - 2025-05-28

### Added
- 🔄 **Automatic VS Code Reload**: VS Code now automatically reloads after successful Node.js version switching
- ✅ **Version Switch Verification**: Extension now verifies that version switching was successful before proceeding
- 🖥️ **Direct Command Execution**: Improved version switching by executing commands directly instead of only using terminals
- 📊 **Enhanced Progress Reporting**: Detailed progress messages during version switching ("Executing switch command...", "Verifying switch...", "Switch completed!")
- 🛡️ **Fallback Terminal Method**: If direct execution fails, gracefully falls back to terminal-based switching

### Fixed
- 🐛 **Windows NVM Compatibility**: Fixed "NVM for Windows should be run from terminal such as CMD or Powershell" error
- 🔧 **Platform-Specific Command Execution**: Added proper Windows platform detection and CMD execution for NVM commands
- 📝 **Version Format Handling**: Fixed version number formatting for Windows NVM (removes 'v' prefix when needed)
- ⚡ **Terminal Shell Selection**: Automatically uses `cmd.exe` for NVM operations on Windows
- 🎯 **Version Parsing**: Enhanced version line parsing to handle both Windows and Unix NVM output formats

### Changed
- 🚀 **Improved Version Switching Flow**: Version switching now waits for actual completion before showing success messages
- 💬 **Better User Feedback**: More informative progress messages and error handling during version operations
- ⏱️ **Timing Improvements**: Better timing coordination between progress dialogs and confirmation prompts
- 🔄 **Reload Prompt Logic**: Reload prompt only appears after successful version switching verification

### Technical Improvements
- 🏗️ **Enhanced Error Handling**: Comprehensive error handling with graceful fallbacks for different execution methods
- 🛠️ **Cross-Platform Compatibility**: Improved support for Windows, macOS, and Linux environments
- 📋 **Command Execution Strategy**: Dual approach with direct execution and terminal fallback for maximum compatibility
- 🔍 **Version Detection**: More robust current version detection and verification after switching

### User Experience
- ✨ **Seamless Workflow**: Version switching now feels instant with automatic reload
- 🎯 **Clear Status Updates**: Users always know what's happening during version operations
- 🛡️ **Reliable Operation**: Reduced failures and improved success rates for version switching
- 💡 **Intuitive Feedback**: Better visual and textual feedback throughout the switching process

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

### From v1.1.0 to v1.2.0

**No Breaking Changes** - Your existing configuration will continue to work exactly as before.

#### New Behavior
- **Automatic Reload**: VS Code now automatically reloads after successful Node.js version switching
- **Better Windows Support**: Fixed NVM for Windows compatibility issues
- **Improved Reliability**: More robust version switching with better error handling

#### Enhanced Features You'll Notice
1. **Seamless Version Switching**: No more manual reloading required - VS Code handles it automatically
2. **Better Progress Feedback**: Clear progress messages during version switching operations
3. **Windows NVM Fixed**: Windows users can now switch versions without terminal errors
4. **Verification System**: Extension verifies version switches were successful before proceeding

#### Settings (No Changes Required)
All existing settings continue to work without any changes:
```json
{
  "nodeVersion.preferredManager": "auto",
  "nodeVersion.showSwitchButton": true,
  "nodeVersion.showInStatusBar": true,
  "nodeVersion.statusBarText": "$(symbol-method) Node {version}",
  "nodeVersion.refreshInterval": 0
}
```

### From v1.0.0 to v1.2.0

**No Breaking Changes** - Direct upgrade path available.

#### Major New Features Since v1.0.0
1. **Version Switching**: Click status bar to switch between installed Node.js versions
2. **Version Manager Support**: Works with nvm, fnm, and volta
3. **Version Installation**: Install new Node.js versions from within VS Code
4. **Automatic Reload**: VS Code reloads automatically after version switches
5. **Windows Compatibility**: Full support for Windows NVM

#### Migrating from Copy-Only Behavior
- **Old**: Click status bar → copies version to clipboard
- **New**: Click status bar → opens version picker to switch versions
- **Copy Function**: Still available via Command Palette (`Ctrl+Shift+P` → "Copy Node Version")

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