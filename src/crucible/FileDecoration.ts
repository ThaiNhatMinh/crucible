import * as vscode from 'vscode';

export interface FileStat {
    viewed: boolean,
    commitType: string,
	comments: boolean,
	revision?: string
}


function parseStat(fragment: string) : FileStat {
	return JSON.parse(fragment) as FileStat;
}


function color(status: FileStat): vscode.ThemeColor | undefined {
	let color: string | undefined;
	switch (status.commitType) {
		case "Modified":
			color = 'gitDecoration.modifiedResourceForeground';
			break;
		case "Added":
			color = 'gitDecoration.addedResourceForeground';
			break;
		case "Deleted":
			color = 'gitDecoration.deletedResourceForeground';
			break;
		case "Moved":
			color = 'gitDecoration.renamedResourceForeground';
			break;
		case "Unknown":
			color = undefined;
			break;
		case "Copied":
			color = 'gitDecoration.conflictingResourceForeground';
			break;
	}
	return color ? new vscode.ThemeColor(color) : undefined;
}

function letter(status: FileStat): string {
	switch (status.commitType) {
		case "Modified":
			return 'M';
		case "Added":
			return 'A';
		case "Deleted":
			return 'D';
		case "Moved":
			return 'M';
		case "Unknown":
			return '?';
		case "Copied":
			return 'C';
	}

	return '';
}

export class FileDecorationProvider implements vscode.FileDecorationProvider {
    onDidChangeFileDecorations?: vscode.Event<vscode.Uri | vscode.Uri[] | undefined> | undefined;
    provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration> {
        if (uri.scheme !== "crucible" || !uri.fragment) {
            return null;
        }

        const stat = parseStat(uri.fragment);
        return {
            color: color(stat),
            badge: letter(stat),
            propagate: true
        };
    }

}

export class CommentDecorationProvider implements vscode.FileDecorationProvider {
	onDidChangeFileDecorations?: vscode.Event<vscode.Uri | vscode.Uri[] | undefined> | undefined;
	provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration> {
		if (uri.scheme !== "crucible" || !uri.fragment) {
            return null;
        }

        const stat = parseStat(uri.fragment);
		if (stat.comments) {
			return {
				propagate: false,
				tooltip: stat.revision !== undefined ? "Has comments" : `Comments on revision ${stat.revision}`,
				badge: '💬',
			};
		}
	}

}

export class ViewedDecorationProvider implements vscode.FileDecorationProvider {
    private _emitter = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
	onDidChangeFileDecorations?: vscode.Event<vscode.Uri | vscode.Uri[] | undefined> | undefined = this._emitter.event;

	public fileRead(uris: vscode.Uri[]) {
        this._emitter.fire(uris);
	}

	provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FileDecoration> {
		if (uri.scheme !== "crucible" || !uri.fragment) {
            return null;
        }

        const stat = parseStat(uri.fragment);
		if (stat.viewed) {
			return {
				propagate: false,
				tooltip: "Readed",
				badge: '👀',
				color: color(stat),
			};
		} else {
			return undefined;
		}
	}

}