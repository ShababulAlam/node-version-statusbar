import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export function activate(context: vscode.ExtensionContext) {
  console.log("Node Version Status Bar extension is now active!");

  const nodeVersionProvider = new NodeVersionProvider();

  // Register commands
  const refreshCommand = vscode.commands.registerCommand(
    "nodeVersion.refresh",
    () => {
      nodeVersionProvider.refresh();
    },
  );

  const copyVersionCommand = vscode.commands.registerCommand(
    "nodeVersion.copyVersion",
    async () => {
      const version = await nodeVersionProvider.getNodeVersion();
      if (version) {
        await vscode.env.clipboard.writeText(version);
        vscode.window.showInformationMessage(
          `Node.js version ${version} copied to clipboard!`,
        );
      }
    },
  );

  context.subscriptions.push(
    refreshCommand,
    copyVersionCommand,
    nodeVersionProvider,
  );

  // Initialize the status bar
  nodeVersionProvider.refresh();
}

class NodeVersionProvider implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private refreshTimer?: NodeJS.Timeout;

  constructor() {
    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );

    // Set up click behavior
    this.statusBarItem.command = "nodeVersion.copyVersion";
    this.statusBarItem.tooltip = "Click to copy Node.js version to clipboard";

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("nodeVersion")) {
        this.updateConfiguration();
      }
    });

    this.updateConfiguration();
  }

  private updateConfiguration() {
    const config = vscode.workspace.getConfiguration("nodeVersion");
    const showInStatusBar = config.get<boolean>("showInStatusBar", true);
    const refreshInterval = config.get<number>("refreshInterval", 0);

    if (showInStatusBar) {
      this.statusBarItem.show();
    } else {
      this.statusBarItem.hide();
    }

    // Set up auto-refresh if configured
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }

    if (refreshInterval > 0) {
      this.refreshTimer = setInterval(() => {
        this.refresh();
      }, refreshInterval * 1000);
    }
  }

  async refresh(): Promise<void> {
    try {
      const version = await this.getNodeVersion();
      this.updateStatusBar(version);
    } catch (error) {
      console.error("Failed to get Node.js version:", error);
      this.updateStatusBar(null, "Failed to get Node.js version");
    }
  }

  async getNodeVersion(): Promise<string | null> {
    try {
      const { stdout } = await execAsync("node --version");
      return stdout.trim();
    } catch (error) {
      // Try alternative methods
      try {
        // Check if we're in a workspace with package.json
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
          // Try using npx to get version
          const { stdout } = await execAsync("npx node --version", {
            cwd: workspaceFolders[0].uri.fsPath,
          });
          return stdout.trim();
        }
      } catch (npxError) {
        console.error("Alternative method also failed:", npxError);
      }

      return null;
    }
  }

  private updateStatusBar(version: string | null, errorMessage?: string) {
    if (!version && !errorMessage) {
      this.statusBarItem.text = "$(warning) Node.js not found";
      this.statusBarItem.tooltip =
        "Node.js is not installed or not in PATH. Click to refresh.";
      this.statusBarItem.command = "nodeVersion.refresh";
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.warningBackground",
      );
    } else if (errorMessage) {
      this.statusBarItem.text = "$(error) Node Error";
      this.statusBarItem.tooltip = errorMessage + ". Click to refresh.";
      this.statusBarItem.command = "nodeVersion.refresh";
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.errorBackground",
      );
    } else {
      const config = vscode.workspace.getConfiguration("nodeVersion");
      const template = config.get<string>(
        "statusBarText",
        "$(symbol-method) Node {version}",
      );

      this.statusBarItem.text = template.replace("{version}", version!);
      this.statusBarItem.tooltip = `Node.js ${version}\nClick to copy to clipboard\nRight-click for more options`;
      this.statusBarItem.command = "nodeVersion.copyVersion";
      this.statusBarItem.backgroundColor = undefined;
    }
  }

  dispose() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.statusBarItem.dispose();
  }
}

export function deactivate() {
  console.log("Node Version Status Bar extension deactivated");
}
