import * as vscode from 'vscode';
import { GeneralCommentsComment, VersionedCommentsComment } from "./Structure"

class Review implements vscode.Comment {
	label: string | undefined;
	constructor(review: VersionedCommentsComment | GeneralCommentsComment) {
        this.body = review.message;
        this.mode = vscode.CommentMode.Preview;
        this.author = {name: review.user.displayName, iconPath: vscode.Uri.parse(review.user.avatarUrl)};
        this.timestamp = new Date(review.createDate);
	}

    body: string | vscode.MarkdownString;
    mode: vscode.CommentMode;
    author: vscode.CommentAuthorInformation;
    contextValue?: string | undefined;
    reactions?: vscode.CommentReaction[] | undefined;
    timestamp?: Date | undefined;
}


export class CommentController implements vscode.CommentingRangeProvider {
    private controller: vscode.CommentController;
    private threads: vscode.CommentThread[] = [];

    constructor(context: vscode.ExtensionContext) {
	    this.controller = vscode.comments.createCommentController('crucible-comment', 'Comment review');
        context.subscriptions.push(this.controller);
        this.controller.commentingRangeProvider = this;

        context.subscriptions.push(vscode.commands.registerCommand('crucible.reply', (reply: vscode.CommentReply) => {
            console.log(reply);
        }));
    }

    provideCommentingRanges(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Range[]> {
        if (!document || document.uri.scheme !== "crucible") {
            return null;
        }
        const lineCount = document.lineCount;
		return [new vscode.Range(0, 0, lineCount - 1, 0)];
    }

    public createThread(uri: vscode.Uri, comments: VersionedCommentsComment[]) {
        comments.forEach(c => {
            if (this.threads.find(t => t.label === c.permaId.id)) {
                return;
            }
            var range: vscode.Range;
            if (!c.lineRanges) {
                range = new vscode.Range(0, 0, 0, 0);
            } else if (c.lineRanges[0].range.indexOf('-') !== -1) {
                const start: number = parseInt(c.lineRanges[0].range.split('-')[0]) - 1;
                const end: number = parseInt(c.lineRanges[0].range.split('-')[1]) - 1;
                range = new vscode.Range(start, 0, end, 0);
            } else {
                range = new vscode.Range(parseInt(c.lineRanges[0].range) - 1, 0, parseInt(c.lineRanges[0].range) - 1, 0);
            }
            var replies: Review[] = [new Review(c)];
            replies = replies.sort((a, b) => {
                return a.timestamp!.getMilliseconds() - b.timestamp!.getMilliseconds();
            });
            const flatreview = function(reply: GeneralCommentsComment) {
                replies.push(new Review(reply));
                reply.replies.forEach(flatreview);
            };
            c.replies.forEach(flatreview);
            const thread = this.controller.createCommentThread(uri, range, replies);
            thread.label = c.permaId.id;
            this.threads.push(thread);
        });
    }
};