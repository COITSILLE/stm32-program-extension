const vscode = require('vscode');
const { ProgramProvider } = require('./src/programProvider.js');
const { StatusBarManager } = require('./src/statusBar');
const { PathDetector } = require('./src/pathDetector');

let programProvider;
let statusBarManager;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('STM32 One-Click Program activated');

    // 初始化核心类
    const pathDetector = new PathDetector();
    programProvider = new ProgramProvider(pathDetector);
    statusBarManager = new StatusBarManager();

    // 注册命令
    let disposableProgram = vscode.commands.registerCommand('STM32-Program-1-Click.program', async () => {
        await programProvider.program(false); // 不构建，直接烧录
    });

    let disposableProgramBuild = vscode.commands.registerCommand('STM32-Program-1-Click.programWithBuild', async () => {
        await programProvider.program(true); // 先构建再烧录
    });

    let disposableSelectPath = vscode.commands.registerCommand('STM32-Program-1-Click.selectProgrammerPath', async () => {
        await pathDetector.manualSelectPath();
    });

    let disposableToggleReset = vscode.commands.registerCommand('STM32-Program-1-Click.toggleResetAfterProgram', async () => {
        await programProvider.toggleResetAfterProgram();
    });

    // 监听配置变化
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('STM32-Program-1-Click')) {
                programProvider.refreshConfig();
            }
        })
    );

    context.subscriptions.push(
        disposableProgram,
        disposableProgramBuild,
        disposableSelectPath,
        disposableToggleReset,
        statusBarManager
    );
}

function deactivate() {
    statusBarManager?.dispose();
}

module.exports = {
    activate,
    deactivate
};