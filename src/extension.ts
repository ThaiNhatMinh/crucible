// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { login } from './crucible/Authentication';
import { TO_REVIEW, OPENED_REVIEW } from "./crucible/ApiPath";
import { ListReview, registerCommand } from "./views/ListReview";
import { CrucibleFileSystemProvider } from './crucible/FileSystemProvider';
import { CONFIGNAME } from './crucible/ConfigPath';
import { FileDecorationProvider } from './crucible/FileDecoration';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
    await login();
    const fs = new CrucibleFileSystemProvider();
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider(CONFIGNAME, fs, { isCaseSensitive: true, isReadonly: true }));
    context.subscriptions.push(vscode.commands.registerCommand('crucible.login', async () => {
        await login();
    }));

    registerCommand(context);
    const outcomeReview = new ListReview(OPENED_REVIEW);
    const incomeReview = new ListReview(TO_REVIEW);
    vscode.commands.registerCommand('crucible.income.refresh', () => {
        incomeReview.refresh();
    });
    vscode.commands.registerCommand('crucible.outcome.refresh', () => {
        outcomeReview.refresh();
    });

    context.subscriptions.push(
        vscode.window.createTreeView("crucible.outcome", {
            treeDataProvider: outcomeReview,
        })
    );
    context.subscriptions.push(
        vscode.window.createTreeView("crucible.income", {
            treeDataProvider: incomeReview,
        })
    );

    context.subscriptions.push(vscode.window.registerFileDecorationProvider(new FileDecorationProvider()));
}

// this method is called when your extension is deactivated
export function deactivate() {}
