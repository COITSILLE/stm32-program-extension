const vscode = require('vscode');
const fs = require('fs');

class PathDetector {
    constructor() {
        this.defaultPaths = [
            'C:\\Program Files\\STMicroelectronics\\STM32Cube\\STM32CubeProgrammer\\bin\\STM32_Programmer_CLI.exe',
            'C:\\Program Files (x86)\\STMicroelectronics\\STM32Cube\\STM32CubeProgrammer\\bin\\STM32_Programmer_CLI.exe',
        ];
    }

    async detect() {
        if (process.platform !== 'win32') {
            return null;
        }

        // 1. 检查配置
        const config = vscode.workspace.getConfiguration('STM32-Program-1-Click');
        const configuredPath = config.get('programmerPath');
        if (configuredPath && fs.existsSync(configuredPath)) {
            return configuredPath;
        }

        // 2. 检查默认路径
        for (const p of this.defaultPaths) {
            if (fs.existsSync(p)) {
                // 自动保存到配置
                await config.update('programmerPath', p, true);
                return p;
            }
        }

        // 3. 检查 PATH 环境变量
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            const { stdout } = await execAsync('where STM32_Programmer_CLI.exe');
            if (stdout) {
                const pathInPath = stdout.trim().split('\n')[0];
                if (fs.existsSync(pathInPath)) {
                    await config.update('programmerPath', pathInPath, true);
                    return pathInPath;
                }
            }
        } catch (e) {
            // 不在 PATH 中
        }

        return null;
    }

    async manualSelectPath() {
        const result = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'Executable': ['exe'],
                'All Files': ['*']
            },
            title: 'Choose STM32_Programmer_CLI Executable'
        });

        if (result && result[0]) {
            const selectedPath = result[0].fsPath;
            const config = vscode.workspace.getConfiguration('STM32-Program-1-Click');
            await config.update('programmerPath', selectedPath, true);
            vscode.window.showInformationMessage(`Path set to: ${selectedPath}`);
            return selectedPath;
        }
        return null;
    }
}

module.exports = { PathDetector };