// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { login } from './crucible/Authentication';
import { TO_REVIEW, OPENED_REVIEW, READY_TO_CLOSE, DRAFTS_REVIEW, OUT_FOR_REVIEW, COMPLETED_REVIEW, ABANDONED_REVIEW } from "./crucible/ApiPath";
import { ListReview, registerCommand } from "./views/ListReview";
import { CrucibleFileSystemProvider } from './crucible/FileSystemProvider';
import { CONFIGNAME } from './crucible/ConfigPath';
import { CommentDecorationProvider, FileDecorationProvider, ViewedDecorationProvider } from './crucible/FileDecoration';
import { CommentController } from './crucible/Comments';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
    await login();
    const fs = new CrucibleFileSystemProvider();
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider(CONFIGNAME, fs, { isCaseSensitive: true, isReadonly: true }));
    context.subscriptions.push(vscode.commands.registerCommand('crucible.login', async () => {
        await login();
    }));

    context.subscriptions.push(vscode.window.registerFileDecorationProvider(new FileDecorationProvider()));
    context.subscriptions.push(vscode.window.registerFileDecorationProvider(new CommentDecorationProvider()));
    registerCommand(context);
}

// this method is called when your extension is deactivated
export function deactivate() {}
