import { ReviewData, ReviewItem } from "./Structure";
import * as vscode from "vscode";


export class RevisionSelectorManager {
    private db: { [id: string]: { revisions: { left: string, right: string }[], info: ReviewData, items: ReviewItem[], selectedItem: number} } = {};

    constructor() {
    }

    getRevisions(entry: ReviewData, item: ReviewItem): { left: string, right: string, fromContentUrl: string, toContentUrl: string } {
        const id = entry.permaId.id;
        const index = this.db[id].items.findIndex(e => e.permId.id === item.permId.id);
        this.db[id].selectedItem = index;
        // TODO: Check index === -1
        const left = this.db[id].revisions[index].left;
        const right = this.db[id].revisions[index].right;
        var fromUrl = "";
        if (item.commitType === 'Added') {
            fromUrl = "";
        } else {
            fromUrl = item.expandedRevisions.find(rev => rev.revision === left)!.contentUrl;
        }
        const toUrl = item.expandedRevisions.find(rev => rev.revision === right)!.contentUrl;
        return {
            left: left,
            right: right,
            fromContentUrl: fromUrl,
            toContentUrl: toUrl,
        };
    }

    public setLeftRevision(id: string, rev: string) {
        this.db[id].revisions[this.db[id].selectedItem].left = rev;
        vscode.commands.executeCommand("crucible.diff", this.db[id].info, this.db[id].items[this.db[id].selectedItem]);
    }

    public setRightRevision(id: string, rev: string) {
        this.db[id].revisions[this.db[id].selectedItem].right = rev;
        vscode.commands.executeCommand("crucible.diff", this.db[id].info, this.db[id].items[this.db[id].selectedItem]);
    }
    // public set(entry: ReviewData) {
    //     if (entry.permaId.id in this.db) {
    //         this.db[entry.permaId.id].info = entry;
    //     } else {
    //         this.db[entry.permaId.id] = {info: entry, items: [], left: "", right: ""};
    //     }
    // }

    public set(entry: ReviewData, items: ReviewItem[]) {
        if (entry.permaId.id in this.db) {
            this.db[entry.permaId.id].info = entry;
            this.db[entry.permaId.id].items = items;
        } else {
            this.db[entry.permaId.id] = {info: entry, items: items, revisions: [], selectedItem: -1};
        }
        this.db[entry.permaId.id].items.forEach(item => {
            this.db[entry.permaId.id].revisions.push({ left: item.expandedRevisions[0].revision,
                    right: item.expandedRevisions[item.expandedRevisions.length - 1].revision });
        });
    }
}