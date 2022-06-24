import * as vscode from 'vscode';

//Create output channel
let crucible = vscode.window.createOutputChannel("Crucible");

export function log(...restOfName: any[]) {
    crucible.appendLine(restOfName.join(" "));
}