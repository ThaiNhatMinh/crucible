import * as vscode from "vscode";
import { CONFIGNAME, VIEWMODE } from '../crucible/ConfigPath';
import { getListReviews, getReviewItems } from "../crucible/Review";
import { ReviewData } from "../crucible/Structure";

interface TreeEntry
{
	uri: vscode.Uri;
	type: vscode.FileType;
    name: string;
    childs: TreeEntry[];
    root: boolean;
};

interface Description
{
    description: string;
};
type Entry = ReviewData | TreeEntry | Description;

class ReviewMainItem extends vscode.TreeItem {
    constructor(item: ReviewData) {
            super(item.name, vscode.TreeItemCollapsibleState.Collapsed);
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
        if (entry.root)
        {
            super(entry.name, vscode.TreeItemCollapsibleState.Collapsed);
            this.iconPath = new vscode.ThemeIcon("root-folder");
        } else {
            super(entry.uri, entry.type === vscode.FileType.Directory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
            if (entry.type === vscode.FileType.Directory) {
                this.iconPath = new vscode.ThemeIcon("file-directory");
            } else {
                this.iconPath = new vscode.ThemeIcon("file");
                this.command = { command: 'vscode.open', title: "Open File", arguments: [entry.uri], };
            }

        }
        this.id = entry.name;
    }
}

async function createMainEntry(entry: ReviewData): Promise<Entry[]> {
    const items = await getReviewItems(entry.permaId.id, true);
    const mode = vscode.workspace.getConfiguration(CONFIGNAME).get<string>(VIEWMODE);
    const result: Entry[] = [];
    const description: Description = {
        description: "Description"
    };
    result.push(description);

    if (mode === 'Tree') {
        const root: TreeEntry = {
            name: entry.projectKey,
            childs: [],
            uri: vscode.Uri.file(entry.projectKey),
            type: vscode.FileType.Directory,
            root: true
        };
        items.forEach(item => {
            createTree(item.toPath, root);
        });
        result.push(root);
    } else {
        items.forEach(item => {
            const e: TreeEntry = {
                name: item.toPath,
                childs: [],
                uri: vscode.Uri.from({scheme: CONFIGNAME, path: '/' + item.toPath, query: item.toContentUrl}),
                root: false,
                type: vscode.FileType.File
            };
            result.push(e);
        });
    }
    return Promise.resolve(result);
}

function createTree(path: string, root: TreeEntry) {
    const paths = path.split('/');
    let parent = root;
    paths.forEach((p, index) => {
        var found = parent.childs.find(e => e.name === p);
        if (!found) {
            const e : TreeEntry = {
                name: p,
                childs: [],
                uri: vscode.Uri.from({scheme: CONFIGNAME, path: paths.slice(0, index + 1).join('/')}),
                type: index !== paths.length - 1 ? vscode.FileType.Directory : vscode.FileType.File,
                root: false
            };
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
    reviews: ReviewData[] = [];
    constructor(path: string) {
        this.apiPath = path;
        this.update();
    }

    async update() {
        this.reviews = await getListReviews(this.apiPath, false);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: Entry): vscode.TreeItem | Thenable<vscode.TreeItem> {
        if ('projectKey' in element) {
            return new ReviewMainItem(element);
        } else if ('name' in element) {
                return new RootTree(element);
        } else if ('description' in element) {
            const description =  new vscode.TreeItem(element.description);
            description.iconPath = new vscode.ThemeIcon('info');
            return description;
        } else {
            return new vscode.TreeItem("???");
        }
    }

    async getChildren(element?: Entry): Promise<Entry[]> {
        if (!element) {
            return getListReviews(this.apiPath, false);
        } else {
            if ('projectKey' in element) {
                return Promise.resolve(createMainEntry(element));
            } else if ('name' in element) {
                return Promise.resolve(element.childs);
            }
            return Promise.resolve([]);
        }
    }
}
