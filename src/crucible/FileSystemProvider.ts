
import { homedir } from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { CACHE_LOCATION, CONFIGNAME } from './ConfigPath';
import { log } from './Log';
import { getRaw } from './Rest';

/**
 * ${CACHE_LOCATION}/${permaId}/${changenumber}/${path}
 */
export class CrucibleFileSystemProvider implements vscode.FileSystemProvider {
    private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    private fs = vscode.workspace.fs;
    private cacheLocation = vscode.workspace.getConfiguration(CONFIGNAME).get<string>(CACHE_LOCATION);
    onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

    constructor() {
        if (!this.cacheLocation) {
            this.cacheLocation = homedir();
        } else if (this.cacheLocation.startsWith("~/"))
        {
            this.cacheLocation = this.cacheLocation.replace('~', homedir());
        }
    }
    watch(uri: vscode.Uri, options: { readonly recursive: boolean; readonly excludes: readonly string[]; }): vscode.Disposable {
        return {
            dispose: () => {
                /**/
            },
        };
    }
    stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
        // if ctime and mtime is the same with last time read file, vscode return error
        const now = new Date().getTime();
        const a: vscode.FileStat = {
            type: vscode.FileType.File,
            ctime: now,
            mtime: now,
            size: 0,
        };
        return a;
    }
    readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
        throw new Error('Method not implemented.');
    }
    createDirectory(uri: vscode.Uri): void | Thenable<void> {
        throw new Error('Method not implemented.');
    }
    readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
        if (!uri.query) {
            return new Uint8Array;
        }
        return this.getCache(uri).then(content => content, reason => getRaw(uri.query)).then(content => {
            this.saveCache(uri, content);
            return content;
        });
    }
    writeFile(uri: vscode.Uri, content: Uint8Array, options: { readonly create: boolean; readonly overwrite: boolean; }): void | Thenable<void> {
        throw new Error('Method not implemented.');
    }
    delete(uri: vscode.Uri, options: { readonly recursive: boolean; }): void | Thenable<void> {
        throw new Error('Method not implemented.');
    }
    rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { readonly overwrite: boolean; }): void | Thenable<void> {
        throw new Error('Method not implemented.');
    }

    private getCache(uri: vscode.Uri): Thenable<Uint8Array> {
        log("[FS][CACHE]", "Read cache:", uri);
        const localUri = vscode.Uri.file(path.join(this.cacheLocation!, uri.query));
        return this.fs.readFile(localUri);
    }

    private saveCache(uri: vscode.Uri, content: Uint8Array) {
        log("[FS][CACHE]", "Save cache:", uri);
        const localUri = vscode.Uri.parse(path.resolve(this.cacheLocation!, uri.query.substring(1)));
        this.fs.writeFile(localUri, content);
    }
};