import * as vscode from "vscode";
import { CONFIGNAME, VIEWMODE } from '../crucible/ConfigPath';
import { FileStat } from "../crucible/FileDecoration";
import { getListReviewers, getListReviews, getReviewItems } from "../crucible/Review";
import { ReviewData, Reviewer, ReviewItem } from "../crucible/Structure";
import { DescriptionPanel } from "./Description";
import { Revisions } from "./Revisions";


interface TreeEntry
{
    item?: ReviewItem
    info?: ReviewData;
	type: vscode.FileType;
    name: string;
    childs: TreeEntry[];
    root: boolean;
};

interface Description
{
    description: string;
    info: ReviewData;
    items: ReviewItem[];
};

type Entry = ReviewData | TreeEntry | Description;

export function registerCommand(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('crucible.opendescription', (info: ReviewData, items: ReviewItem[], reviewers: Promise<Reviewer[]>) => {
        context.subscriptions.push(new DescriptionPanel(context.extensionUri, info, items, reviewers));
    }));
    const revisionsSelector = new Revisions(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(Revisions.viewType, revisionsSelector));

    context.subscriptions.push(vscode.commands.registerCommand('crucible.diff', (entry: ReviewData, item: ReviewItem) => {
        revisionsSelector.setData(entry, item);
        var title;
        if (item.commitType === "Added") {
            title = `Added ${item.toPath}`;
        } else if (item.commitType === "Modified") {
            title = `${item.fromPath} ⟷ ${item.toPath}`
        } else if (item.commitType === "Deleted" || item.commitType === "Moved") {
            title = `${item.commitType} ${item.toPath}`;
        } else {

        }
        vscode.commands.executeCommand("vscode.diff",
            vscode.Uri.from({ scheme: CONFIGNAME, path: '/' + item.toPath, query: item.fromContentUrl }),
            vscode.Uri.from({ scheme: CONFIGNAME, path: '/' + item.toPath, query: item.toContentUrl }),
            title);
    }));
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
                super(vscode.Uri.parse(entry.name), vscode.TreeItemCollapsibleState.Collapsed);
                this.iconPath = new vscode.ThemeIcon("file-directory");
            } else {
                var stat: FileStat = {
                    commitType: entry.item?.commitType!,
                    // TODO: Check if user in participant list
                    viewed: false
                };
                const uri = vscode.Uri.from({scheme: CONFIGNAME, path: '/' + entry.item!.toPath, query: entry.item!.toContentUrl, fragment: JSON.stringify(stat)});
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
    return getReviewItems(entry.permaId.id, true).then(items => {
        const result: Entry[] = [];
        const description: Description = {
            description: "Description",
            info: entry,
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
                createTree(entry, item, root);
            });
            result.push(root);
        } else { // Flat
            items.forEach(item => {
                const e: TreeEntry = {
                    name: item.toPath,
                    childs: [],
                    item: item,
                    info: entry,
                    // toUri: vscode.Uri.from({scheme: CONFIGNAME, path: '/' + item.toPath, query: item.toContentUrl}),
                    // fromUri: vscode.Uri.from({scheme: CONFIGNAME, path: '/' + item.fromPath, query: item.fromContentUrl}),
                    root: false,
                    type: vscode.FileType.File
                };
                result.push(e);
            });
        }
        return result;
    });

}

function createTree(entry: ReviewData, item: ReviewItem, root: TreeEntry) {
    const paths = item.toPath.split('/');
    let parent = root;
    paths.forEach((p, index) => {
        var found = parent.childs.find(e => e.name === p);
        if (!found) {
            const e : TreeEntry = {
                name: p,
                childs: [],
                // toUri: vscode.Uri.from({scheme: CONFIGNAME, path: '/' + paths.slice(0, index + 1).join('/'), query: item.toContentUrl}),
                // fromUri: vscode.Uri.from({scheme: CONFIGNAME, path: '/' + paths.slice(0, index + 1).join('/'), query: item.fromContentUrl}),
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
            description.command = {command: "crucible.opendescription", title: element.description, arguments: [element.info, element.items, getListReviewers(element.info.permaId.id)]};
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
