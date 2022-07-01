import * as vscode from "vscode";
import { ABANDONED_REVIEW, CLOSED_REVIEW, COMPLETED_REVIEW, DRAFTS_REVIEW, OUT_FOR_REVIEW, READY_TO_CLOSE, TO_REVIEW, Transition } from "../crucible/ApiPath";
import { CommentController } from "../crucible/Comments";
import { CONFIGNAME, USERNAME, VIEWMODE } from '../crucible/ConfigPath';
import { FileStat, ViewedDecorationProvider } from "../crucible/FileDecoration";
import { log } from "../crucible/Log";
import { fileReaded } from "../crucible/Rest";
import { getListReviewers, getListReviews, getReview, getReviewItems } from "../crucible/Review";
import { RevisionSelectorManager } from "../crucible/RevisionSelectorManager";
import { ReviewData, ReviewDetail, Reviewer, ReviewItem, VersionedCommentsComment } from "../crucible/Structure";
import { DescriptionPanel } from "./Description";
import { Revisions } from "./Revisions";


interface TreeEntry
{
    item?: ReviewItem
    info?: ReviewDetail;
	type: vscode.FileType;
    name: string;
    childs: TreeEntry[];
    root: boolean;
};

interface Description
{
    description: string;
    info: ReviewDetail;
    items: ReviewItem[];
};

type Entry = ReviewData | TreeEntry | Description;
const revisionSelectorManager: RevisionSelectorManager = new RevisionSelectorManager();
var controller: CommentController;

var refreshView: { [id: string]: ListReview[]} = {};

function registerView(context: vscode.ExtensionContext) {

    const toReview = new ListReview(TO_REVIEW);
    vscode.commands.registerCommand('crucible.toreview.refresh', () => {
        toReview.refresh();
    });
    context.subscriptions.push(
        vscode.window.createTreeView("crucible.toreview", {
            treeDataProvider: toReview,
        })
    );

    const ready = new ListReview(READY_TO_CLOSE);
    vscode.commands.registerCommand('crucible.ready.refresh', () => {
        ready.refresh();
    });
    context.subscriptions.push(
        vscode.window.createTreeView("crucible.ready", {
            treeDataProvider: ready,
        })
    );
    const indraft = new ListReview(DRAFTS_REVIEW);
    vscode.commands.registerCommand('crucible.indraft.refresh', () => {
        indraft.refresh();
    });
    context.subscriptions.push(
        vscode.window.createTreeView("crucible.indraft", {
            treeDataProvider: indraft,
        })
    );

    const outForReview = new ListReview(OUT_FOR_REVIEW);
    vscode.commands.registerCommand('crucible.outforreview.refresh', () => {
        outForReview.refresh();
    });
    context.subscriptions.push(
        vscode.window.createTreeView("crucible.outforreview", {
            treeDataProvider: outForReview,
        })
    );
    const completed = new ListReview(COMPLETED_REVIEW);
    vscode.commands.registerCommand('crucible.completed.refresh', () => {
        completed.refresh();
    });
    context.subscriptions.push(
        vscode.window.createTreeView("crucible.completed", {
            treeDataProvider: completed,
        })
    );
    const closed = new ListReview(CLOSED_REVIEW);
    vscode.commands.registerCommand('crucible.closed.refresh', () => {
        closed.refresh();
    });
    context.subscriptions.push(
        vscode.window.createTreeView("crucible.closed", {
            treeDataProvider: closed,
        })
    );
    const abandoned = new ListReview(ABANDONED_REVIEW);
    vscode.commands.registerCommand('crucible.abandoned.refresh', () => {
        abandoned.refresh();
    });
    context.subscriptions.push(
        vscode.window.createTreeView("crucible.abandoned", {
            treeDataProvider: abandoned,
        })
    );

    refreshView["abandoned"] = [abandoned, outForReview];
    refreshView["close"] = [closed, outForReview];
    refreshView["complete"] = [completed, toReview];
    refreshView["reopen"] = [ready, closed];
    refreshView["recover"] = [indraft, abandoned];
}

export function refreshTreeView(tran: string) {
    refreshView[tran].forEach(view => view.refresh());
}

export function registerCommand(context: vscode.ExtensionContext) {
    registerView(context);
    controller = new CommentController(context);
    const viewedDecord = new ViewedDecorationProvider();
    context.subscriptions.push(vscode.window.registerFileDecorationProvider(viewedDecord));

    context.subscriptions.push(vscode.commands.registerCommand('crucible.opendescription', (info: ReviewDetail) => {
        context.subscriptions.push(new DescriptionPanel(context.extensionUri, info));
    }));
    const revisionsSelector = new Revisions(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(Revisions.viewType, revisionsSelector));

    context.subscriptions.push(vscode.commands.registerCommand('crucible.diff', (entry: ReviewDetail, item: ReviewItem) => {
        const revisions = revisionSelectorManager.getRevisions(entry, item);
        var title;
        if (item.commitType === 'Added') {
            title = `Added ${item.toPath}`;
        } else if (item.commitType === "Modified") {
            title = `${item.fromPath} ⟷ ${item.toPath}`;
        } else if (item.commitType === "Deleted" || item.commitType === "Moved") {
            title = `${item.commitType} ${item.toPath}`;
        } else {
            throw new Error('Method not implemented.');
        }
        const username = vscode.workspace.getConfiguration(CONFIGNAME).get<string>(USERNAME)!;
        for(const p of item.participants) {
            if (p.user.userName === username) {
                p.completed = true;
                break;
            }
        }
        const left = vscode.Uri.from({ scheme: CONFIGNAME, path: '/' + item.toPath, query: revisions.fromContentUrl });
        const right = vscode.Uri.from({ scheme: CONFIGNAME, path: '/' + item.toPath, query: revisions.toContentUrl });
        viewedDecord.fileRead([ vscode.Uri.from({scheme: CONFIGNAME, path: '/' + item.toPath, query: item.toContentUrl,
            fragment: JSON.stringify(getFileStat(entry, item))})]);
        vscode.commands.executeCommand("vscode.diff", left, right, title).then(() => {
                vscode.commands.executeCommand('setContext', 'crucible.diffopen', true).then(() => {
                    revisionsSelector.setData(entry, item, revisions.left, revisions.right);
                });
                fileReaded(entry.permaId.id, item.permId.id.split('-')[1]).catch(reason => {
                    log("Failed to send file read status:", reason);
                });
            });
        const createForOneSine = function(revision: string, uri: vscode.Uri) {
            const comments: VersionedCommentsComment[] = [];
            entry.versionedComments.comments.forEach(comment => {
                if (comment.reviewItemId.id !== item.permId.id) {
                    return;
                }
                if (comment.lineRanges) {
                    const rang = comment.lineRanges.find((value) => value.revision === revision);
                    if (!rang) {
                        return;
                    }
                    comment.lineRanges[0] = rang;
                }
                comments.push(comment);
            });
            controller.createThread(uri, comments);
        };
        createForOneSine(revisions.left, left);
        createForOneSine(revisions.right, right);
    }));

    revisionsSelector.onRevisionsSelected(event => {
        if (event.side === 'left') {
            revisionSelectorManager.setLeftRevision(event.id, event.revision);
        } else {
            revisionSelectorManager.setRightRevision(event.id, event.revision);
        }
    });

}

function getFileStat(info: ReviewDetail, item: ReviewItem): FileStat {
    const username = vscode.workspace.getConfiguration(CONFIGNAME).get<string>(USERNAME)!;
    var isComment: boolean = false;
    var rev: string | undefined;
    info.versionedComments.comments.forEach(comment => {
        // TODO: Check current revision selected
        if (comment.reviewItemId.id === item.permId.id) {
            isComment = true;
            rev = item.toRevision;
        }
    });
    var readed: boolean = false;
    for(const p of item.participants) {
        if (p.user.userName === username && p.completed) {
            readed = true;
            break;
        }
    }

    var stat: FileStat = {
        commitType: item.commitType,
        // TODO: Check if user in participant list
        viewed: readed,
        comments: isComment,
        revision: rev
    };
    return stat;
}

class ReviewMainItem extends vscode.TreeItem {
    data: ReviewData;
    constructor(item: ReviewData) {
            super(item.name, vscode.TreeItemCollapsibleState.Collapsed);
            this.data = item;
            this.description = `by @${item.author.displayName}`;
            this.id = item.permaId.id;
            this.tooltip = new vscode.MarkdownString(
`${item.description}

${this.description}
`);
        // HTTP is block
        this.iconPath = vscode.Uri.parse(item.author.avatarUrl);
    }
}

class RootTree extends vscode.TreeItem {
    constructor(entry: TreeEntry) {
        if (entry.root) {
            super(entry.name, vscode.TreeItemCollapsibleState.Collapsed);
            this.iconPath = new vscode.ThemeIcon("root-folder");
        } else {
            if (entry.type === vscode.FileType.Directory) {
                super(vscode.Uri.parse(entry.name), vscode.TreeItemCollapsibleState.Expanded);
                this.iconPath = new vscode.ThemeIcon("file-directory");
            } else {
                const uri = vscode.Uri.from({scheme: CONFIGNAME, path: '/' + entry.item!.toPath, query: entry.item!.toContentUrl,
                        fragment: JSON.stringify(getFileStat(entry.info!, entry.item!))});
                super(uri, vscode.TreeItemCollapsibleState.None);
                // TODO: File status ADD/MODIFY/DELETE
                this.iconPath = new vscode.ThemeIcon("file");
                // TODO: Fill title
                this.command = { command: 'crucible.diff', title: "Diff File", arguments: [entry.info, entry.item] };
            }

        }
    }
}

async function createMainEntry(entry: ReviewData): Promise<Entry[]> {
    const mode = vscode.workspace.getConfiguration(CONFIGNAME).get<string>(VIEWMODE);
    log("Create review items with mode: ", mode);

    return getReview(entry.permaId.id).then(detail => {
        const items = detail.reviewItems.reviewItem;
        revisionSelectorManager.set(entry, items);
        const result: Entry[] = [];
        const description: Description = {
            description: "Description",
            info: detail,
            items: items
        };
        result.push(description);
        if (mode !== 'Tree') {
            const root: TreeEntry = {
                name: entry.projectKey,
                childs: [],
                type: vscode.FileType.Directory,
                root: true
            };
            items.forEach(item => {
                createTree(detail, item, root);
            });
            result.push(root);
        } else { // Flat
            items.forEach(item => {
                const e: TreeEntry = {
                    name: item.toPath,
                    childs: [],
                    item: item,
                    info: detail,
                    root: false,
                    type: vscode.FileType.File
                };
            });
        }
        return result;
    });

}

function createTree(entry: ReviewDetail, item: ReviewItem, root: TreeEntry) {
    const paths = item.toPath.split('/');
    let parent = root;
    paths.forEach((p, index) => {
        var found = parent.childs.find(e => e.name === p);
        if (!found) {
            const e : TreeEntry = {
                name: p,
                childs: [],
                type: index !== paths.length - 1 ? vscode.FileType.Directory : vscode.FileType.File,
                root: false
            };
            if (e.type === vscode.FileType.File) {
                e.info = entry;
                e.item = item;
            }
            parent.childs.push(e);
            parent = e;
        } else {
            parent = found;
        }
    });
}

export class ListReview implements vscode.TreeDataProvider<Entry> {
    private _onDidChangeTreeData: vscode.EventEmitter<Entry | undefined | void> = new vscode.EventEmitter<Entry | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<Entry | undefined | void> = this._onDidChangeTreeData.event;

    apiPath: string;
    constructor(path: string) {
        this.apiPath = path;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Entry): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if ('projectKey' in element) {
            return new ReviewMainItem(element);
        } else if ('childs' in element) {
                return new RootTree(element);
        } else if ('description' in element) {
            const description =  new vscode.TreeItem(element.description);
            description.iconPath = new vscode.ThemeIcon('info');
            description.command = {command: "crucible.opendescription", title: element.description, arguments: [element.info]};
            return description;
        } else {
            throw new Error(`Unknow ${element}`);
        }
    }

    async getChildren(element?: Entry): Promise<Entry[]> {
        if (!element) {
            return getListReviews(this.apiPath, false);
        } else {
            if ('projectKey' in element) {
                return createMainEntry(element);
            } else if ('childs' in element) {
                return Promise.resolve(element.childs);
            }
            throw new Error(`Unknow ${element}`);
        }
    }
}
