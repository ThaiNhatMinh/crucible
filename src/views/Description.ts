import * as vscode from "vscode";
import { REVIEWERS, REVIEW_INFORMATION, REVIEW_ITEMS, Transition } from "../crucible/ApiPath";
import { CONFIGNAME, USERNAME } from "../crucible/ConfigPath";
import { get, postComment, transition, avatarUrl, getGeneralComment } from "../crucible/Rest";
import { GeneralCommentsComment, ReviewData, ReviewDetail, Reviewer, Reviewers, ReviewItem, ReviewItems } from "../crucible/Structure";
import { refreshTreeView } from "./ListReview";
import { getUri } from "./utilities";

export class DescriptionPanel {
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private extensionUri: vscode.Uri;
    private reviewers: Reviewer[] = [];
    private info: ReviewData;
    private items: ReviewItem[] = [];
    private generalComments: GeneralCommentsComment[];
    private username: string;
    constructor(extensionsUri: vscode.Uri, info: ReviewDetail) {
        this._panel = vscode.window.createWebviewPanel(info.permaId.id, info.permaId.id, vscode.ViewColumn.One, {
            enableScripts: true
        });

        this.username = vscode.workspace.getConfiguration(CONFIGNAME).get<string>(USERNAME)!;
        this.info = info;
        this.generalComments = info.generalComments.comments;
        this._panel.onDidDispose(this.dispose, this, this._disposables);
        this.extensionUri = extensionsUri;
        this._panel.webview.html = this._getWebviewContent();
        Promise.all([
            get<Reviewers>(REVIEW_INFORMATION, info.permaId.id, REVIEWERS),
            get<ReviewItems>(REVIEW_INFORMATION, info.permaId.id, REVIEW_ITEMS),
            getGeneralComment(info.permaId.id, true)
        ]).then(result => {
            this.reviewers = result[0].reviewer;
            this.items = result[1].reviewItem;
            this.generalComments = result[2].comments;
            this._panel.webview.html = this._getWebviewContent();
            this._panel.webview.postMessage({msg: "reviewers", data: this.reviewers, percents: this.calculatePercent()});
        });

        this._panel.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
                case 'transition':
                    const trans: keyof typeof Transition = message.transition;
                    transition(info.permaId.id, Transition[trans], false).then(res => {
                        this.info = res;
                        this._panel.webview.html = this._getWebviewContent();
                        this._panel.webview.postMessage({msg: "reviewers", data: this.reviewers, percents: this.calculatePercent()});
                        refreshTreeView(trans);
                    });
                    break;
                case 'msg':
                    if (message.type === "error") {
                        vscode.window.showErrorMessage(message.message);
                    } else {
                        vscode.window.showInformationMessage(message.message);
                    }
                    break;
                case 'generalcomment':
                    this.submitGeneralMessage(message.message, message.isdraft, message.parentid);
                }
        });
    }

    submitGeneralMessage(message: string, isdraft: boolean, parentid?: string) {
        postComment(this.info.permaId.id, message, isdraft, parentid).then(comment => {
            this.updateComment(comment);
            this._panel.webview.html = this._getWebviewContent();
            this._panel.webview.postMessage({msg: "reviewers", data: this.reviewers, percents: this.calculatePercent()});
        });
    }

    updateComment(comment: GeneralCommentsComment) {
        const update = function(parent: GeneralCommentsComment, comment: GeneralCommentsComment) {
            if (parent.permaId.id === comment.parentCommentId.id) {
                parent.replies.push(comment);
            } else {
                parent.replies.forEach(reply => update(reply, comment));
            }
        };
        this.generalComments.forEach(c => {
            update(c, comment);
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
        const styleUri = getUri(this._panel.webview, this.extensionUri, ["src", "views", "css", "comments.css"]);
        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script type="module" src="${toolkitUri}"></script>
              <script type="module" src="${scriptUri}"></script>
              <link rel="stylesheet" href="${styleUri}">
            </head>
            <body>
                <div class="grid-container">
                    <div class="grid-item">${this.getHeader()}</div>
                    <div class="grid-item">${this.getTags()}</div>
                    <div class="grid-item">${this.getAuthor()}</div>
                    <div class="grid-item">${this.getButtons()}</div>
                    <div class="grid-item"><vscode-divider></vscode-divider></div>
                    <div class="grid-item">
                        <vscode-data-grid id="reviewer-grid" aria-label="Basic"></vscode-data-grid>
                    </div>
                    <div class="grid-item"><vscode-divider></vscode-divider></div>
                    <div class="grid-item"><h2>Objectives</h2></div>
                    <div class="grid-item">${this.getObjectives()}</div>
                    <div class="grid-item"><vscode-divider></vscode-divider></div>
                    <div class="grid-item"><h2>General Comments</h2></div>
                    <div class="grid-item">
                        <div id="general-comments-container" class="comment-list">
                            ${this.getUserComment()}
                            <div id="commentplaceholder" class="comment-form-placeholder comment-container">
                                <form class="comment aui" accept-charset="UTF-8" action="">
                                    <p class="userlogo">
                                        <span class="aui-avatar aui-avatar-32">
                                            <span class="aui-avatar-inner">
                                                <img src="${avatarUrl(this.username)}">
                                            </span>
                                        </span>
                                    </p>
                                    <div class="comment-body">
                                        <vscode-text-area cols="300" rows="3" placeholder="What do you want to say?">
                                        </vscode-text-area>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="replyform" class="commentForm" style="display: none;">
                    <form id="replyCommentForm" name="replyCommentForm" class="comment aui" accept-charset="UTF-8" action="javascript:completeAndRedirect()">
                        <p class="userlogo">
                            <span class="aui-avatar aui-avatar-32">
                                <span class="aui-avatar-inner">
                                    <img src="${avatarUrl(this.username)}">
                                </span>
                            </span>
                        </p>
                        <div class="comment-body">
                            <vscode-text-area id="inputComment" name="comments" cols="300" rows="6" class="commentTextarea"></vscode-text-area>
                            <div class="comment-toolbar-holder aui">
                                <div class="buttons">
                                    <vscode-button id="submitComment" type="button" value="publish">Comment</vscode-button>
                                    <vscode-button id="saveDraftComment" name="saveAsDraft" type="button" value="Save">Save as draft</vscode-button>
                                    <vscode-button id="cancelBtn" name="cancelComment" tabindex="0" appearance="secondary">Cancel</vscode-button>
                                    <vscode-button name="discardComment" style="display:none;" tabindex="0" appearance="secondary">Discard</a>
                                </div>
                            </div>
                        </div>
                        <input type="hidden" name="replyToId" value="">
                        <input type="hidden" name="commentId" value="">
                        <div class="ui-block"></div>
                    </form>
                </div>
            </body>
          </html>
        `;
    }

    getUserComment() {
        if (!this.generalComments || this.generalComments.length === 0) {
            return "";
        }

        let result: string = "";
        this.generalComments.forEach(comment => {
            result += this.getUserComments(comment) + "\n";
        });
        return result;
    }

    getObjectives() {
        if (this.info.description.length ===  0) {
            return "<i>No objectives entered. Objectives let your reviewers know what the goals of the review are and guide their feedback.</i>";
        }
        return `<div>${this.info.description}</div>`;
    }

    private getHeader() {
        return `<h1>${this.info.name}</h1>`;
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
        const startReviewButton = '<vscode-button style="margin:5px;" id="startReviewButton">Start Review</vscode-button>';
        const uncompleteReviewButton = '<vscode-button style="margin:5px;" id="uncompleteReviewButton">Uncomplete</vscode-button>';
        const closeButton = '<vscode-button style="margin:5px;" id="closeReviewButton">Close</vscode-button>';
        const abandonButton = '<vscode-button style="margin:5px;" id="abandonReviewButton">Abandon</vscode-button>';
        const reopenButton = '<vscode-button style="margin:5px;" id="reopenReviewButton">Reopen</vscode-button>';
        const recoverButton = '<vscode-button style="margin:5px;" id="recoverReviewButton">Recover</vscode-button>';
        const completeButton = '<vscode-button style="margin:5px;" id="completeReviewButton">Complete</vscode-button>';
        let result = `<vscode-button style="margin:5px;" id="">${this.info.state}</vscode-button>`;
        if (this.info.state === "Review") {
            if (this.username === this.info.author.userName) {
                result = closeButton + abandonButton;
            } else {
                result = closeButton + completeButton;
            }
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

    private getUserComments(comment: GeneralCommentsComment) {
        var childs: string = "";
        if (comment.replies && comment.replies.length > 0) {
            comment.replies.forEach(reply => {
                childs += this.getUserComments(reply) + "\n";
            });
        }

        return `<div id="" class="comment-container">
        <div id="" class="comment read current_comment" title="">
            <p class="userlogo">
                <span class="aui-avatar aui-avatar-32">
                    <span class="aui-avatar-inner">
                        <img src="${comment.user.avatarUrl}">
                    </span>
                </span>
            </p>
            <div class="comment-extra"></div>
            <h4 class="author">
                <a class="user  userorcommitter-parent" title=""><span>${comment.user.displayName}</span></a>
            </h4>
            <span class="excerpt"><span class="reply-count" title="click to show"></span></span>
            <div class="comment-body">
                <div class="comment-content markup">
                    ${comment.messageAsHtml}
                </div>
                <div class="comment-actions">
                    <ul class="comment-actions-secondary"></ul>
                    <div class="comment-actions-primary">
                        <ul class="comment-actions-inner">
                            <li>
                                <a class="commentButton replyToComment" id="reply_${comment.permId.id}">Reply</a>
                            </li>
                            <li>
                                <a class="commentButton toggleCommentRead">
                                    <span class="leaveUnread">Leave unread</span>
                                    <span class="markAsRead">Mark as read</span>
                                    <span class="markAsUnread">Mark as unread</span>
                                </a>
                            </li>
                            <li>
                                <span id="">
                                    <a class="starrable star-off  throbEnabled"><span class="inputs" style="display: none">
                                        <input class="starKey" type="hidden" name="itemType" value="atlassian-comment">
                                        <input class="starKey" type="hidden" name="intKey1" value="110499">
                                        <input type="hidden" class="star-textAdd" value="Add to favourites">
                                        <input type="hidden" class="star-textRemove" value="Remove from favourites">
                                </span>
                                <span class="starText">Add to favourites</span>
                                    </a>
                                </span>
                            </li>
                            <li class="comment-web-panel"></li>
                            <li>
                                <a>
                                    <span title="${comment.createDate}">${comment.createDate}</span>
                                </a>
                            </li>
                            <li class="note-frag"></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <div id="generalcommentEdit_${comment.permId.id}" class="comment-edit-form" style="display: none"></div>
        <div id="generalreplyFormDiv_${comment.permId.id}" class="replyCommentForm" style="display: none;">

        </div>
        <!--Replys-->
        <div id="generalreplys_${comment.permId.id}" class="reply-container">
            ${childs}
        </div>
        </div>`;
    }

}