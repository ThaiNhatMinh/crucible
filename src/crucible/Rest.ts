import * as vscode from 'vscode';
import { CONFIGNAME, HOSTNAME, PORT, TOKEN } from './ConfigPath';
import got from 'got';
import { REVIEW_INFORMATION, TRANSITION, Transition } from './ApiPath';
import { ReviewData } from './Structure';

export function url(...paths: string[]): string
{
    var config = vscode.workspace.getConfiguration(CONFIGNAME);
    const hostname = config.get<string>(HOSTNAME);
    const port = config.get<string>(PORT);
    var authority = `http://${hostname}:${port}`;
    let path = paths.join('/');
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    return authority + path;
}

export function get<T>(...paths: string[]): Promise<T> {
    var uri = url(...paths);
    var config = vscode.workspace.getConfiguration(CONFIGNAME);
    const token = config.get<string>(TOKEN);
    const data = got.get(uri, {
        headers: {
            'Accept': 'application/json'
        },
        searchParams: {FEAUTH: token}
    }).json<T>();

    return data;
}

export function getRaw(...paths: string[]): Promise<Buffer> {
    var uri = url(...paths);
    var config = vscode.workspace.getConfiguration(CONFIGNAME);
    const token = config.get<string>(TOKEN);
    const data = got.get(uri, {
        searchParams: { FEAUTH: token }
    }).buffer();

    return data;
}

export function transition(id: string, ttr: Transition, ignoreWarnings: boolean): Promise<ReviewData> {
    var uri = url(REVIEW_INFORMATION, id, TRANSITION);
    var config = vscode.workspace.getConfiguration(CONFIGNAME);
    const token = config.get<string>(TOKEN);
    return got.post(uri, {
        headers: {
            'Accept': 'application/json'
        },
        searchParams: {FEAUTH: token, action: ttr, ignoreWarnings: ignoreWarnings}
    }).json<ReviewData>();
}