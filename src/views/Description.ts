import { create } from "domain";
import { close } from "fs";
import * as vscode from "vscode";
import { ReviewData, Reviewer, ReviewItem } from "../crucible/Structure";
import { getUri } from "./utilities";

export class DescriptionPanel {
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private extensionUri: vscode.Uri;
    private reviewers: Promise<Reviewer[]>;
    private info: ReviewData;
    private items: ReviewItem[];
    constructor(extensionsUri: vscode.Uri, info: ReviewData, items: ReviewItem[], reviewers: Promise<Reviewer[]>) {
        this._panel = vscode.window.createWebviewPanel(info.permaId.id, info.permaId.id, vscode.ViewColumn.One, {
            enableScripts: true
        });
        this.info = info;
        this.reviewers = reviewers;
        this.items = items;
        this._panel.onDidDispose(this.dispose, null, this._disposables);
        this.extensionUri = extensionsUri;
        this._panel.webview.html = this._getWebviewContent();
        this.reviewers.then(reviewers => {
            this._panel.webview.postMessage({msg: "reviewers", data: reviewers, percents: this.calculatePercent()});
        });
    }

    public dispose() {
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private _getWebviewContent() {
        const toolkitUri = getUri(this._panel.webview, this.extensionUri, [
            "node_modules",
            "@vscode",
            "webview-ui-toolkit",
            "dist",
            "toolkit.js", // A toolkit.min.js file is also available
        ]);
        const scriptUri = getUri(this._panel.webview, this.extensionUri, ["src", "views", "js", "description.js"]);
        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script type="module" src="${toolkitUri}"></script>
              <script type="module" src="${scriptUri}"></script>
            </head>
            <body>
                <div class="grid-container">
                    <div class="grid-item">${this.getHeader()}</div>
                    <div class="grid-item">${this.getTags()}</div>
                    <div class="grid-item">${this.getAuthor()}</div>
                    <div class="grid-item">${this.getButtons()}</div>
                    <div class="grid-item">${this.getChangelistSelect()}</div>
                    <div class="grid-item"><vscode-divider></vscode-divider></div>
                    <div class="grid-item">
                        <vscode-data-grid id="reviewer-grid" aria-label="Basic"></vscode-data-grid>
                    </div>
                </div>
            </body>
          </html>
        `;
    }

    private getHeader() {
        return `<h1> ${this.info.name}</h1>`;
    }

    private getTags() {
        let state = "";
        if (this.info.state === "Review") {
            state = "Open";
        } else {
            state = this.info.state;
        }
        return `<vscode-badge style="margin:5px;">${this.info.permaId.id}</vscode-badge><vscode-badge style="margin:5px;">${state}</vscode-badge> ${this.getCreatedText()} | ${this.getDueText()}`;
    }

    private getAuthor() {
        return `<h3><div>Author: ${this.info.author.displayName}</div><div>Moderator: ${this.info.moderator.displayName}</div></h3>`;
    }

    private getButtons() {
        const closeButton = '<vscode-button style="margin:5px;" id="closeReviewButton">Close</vscode-button>';
        const abandonButton = '<vscode-button style="margin:5px;" id="abandonReviewButton">Abandon</vscode-button>';
        const reopenButton = '<vscode-button style="margin:5px;" id="reopenReviewButton">Reopen</vscode-button>';
        const recoverButton = '<vscode-button style="margin:5px;" id="recoverReviewButton">Recover</vscode-button>';
        let result = "";
        if (this.info.state === "Review") {
            result = closeButton + abandonButton;
        } else if (this.info.state === "Closed") {
            result = reopenButton;
        } else if (this.info.state === "Dead") {
            result = recoverButton;
        }
        return result;
    }

    private calculatePercent(): {} {
        var result: {[key:string]: number} = {};
        this.items.forEach(item => {
            item.participants.forEach(participant => {
                if (participant.completed) {
                    if (participant.user.userName in result) {
                    result[participant.user.userName] += 1;
                    } else {
                        result[participant.user.userName] = 0;
                    }
                }
            });
        });
        for (let key in result) {
            let value = result[key];
            result[key] = (value / this.items.length) * 100;
        }
        return result;
    }

    private getCreatedText() {
        const createTime = new Date(this.info.createDate);
        const delta = new Date(Date.now() - createTime.getTime());
        delta.setFullYear(delta.getFullYear() - 1970);
        if (delta.getFullYear() > 0) {
            return `${delta.getFullYear()} years ago`;
        } else if (delta.getMonth() > 0) {
            return `${delta.getMonth()} months ago`;
        } else if (delta.getDate() > 0) {
            return `${delta.getDate()} days ago`;
        } else if (delta.getHours() > 0) {
            return `${delta.getHours()} hours ago`;
        } else if (delta.getMinutes() > 0) {
            return `${delta.getMinutes()} minutes ago`;
        } else if (delta.getSeconds() > 0) {
            return `${delta.getSeconds()} seconds ago`;
        } else {
            return "???? ago";
        }

    }

    private getDueText() {
        if (!this.info.dueDate) {
            return "";
        }
        const dueDate = new Date(this.info.dueDate);
        const ms = Date.now() - dueDate.getTime();
        var text: string;
        var result: string;
        var delta: Date;
        if (ms < 0) {
            text = "due in";
            delta = new Date(ms);
        } else {
            text = "due";
            delta = new Date(-ms);
        }
        delta.setFullYear(delta.getFullYear() - 1970);
        if (delta.getFullYear() > 0) {
            result =  `${text} ${delta.getFullYear()} years`;
        } else if (delta.getMonth() > 0) {
            result =  `${text} ${delta.getMonth()} months`;
        } else if (delta.getDate() > 0) {
            result =  `${text} ${delta.getDate()} days`;
        } else if (delta.getHours() > 0) {
            result =  `${text} ${delta.getHours()} hours`;
        } else if (delta.getMinutes() > 0) {
            result =  `${text} ${delta.getMinutes()} minutes`;
        } else if (delta.getSeconds() > 0) {
            result =  `${text} ${delta.getSeconds()} seconds`;
        } else {
            return "???? ago";
        }

        if (ms > 0) {
            result += " ago";
        }
        return result;
    }

    private getChangelistSelect() {
        // let base: string[] = [];
        // this.items.forEach(item => {
        //     item.expandedRevisions.forEach(revision => {
        //         if (!base.find(rev => rev ===revision.revision)) {
        //             base.push(revision.revision);
        //         }
        //     });
        // });
        // function options() {
        //     let result = "";
        //     base.forEach(el => result += `<vscode-option>${el}</vscode-option>`);
        //     return result;
        // }
        // return `<div style="vertical-align: middle;">
        //     <label style="line-height:25px;">Base revision: </label>
        //     <vscode-dropdown id="base-changelist">${options()}</vscode-dropdown>
        //     <label>Revision: </label>
        //     <vscode-dropdown id="rev-changelist"></vscode-dropdown>
        // </div>`;
    }
}