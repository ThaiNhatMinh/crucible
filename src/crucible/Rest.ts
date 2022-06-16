import * as vscode from 'vscode';
import { CONFIGNAME, HOSTNAME, PORT, TOKEN } from './ConfigPath';
import got from 'got';

export function url(...paths: string[]): string
{
    var config = vscode.workspace.getConfiguration('crucible');
    const hostname = config.get<string>(HOSTNAME);
    const port = config.get<string>(PORT);
    var authority = `http://${hostname}:${port}`;
    return authority + '/' + paths.join('/');
}

export async function get<T>(...paths: string[]): Promise<T> {
    var uri = url(...paths);
    var config = vscode.workspace.getConfiguration('crucible');
    const token = config.get<string>(TOKEN);
    const data = await got.get(uri, {
        headers: {
            'Accept': 'application/json'
        },
        searchParams: {FEAUTH: token}
    }).json<T>();

    return data;
}