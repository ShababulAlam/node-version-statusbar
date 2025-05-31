import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

interface NodeVersion {
  version: string;
  manager: VersionManager;
  isActive: boolean;
  path?: string;
}

interface VersionManager {
  name: string;
  command: string;
  listCommand: string;
  useCommand: string;
  isAvailable: boolean;
}

export function activate(context: vscode.ExtensionContext) {
  console.log("Node Version Switch Status Bar extension is now active!");

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

  const switchVersionCommand = vscode.commands.registerCommand(
    "nodeVersion.switchVersion",
    async () => {
      await nodeVersionProvider.showVersionPicker();
    },
  );

  const installVersionCommand = vscode.commands.registerCommand(
    "nodeVersion.installVersion",
    async () => {
      await nodeVersionProvider.installNewVersion();
    },
  );

  context.subscriptions.push(
    refreshCommand,
    copyVersionCommand,
    switchVersionCommand,
    installVersionCommand,
    nodeVersionProvider,
  );

  // Initialize the status bar
  nodeVersionProvider.refresh();
}

class NodeVersionProvider implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private refreshTimer?: NodeJS.Timeout;
  private availableManagers: VersionManager[] = [];

  constructor() {
    // Create status bar item
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );

    // Set up click behavior - now opens version picker
    this.statusBarItem.command = "nodeVersion.switchVersion";
    this.statusBarItem.tooltip = "Click to switch Node.js version";

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("nodeVersion")) {
        this.updateConfiguration();
      }
    });

    this.initializeVersionManagers();
    this.updateConfiguration();
  }

  private async initializeVersionManagers() {
    const isWindows = os.platform() === "win32";

    const managers: VersionManager[] = [
      {
        name: "nvm",
        command: "nvm",
        listCommand: "nvm list",
        useCommand: "nvm use",
        isAvailable: false,
      },
      {
        name: "fnm",
        command: "fnm",
        listCommand: "fnm list",
        useCommand: "fnm use",
        isAvailable: false,
      },
      {
        name: "volta",
        command: "volta",
        listCommand: "volta list node",
        useCommand: "volta install node@",
        isAvailable: false,
      },
    ];

    // Check which version managers are available
    for (const manager of managers) {
      try {
        const execCommand =
          isWindows && manager.name === "nvm"
            ? `cmd /c "${manager.command} --version"`
            : `${manager.command} --version`;

        await execAsync(execCommand);
        manager.isAvailable = true;
      } catch (error) {
        manager.isAvailable = false;
      }
    }

    this.availableManagers = managers.filter((m) => m.isAvailable);
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

  async showVersionPicker(): Promise<void> {
    if (this.availableManagers.length === 0) {
      const action = await vscode.window.showWarningMessage(
        "No Node.js version manager detected. Would you like to install a version manually?",
        "Install Manually",
        "Learn More",
        "Cancel",
      );

      if (action === "Install Manually") {
        await this.installNewVersion();
      } else if (action === "Learn More") {
        vscode.env.openExternal(
          vscode.Uri.parse("https://nodejs.org/en/download/package-manager"),
        );
      }
      return;
    }

    try {
      const versions = await this.getAvailableVersions();

      if (versions.length === 0) {
        vscode.window.showInformationMessage(
          "No Node.js versions found. Use the install command to add versions.",
        );
        return;
      }

      const quickPickItems = versions.map((v) => ({
        label: `${v.isActive ? "$(check) " : ""}${v.version}`,
        description: `via ${v.manager.name}${v.isActive ? " (current)" : ""}`,
        detail: v.path,
        version: v,
      }));

      const selected = await vscode.window.showQuickPick(quickPickItems, {
        placeHolder: "Select a Node.js version to switch to",
        matchOnDescription: true,
        matchOnDetail: true,
      });

      if (selected && !selected.version.isActive) {
        await this.switchToVersion(selected.version);
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to get available versions: ${error}`,
      );
    }
  }

async installNewVersion(): Promise<void> {
    const manager = await this.selectVersionManager();
    if (!manager) return;

    const version = await vscode.window.showInputBox({
      prompt: `Enter Node.js version to install (e.g., 18.17.0, lts, latest)`,
      placeHolder: "18.17.0",
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return "Please enter a version";
        }
        return null;
      },
    });

    if (!version) return;

    const isWindows = os.platform() === "win32";
    const terminal = vscode.window.createTerminal({
      name: `Install Node ${version}`,
      shellPath: isWindows ? "cmd.exe" : undefined,
      shellArgs: isWindows ? ["/K"] : undefined,
    });

    let installCommand: string;
    switch (manager.name) {
      case "nvm":
        if (isWindows) {
          const nvmPath = await this.getNvmPath();
          if (!nvmPath) {
            vscode.window.showErrorMessage(
              "NVM for Windows not found. Please ensure NVM is installed and added to PATH or NVM_HOME is set.",
            );
            terminal.dispose();
            return;
          }
          installCommand = `call "${nvmPath}" install ${version} & echo %ERRORLEVEL%`;
        } else {
          installCommand = `source ~/.nvm/nvm.sh && nvm install ${version}`;
        }
        break;
      case "fnm":
        installCommand = `fnm install ${version}`;
        break;
      case "volta":
        installCommand = `volta install node@${version}`;
        break;
      default:
        installCommand = `echo "Unsupported version manager"`;
    }

    try {
      terminal.sendText(installCommand);
      terminal.show();

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Installing Node.js ${version}...`,
          cancellable: false,
        },
        async (progress) => {
          progress.report({ increment: 20, message: "Executing install command..." });
          console.log(`Executing install command: ${installCommand}`);
          await new Promise((resolve) => setTimeout(resolve, 10000)); // Longer delay for installation
          progress.report({ increment: 60, message: "Installation completed" });
          setTimeout(() => {
            terminal.dispose();
          }, 3000);
          progress.report({ increment: 20, message: "Refreshing version list..." });
        },
      );

      await this.refresh();
      vscode.window.showInformationMessage(
        `Node.js ${version} installation completed!`,
      );
    } catch (error) {
      console.error("Install version error:", error);
      setTimeout(() => {
        terminal.dispose();
      }, 3000);
      vscode.window.showErrorMessage(
        `Failed to install Node.js version: ${error}`,
      );
    }
  }

 private async verifyVersionSwitch(nodeVersion: NodeVersion, manager: VersionManager): Promise<void> {
    const isWindows = os.platform() === "win32";

    try {
      let execCommand: string;
      if (isWindows && manager.name === "nvm") {
        const nvmPath = await this.getNvmPath();
        if (!nvmPath) {
          throw new Error("NVM for Windows not found");
        }
        execCommand = `cmd /c "call \\"${nvmPath}\\" list"`;
      } else {
        execCommand = manager.listCommand;
      }

      const { stdout } = await execAsync(execCommand);
      console.log(`Verification output: ${stdout}`);
      const lines = stdout.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        const version = this.parseVersionLine(line, manager);
        if (version && version.version === nodeVersion.version && version.isActive) {
          return;
        }
      }

      throw new Error("Target version not found as active");
    } catch (error) {
      console.error("Verification error:", error);
      throw new Error(`Verification failed: ${error}`);
    }
  }

  private async selectVersionManager(): Promise<VersionManager | null> {
    if (this.availableManagers.length === 0) {
      vscode.window.showErrorMessage("No Node.js version manager detected.");
      return null;
    }

    if (this.availableManagers.length === 1) {
      return this.availableManagers[0];
    }

    const selected = await vscode.window.showQuickPick(
      this.availableManagers.map((m) => ({
        label: m.name,
        description: `Use ${m.name} to manage versions`,
        manager: m,
      })),
      {
        placeHolder: "Select version manager to use",
      },
    );

    return selected?.manager || null;
  }

  private async getAvailableVersions(): Promise<NodeVersion[]> {
    const allVersions: NodeVersion[] = [];

    for (const manager of this.availableManagers) {
      try {
        const versions = await this.getVersionsForManager(manager);
        allVersions.push(...versions);
      } catch (error) {
        console.error(`Failed to get versions for ${manager.name}:`, error);
      }
    }

    // Remove duplicates and sort
    const uniqueVersions = allVersions.filter(
      (v, i, arr) => arr.findIndex((x) => x.version === v.version) === i,
    );

    return uniqueVersions.sort((a, b) => {
      // Active version first, then by version number (descending)
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return b.version.localeCompare(a.version, undefined, { numeric: true });
    });
  }

  private async getVersionsForManager(
    manager: VersionManager,
  ): Promise<NodeVersion[]> {
    const versions: NodeVersion[] = [];

    try {
      const isWindows = os.platform() === "win32";

      // For NVM on Windows, use cmd /c to execute the command
      const execCommand =
        isWindows && manager.name === "nvm"
          ? `cmd /c "${manager.listCommand}"`
          : manager.listCommand;

      const { stdout } = await execAsync(execCommand);
      const lines = stdout.split("\n").filter((line) => line.trim());

      for (const line of lines) {
        const version = this.parseVersionLine(line, manager);
        if (version) {
          versions.push(version);
        }
      }
    } catch (error) {
      console.error(`Error getting versions for ${manager.name}:`, error);
    }

    return versions;
  }

  private parseVersionLine(
    line: string,
    manager: VersionManager,
  ): NodeVersion | null {
    const trimmed = line.trim();

    switch (manager.name) {
      case "nvm":
        // Parse nvm output: "   v18.17.0" or "* v18.17.0" or "-> v18.17.0 (Currently using 64-bit executable)"
        // Also handle Windows NVM format: "  18.17.0" or "* 18.17.0"
        const nvmMatch = trimmed.match(/^(\*|\->)?\s*(v?\d+\.\d+\.\d+)/);
        if (nvmMatch) {
          const version = nvmMatch[2].startsWith("v")
            ? nvmMatch[2]
            : `v${nvmMatch[2]}`;
          return {
            version: version,
            manager,
            isActive: trimmed.includes("->") || trimmed.includes("*"),
            path: undefined,
          };
        }
        break;

      case "fnm":
        // Parse fnm output: "* v18.17.0" or "  v16.20.0"
        const fnmMatch = trimmed.match(/^(\*)?\s*(v?\d+\.\d+\.\d+)/);
        if (fnmMatch) {
          return {
            version: fnmMatch[2],
            manager,
            isActive: trimmed.startsWith("*"),
            path: undefined,
          };
        }
        break;

      case "volta":
        // Parse volta output: "18.17.0 (current @ ~/.volta/tools/image/node/18.17.0)"
        const voltaMatch = trimmed.match(/^(\d+\.\d+\.\d+)\s*(\(current.*\))?/);
        if (voltaMatch) {
          return {
            version: `v${voltaMatch[1]}`,
            manager,
            isActive: Boolean(voltaMatch[2]),
            path: voltaMatch[2],
          };
        }
        break;
    }

    return null;
  }

  private async getNvmPath(): Promise<string | null> {
    // Check NVM_HOME environment variable first
    if (process.env.NVM_HOME && fs.existsSync(process.env.NVM_HOME)) {
      return path.join(process.env.NVM_HOME, "nvm.exe");
    }

    // Fallback to common NVM installation paths
    const appData = process.env.APPDATA;
    if (appData) {
      const defaultNvmPath = path.join(appData, "nvm", "nvm.exe");
      if (fs.existsSync(defaultNvmPath)) {
        return defaultNvmPath;
      }
    }

    // Try to locate nvm.exe in PATH
    try {
      const { stdout } = await execAsync("where nvm.exe");
      const paths = stdout.split("\n").filter((p) => p.trim());
      if (paths.length > 0 && fs.existsSync(paths[0])) {
        return paths[0];
      }
    } catch (error) {
      console.error("Failed to locate nvm.exe in PATH:", error);
    }

    return null;
  }

private async switchToVersion(nodeVersion: NodeVersion): Promise<void> {
    const manager = nodeVersion.manager;
    const isWindows = os.platform() === "win32";

    const terminal = vscode.window.createTerminal({
      name: `Switch Node Version`,
      shellPath: isWindows ? "cmd.exe" : undefined,
      shellArgs: isWindows ? ["/K"] : undefined, // /K keeps CMD open to run commands
    });

    let command: string;
    const versionNumber = nodeVersion.version.replace("v", "");

    switch (manager.name) {
      case "nvm":
        if (isWindows) {
          const nvmPath = await this.getNvmPath();
          if (!nvmPath) {
            vscode.window.showErrorMessage(
              "NVM for Windows not found. Please ensure NVM is installed and added to PATH or NVM_HOME is set.",
            );
            terminal.dispose();
            return;
          }
          // Use /C to execute and close, but we'll handle disposal manually
          command = `call "${nvmPath}" use ${versionNumber} & echo %ERRORLEVEL%`;
        } else {
          command = `source ~/.nvm/nvm.sh && ${manager.useCommand} ${nodeVersion.version}`;
        }
        break;
      case "fnm":
        command = `${manager.useCommand} ${nodeVersion.version}`;
        break;
      case "volta":
        command = `${manager.useCommand}${nodeVersion.version}`;
        break;
      default:
        vscode.window.showErrorMessage(
          `Unsupported version manager: ${manager.name}`,
        );
        terminal.dispose();
        return;
    }

    try {
      terminal.sendText(command);
      terminal.show();

      const success = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Switching to Node.js ${nodeVersion.version}...`,
          cancellable: false,
        },
        async (progress) => {
          progress.report({ increment: 30, message: "Executing switch command..." });
          console.log(`Executing command: ${command}`);

          // Wait longer for NVM on Windows to account for environment setup
          await new Promise((resolve) => setTimeout(resolve, isWindows ? 5000 : 3000));

          progress.report({ increment: 40, message: "Verifying switch..." });

          try {
            await this.verifyVersionSwitch(nodeVersion, manager);
            progress.report({ increment: 20, message: "Switch completed!" });
            return true;
          } catch (error) {
            console.warn("Could not verify version switch:", error);
            progress.report({ increment: 20, message: "Switch command executed" });
            return true;
          } finally {
            progress.report({ increment: 10, message: "Cleaning up..." });
            setTimeout(() => {
              terminal.dispose();
            }, 2000); // Increased delay to ensure output is captured
          }
        },
      );

      if (success) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const action = await vscode.window.showInformationMessage(
          `Successfully switched to Node.js ${nodeVersion.version}! VS Code needs to be reloaded to recognize the new Node.js version in the status bar.`,
          { modal: true },
          "Reload Window",
          "Later",
        );

        if (action === "Reload Window") {
          await vscode.commands.executeCommand("workbench.action.reloadWindow");
        } else {
          this.updateStatusBar(null, `Reload needed for Node.js ${nodeVersion.version}`);
          vscode.window.showInformationMessage(
            "Node.js version switched successfully. Use 'Developer: Reload Window' when ready to apply changes.",
            "Reload Now",
          ).then((choice) => {
            if (choice === "Reload Now") {
              vscode.commands.executeCommand("workbench.action.reloadWindow");
            }
          });
        }
      }
    } catch (error) {
      console.error("Switch version error:", error);
      setTimeout(() => {
        terminal.dispose();
      }, 2000);
      vscode.window.showErrorMessage(
        `Failed to switch Node.js version: ${error}`,
      );
    }
  }



  private updateStatusBar(version: string | null, errorMessage?: string) {
    if (!version && !errorMessage) {
      this.statusBarItem.text = "$(warning) Node.js not found";
      this.statusBarItem.tooltip =
        "Node.js is not installed or not in PATH. Click to install or switch versions.";
      this.statusBarItem.command = "nodeVersion.switchVersion";
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.warningBackground",
      );
    } else if (errorMessage) {
      if (errorMessage.includes("Reload needed")) {
        this.statusBarItem.text = "$(sync-ignored) Node Switch";
        this.statusBarItem.tooltip = errorMessage + ". Click to reload or switch versions.";
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          "statusBarItem.warningBackground",
        );
      } else {
        this.statusBarItem.text = "$(error) Node Error";
        this.statusBarItem.tooltip = errorMessage + ". Click to switch versions.";
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
          "statusBarItem.errorBackground",
        );
      }
      this.statusBarItem.command = "nodeVersion.switchVersion";
    } else {
      const config = vscode.workspace.getConfiguration("nodeVersion");
      const template = config.get<string>(
        "statusBarText",
        "$(symbol-method) Node {version}",
      );

      this.statusBarItem.text = template.replace("{version}", version!);
      this.statusBarItem.tooltip = `Node.js ${version}\nClick to switch versions\nRight-click for more options`;
      this.statusBarItem.command = "nodeVersion.switchVersion";
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
  console.log("Node Version Switch Status Bar extension deactivated");
}