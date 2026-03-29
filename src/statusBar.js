const vscode = require('vscode');

class StatusBarManager {
    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        
        this.statusBarItem.text = "$(zap) Program";
        this.statusBarItem.tooltip = "Download firmware to STM32 (Ctrl+Alt+F)";
        this.statusBarItem.command = 'STM32Program1Click.program';
        
        // 当打开 C/C++ 文件或工作区包含 .ioc 文件时显示
        this.updateVisibility();
        
        // 监听活动编辑器变化
        vscode.window.onDidChangeActiveTextEditor(() => {
            this.updateVisibility();
        });
    }

    updateVisibility() {
        const editor = vscode.window.activeTextEditor;
        const hasIoC = vscode.workspace.findFiles('**/*.ioc', null, 1).then(files => files.length > 0);
        
        if (editor && (editor.document.languageId === 'c' || editor.document.languageId === 'cpp')) {
            this.statusBarItem.show();
        } else {
            // 检查是否是 STM32 项目
            hasIoC.then(isStm32 => {
                if (isStm32) {
                    this.statusBarItem.show();
                } else {
                    this.statusBarItem.hide();
                }
            });
        }
    }

    dispose() {
        this.statusBarItem.dispose();
    }
}

module.exports = { StatusBarManager };