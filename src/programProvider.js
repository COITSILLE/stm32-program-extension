const vscode = require('vscode');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class ProgramProvider {
    constructor(pathDetector) {
        this.pathDetector = pathDetector;
        this.config = vscode.workspace.getConfiguration('STM32-Program-1-Click');
        this.outputChannel = vscode.window.createOutputChannel('STM32 Programmer');
    }

    refreshConfig() {
        this.config = vscode.workspace.getConfiguration('STM32-Program-1-Click');
    }

    async toggleResetAfterProgram() {
        const current = this.config.get('resetAfterProgram', true);
        const next = !current;
        await this.config.update('resetAfterProgram', next, true);
        this.refreshConfig();
        vscode.window.showInformationMessage(`Reset after program: ${next ? 'ON' : 'OFF'}`);
    }

    async program(shouldBuild = false) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('Workspace is not open.');
            return;
        }

        const workspaceRoot = workspaceFolders[0].uri.fsPath;

        try {
            if (shouldBuild) {
                await this.runBuildTask();
            }

            const binaryPath = await this.findBinaryFile(workspaceRoot);
            if (!binaryPath) {
                throw new Error('.hex or .elf not found. Build the project first or check the build output directory.');
            }

            let programmerPath = this.config.get('programmerPath');
            if (!programmerPath) {
                programmerPath = await this.pathDetector.detect();
                if (!programmerPath) {
                    const action = await vscode.window.showErrorMessage(
                        'STM32CubeProgrammer not found. Please select the path manually or install it.',
                        'Manual Selection',
                        'Download Installation'
                    );
                    if (action === 'Manual Selection') {
                        programmerPath = await this.pathDetector.manualSelectPath();
                    } else if (action === 'Download Installation') {
                        vscode.env.openExternal(vscode.Uri.parse(
                            'https://www.st.com/en/development-tools/stm32cubeprog.html'
                        ));
                        return;
                    }
                }
            }

            await this.executeProgram(programmerPath, binaryPath);
        } catch (error) {
            vscode.window.showErrorMessage(`Program failed: ${error.message}`);
            console.error(error);
        }
    }

    async runBuildTask() {
        await this.ensureCMakeToolsReady();

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'STM32 Build & Program',
            cancellable: false
        }, async (progress) => {
            progress.report({ message: 'Configuring project with CMake Tools...' });
            this.outputChannel.appendLine('[Build] Running: cmake.configure');
            try {
                await vscode.commands.executeCommand('cmake.configure');
            } catch (error) {
                throw new Error(`CMake configure failed: ${error.message || error}`);
            }

            progress.report({ message: 'Building project with CMake Tools...' });
            this.outputChannel.appendLine('[Build] Running: cmake.build');
            try {
                await vscode.commands.executeCommand('cmake.build');
            } catch (error) {
                throw new Error(`CMake build failed: ${error.message || error}`);
            }
        });
    }

    async ensureCMakeToolsReady() {
        const cmakeExtId = 'ms-vscode.cmake-tools';
        const cmakeExtension = vscode.extensions.getExtension(cmakeExtId);

        if (!cmakeExtension) {
            const action = await vscode.window.showErrorMessage(
                'Build & Program requires the CMake Tools extension (ms-vscode.cmake-tools).',
                'Open Marketplace'
            );

            if (action === 'Open Marketplace') {
                await vscode.env.openExternal(vscode.Uri.parse(
                    'https://marketplace.visualstudio.com/items?itemName=ms-vscode.cmake-tools'
                ));
            }

            throw new Error('CMake Tools extension is not installed.');
        }

        if (!cmakeExtension.isActive) {
            await cmakeExtension.activate();
        }

        const commands = await vscode.commands.getCommands(true);
        if (commands.indexOf('cmake.configure') === -1 || commands.indexOf('cmake.build') === -1) {
            throw new Error('CMake Tools commands are unavailable. Please reload VS Code and try again.');
        }

        const cmakeLists = await vscode.workspace.findFiles('**/CMakeLists.txt', '**/{build,node_modules}/**', 1);
        if (!cmakeLists.length) {
            throw new Error('No CMakeLists.txt found in workspace. Build & Program requires a CMake project.');
        }
    }

    async findBinaryFile(workspaceRoot) {
        const workspaceName = path.basename(workspaceRoot);
        const preferredFiles = [
            path.join(workspaceRoot, 'build', 'Debug', `${workspaceName}.elf`),
            path.join(workspaceRoot, 'build', 'Debug', `${workspaceName}.hex`),
            path.join(workspaceRoot, 'build', 'Release', `${workspaceName}.elf`),
            path.join(workspaceRoot, 'build', 'Release', `${workspaceName}.hex`),
            path.join(workspaceRoot, 'build', `${workspaceName}.elf`),
            path.join(workspaceRoot, 'build', `${workspaceName}.hex`),
        ];

        for (const filePath of preferredFiles) {
            if (fs.existsSync(filePath)) {
                return filePath;
            }
        }

        const allBinaries = await vscode.workspace.findFiles('**/*.{elf,hex}', '**/node_modules/**');
        if (!allBinaries.length) {
            return null;
        }

        const ranked = allBinaries
            .map(uri => uri.fsPath)
            .sort((a, b) => {
                const score = p => {
                    const lower = p.toLowerCase();
                    let s = 0;
                    if (lower.includes(`${path.sep}build${path.sep}`)) s += 3;
                    if (lower.includes(`${path.sep}debug${path.sep}`)) s += 2;
                    if (lower.endsWith('.elf')) s += 1;
                    return s;
                };
                return score(b) - score(a);
            });

        return ranked[0] || null;
    }

    async executeProgram(programmerPath, binaryPath) {
        const interfaceType = this.config.get('interface', 'SWD');
        const resetAfter = this.config.get('resetAfterProgram', true);

        const args = [
            '-c', `port=${interfaceType}`,
            '-w', binaryPath,
            '-v'
        ];

        if (resetAfter) {
            args.push('-rst');
        }

        const commandPreview = `${programmerPath} ${args.map(a => a.includes(' ') ? `"${a}"` : a).join(' ')}`;
        this.outputChannel.clear();
        this.outputChannel.appendLine(`[Command] ${commandPreview}`);
        this.outputChannel.show(true);

        return new Promise((resolve, reject) => {
            const child = spawn(programmerPath, args, {
                shell: false,
                windowsHide: true,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            let combinedOutput = '';

            child.stdout.on('data', data => {
                const text = data.toString();
                combinedOutput += text;
                this.outputChannel.append(text);
            });

            child.stderr.on('data', data => {
                const text = data.toString();
                combinedOutput += text;
                this.outputChannel.append(text);
            });

            child.on('error', error => {
                reject(new Error(`Unable to start STM32_Programmer_CLI: ${error.message}`));
            });

            child.on('close', code => {
                if (code === 0) {
                    const verified = combinedOutput.includes('Download verified successfully');
                    if (verified) {
                        vscode.window.showInformationMessage('STM32 program completed and verified.');
                    } else {
                        vscode.window.showWarningMessage('STM32 program command exited 0, but verification text was not found. Check output.');
                    }
                    resolve();
                    return;
                }

                reject(new Error(`STM32_Programmer_CLI exited with code ${code}. Check output channel for details.`));
            });
        });
    }
}

module.exports = { ProgramProvider };
