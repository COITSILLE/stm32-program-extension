const vscode = require('vscode');

class StatusBarManager {
    constructor() {
        this.disposables = [];
        this.isStm32Project = false;
        this.projectDetectionReady = false;
        this.projectDetectionPromise = null;

        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        
        this.statusBarItem.text = "$(zap) Program";
        this.statusBarItem.tooltip = "Download firmware to STM32 (Ctrl+Alt+F)";
        this.statusBarItem.command = 'STM32-Program-1-Click.program';
        
        // 先触发一次项目检测，后续走缓存，避免高频全局扫描
        this.refreshProjectType();

        // 监听活动编辑器变化
        this.disposables.push(vscode.window.onDidChangeActiveTextEditor(() => {
            this.updateVisibility();
        }));

        // 若新增 .ioc，立即标记为 STM32 项目
        this.disposables.push(vscode.workspace.onDidCreateFiles(e => {
            const hasIocCreate = e.files.some(file => file.fsPath.toLowerCase().endsWith('.ioc'));
            if (hasIocCreate) {
                this.isStm32Project = true;
                this.projectDetectionReady = true;
                this.updateVisibility();
            }
        }));

        // 若删除 .ioc，重新检测一次
        this.disposables.push(vscode.workspace.onDidDeleteFiles(e => {
            const hasIocDelete = e.files.some(file => file.fsPath.toLowerCase().endsWith('.ioc'));
            if (hasIocDelete) {
                this.projectDetectionReady = false;
                this.refreshProjectType();
            }
        }));

        this.disposables.push(vscode.workspace.onDidChangeWorkspaceFolders(() => {
            this.projectDetectionReady = false;
            this.refreshProjectType();
        }));

        // 当打开 C/C++ 文件或工作区包含 .ioc 文件时显示
        this.updateVisibility();
    }

    refreshProjectType() {
        if (this.projectDetectionReady || this.projectDetectionPromise) {
            return;
        }

        this.projectDetectionPromise = vscode.workspace
            .findFiles('**/*.ioc', '**/{.git,node_modules,build}/**', 1)
            .then(files => {
                this.isStm32Project = files.length > 0;
                this.projectDetectionReady = true;
                this.updateVisibility();
                this.projectDetectionPromise = null;
            }, () => {
                this.projectDetectionPromise = null;
            })
            ;
    }

    updateVisibility() {
        const editor = vscode.window.activeTextEditor;
        const isCppEditor = editor && (editor.document.languageId === 'c' || editor.document.languageId === 'cpp');

        if (editor && (editor.document.languageId === 'c' || editor.document.languageId === 'cpp')) {
            this.statusBarItem.show();
        } else {
            if (!this.projectDetectionReady) {
                this.refreshProjectType();
            }

            if (isCppEditor || this.isStm32Project) {
                this.statusBarItem.show();
            } else {
                this.statusBarItem.hide();
            }
        }
    }

    dispose() {
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
        this.statusBarItem.dispose();
    }
}

module.exports = { StatusBarManager };