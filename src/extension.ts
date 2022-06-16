// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { login } from './crucible/Authentication';
import { TO_REVIEW, OPENED_REVIEW } from "./crucible/ApiPath";
import { ListReview } from "./views/ListReview";
import { CrucibleFileSystemProvider } from './crucible/FileSystemProvider';
import { CONFIGNAME } from './crucible/ConfigPath';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
    await login();
    const fs = new CrucibleFileSystemProvider();
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider(CONFIGNAME, fs, { isCaseSensitive: true, isReadonly: true }));
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('crucible.login', async () => {
        await login();
    });
    context.subscriptions.push(
        vscode.window.createTreeView("crucible.outcome", {
            treeDataProvider: new ListReview(OPENED_REVIEW),
        })
    );
    context.subscriptions.push(
        vscode.window.createTreeView("crucible.income", {
            treeDataProvider: new ListReview(TO_REVIEW),
        })
    );
    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
