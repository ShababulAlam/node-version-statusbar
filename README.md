# Node Version Status Bar

A simple and lightweight VS Code extension that displays your current Node.js version in the status bar.

![Node Version Status Bar Demo](https://via.placeholder.com/600x100/1e1e1e/00ff00?text=Node+v18.17.0)

## Features

- **🚀 Instant Display**: Shows your current Node.js version right in the status bar
- **📋 One-Click Copy**: Click the status bar item to copy the version to your clipboard
- **🔄 Auto-Refresh**: Optional automatic refresh at custom intervals
- **⚙️ Customizable**: Personalize the display format and behavior
- **🛡️ Error Handling**: Clear indicators when Node.js isn't found or accessible
- **🎯 Lightweight**: Minimal performance impact on VS Code

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "Node Version Status Bar"
4. Click "Install"

### Manual Installation
1. Download the `.vsix` file from the releases page
2. Open VS Code
3. Press `Ctrl+Shift+P` and run "Extensions: Install from VSIX..."
4. Select the downloaded file

## Usage

Once installed, the extension automatically:
- Detects your Node.js version
- Displays it in the status bar (bottom-left area)
- Updates when you restart VS Code or manually refresh

### Quick Actions

| Action | Description |
|--------|-------------|
| **Click** status bar item | Copy Node.js version to clipboard |
| **Command Palette** → "Refresh Node Version" | Manually refresh the displayed version |
| **Command Palette** → "Copy Node Version" | Copy version to clipboard |

## Configuration

Customize the extension through VS Code settings (`Ctrl+,`):

```json
{
  "nodeVersion.showInStatusBar": true,
  "nodeVersion.statusBarText": "$(symbol-method) Node {version}",
  "nodeVersion.refreshInterval": 0
}
```

### Available Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `nodeVersion.showInStatusBar` | boolean | `true` | Show/hide the Node.js version in status bar |
| `nodeVersion.statusBarText` | string | `"$(symbol-method) Node {version}"` | Custom display format. Use `{version}` as placeholder |
| `nodeVersion.refreshInterval` | number | `0` | Auto-refresh interval in seconds (0 = disabled) |

### Custom Display Formats

You can customize how the version appears using these examples:

```json
// Simple text
"nodeVersion.statusBarText": "Node {version}"

// With emoji
"nodeVersion.statusBarText": "⚡ {version}"

// With VS Code icons
"nodeVersion.statusBarText": "$(logo-github) Node.js {version}"
"nodeVersion.statusBarText": "$(gear) {version}"
"nodeVersion.statusBarText": "$(rocket) Node {version}"

// Minimal
"nodeVersion.statusBarText": "{version}"
```

## Commands

The extension provides these commands (accessible via `Ctrl+Shift+P`):

- **Node Version: Refresh Node Version** - Manually refresh the displayed version
- **Node Version: Copy Node Version** - Copy the current Node.js version to clipboard

## Troubleshooting

### Node.js Version Not Showing

**Problem**: Status bar shows "Node.js not found" or warning icon

**Solutions**:
1. **Verify Node.js Installation**:
   ```bash
   node --version
   ```
   If this doesn't work, Node.js isn't installed or not in your PATH.

2. **Check PATH Environment**:
   - Restart VS Code after installing Node.js
   - Ensure Node.js is in your system PATH
   - Try opening a new terminal in VS Code

3. **Manual Refresh**:
   - Press `Ctrl+Shift+P`
   - Run "Node Version: Refresh Node Version"

### Permission Issues

**Problem**: Extension shows error state despite Node.js being installed

**Solutions**:
1. Run VS Code as administrator (Windows) or with proper permissions
2. Check if Node.js executable has proper permissions
3. Try restarting VS Code

### Version Not Updating

**Problem**: Status bar shows old Node.js version after update

**Solutions**:
1. Restart VS Code completely
2. Use the refresh command: `Ctrl+Shift+P` → "Node Version: Refresh Node Version"
3. Check if you have multiple Node.js versions (nvm, fnm, etc.)

## Development

### Building from Source

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd node-version-statusbar
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Compile TypeScript**:
   ```bash
   npm run compile
   ```

4. **Run in Development Mode**:
   - Open the project in VS Code
   - Press `F5` to launch Extension Development Host
   - Test the extension in the new window

### Scripts

```bash
npm run compile    # Compile TypeScript
npm run watch      # Watch for changes and compile
npm run lint       # Run ESLint
npm run test       # Run tests
```

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Guidelines

1. Follow existing code style and conventions
2. Add tests for new features
3. Update documentation as needed
4. Ensure all existing tests pass

## Changelog

### [1.0.0] - Initial Release
- ✨ Display Node.js version in status bar
- 📋 Click to copy version to clipboard
- ⚙️ Customizable display format
- 🔄 Manual refresh command
- 🛡️ Error handling for missing Node.js

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/shababulalam/node-version-statusbar/issues)
- **Discussions**: [GitHub Discussions](https://github.com/shababulalam/node-version-statusbar/discussions)
- **Email**: sababul37@gmail.com

## Acknowledgments

- Thanks to the VS Code team for excellent extension APIs
- Inspired by similar status bar extensions in the VS Code marketplace

---

**Enjoy coding with Node.js! 🚀**

*If you find this extension useful, please consider giving it a ⭐ on GitHub and leaving a review on the VS Code Marketplace.*