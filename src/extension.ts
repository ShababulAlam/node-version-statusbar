import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";
import * as os from "os";
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
    });

    let installCommand: string;
    switch (manager.name) {
      case "nvm":
        installCommand = `nvm install ${version}`;
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

    terminal.sendText(installCommand);
    terminal.show();

    // Refresh after installation
    setTimeout(() => {
      this.refresh();
    }, 5000);
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

  private async switchToVersion(nodeVersion: NodeVersion): Promise<void> {
    const manager = nodeVersion.manager;
    const isWindows = os.platform() === "win32";

    let command: string;
    const versionNumber = nodeVersion.version.replace("v", ""); // Remove 'v' prefix for Windows NVM

    switch (manager.name) {
      case "nvm":
        if (isWindows) {
          // Windows NVM expects version without 'v' prefix
          command = `${manager.useCommand} ${versionNumber}`;
        } else {
          // Unix NVM can handle both formats
          command = `${manager.useCommand} ${nodeVersion.version}`;
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
        return;
    }

    try {
      // Execute the command directly and wait for completion
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Switching to Node.js ${nodeVersion.version}...`,
          cancellable: false,
        },
        async (progress) => {
          progress.report({
            increment: 25,
            message: "Executing switch command...",
          });

          try {
            // Execute the switch command directly
            const isWindows = os.platform() === "win32";
            const execCommand =
              isWindows && manager.name === "nvm"
                ? `cmd /c "${command}"`
                : command;

            await execAsync(execCommand);
            progress.report({ increment: 50, message: "Verifying switch..." });

            // Wait a moment for the environment to update
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Verify the switch was successful
            const currentVersion = await this.getNodeVersion();
            progress.report({ increment: 25, message: "Switch completed!" });

            if (
              currentVersion &&
              (currentVersion === nodeVersion.version ||
                currentVersion.replace("v", "") === versionNumber)
            ) {
              // Switch was successful, ask user about reload
              setTimeout(async () => {
                const reloadAction = "Reload VS Code";
                const skipAction = "Skip Reload";

                const action = await vscode.window.showInformationMessage(
                  `Successfully switched to Node.js ${nodeVersion.version}. Reload VS Code to apply changes everywhere.`,
                  { modal: false },
                  reloadAction,
                  skipAction,
                );

                if (action === reloadAction) {
                  await vscode.commands.executeCommand(
                    "workbench.action.reloadWindow",
                  );
                }
              }, 500);
            } else {
              // Switch might not be immediately effective, show terminal for manual verification
              const terminal = vscode.window.createTerminal({
                name: `Node Version Switch`,
                shellPath:
                  isWindows && manager.name === "nvm" ? "cmd.exe" : undefined,
              });

              terminal.sendText(command);
              terminal.sendText("node --version"); // Show current version
              terminal.show();

              vscode.window
                .showWarningMessage(
                  `Node.js version switch command executed. Please check the terminal and reload VS Code if needed.`,
                  "Reload VS Code",
                )
                .then((action) => {
                  if (action === "Reload VS Code") {
                    vscode.commands.executeCommand(
                      "workbench.action.reloadWindow",
                    );
                  }
                });
            }

            // Update our status bar
            await this.refresh();
          } catch (execError) {
            // If direct execution fails, fall back to terminal method
            console.log(
              "Direct execution failed, using terminal method:",
              execError,
            );

            const terminal = vscode.window.createTerminal({
              name: `Node Version Switch`,
              shellPath:
                isWindows && manager.name === "nvm" ? "cmd.exe" : undefined,
            });

            terminal.sendText(command);
            terminal.sendText("node --version"); // Show current version after switch
            terminal.show();

            // Wait for terminal command to complete
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // Update status bar
            await this.refresh();

            // Ask user to reload
            setTimeout(async () => {
              const action = await vscode.window.showInformationMessage(
                `Node.js version switch command sent to terminal. Reload VS Code to apply changes everywhere.`,
                "Reload VS Code",
                "Skip",
              );

              if (action === "Reload VS Code") {
                await vscode.commands.executeCommand(
                  "workbench.action.reloadWindow",
                );
              }
            }, 1000);
          }
        },
      );
    } catch (error) {
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
      this.statusBarItem.text = "$(error) Node Error";
      this.statusBarItem.tooltip = errorMessage + ". Click to switch versions.";
      this.statusBarItem.command = "nodeVersion.switchVersion";
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
