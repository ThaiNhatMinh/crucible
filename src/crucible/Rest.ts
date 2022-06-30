import * as vscode from 'vscode';
import { CONFIGNAME, HOSTNAME, PORT, TOKEN } from './ConfigPath';
import got from 'got';
import { COMMENTS, GENERAL_COMMENTS, REVIEW_INFORMATION, TRANSITION, Transition } from './ApiPath';
import { GeneralComments, GeneralCommentsComment, ReviewData } from './Structure';

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

export function avatarUrl(username: string) {
    return url("avatar", `${username}?s=32`);
}

export function get<T>(...paths: string[]): Promise<T> {
    var uri = url(...paths);
    var config = vscode.workspace.getConfiguration(CONFIGNAME);
    const token = config.get<string>(TOKEN);
    const data = got.get(uri, {
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Accept': 'application/json'
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        searchParams: {FEAUTH: token}
    }).json<T>();

    return data;
}

export function getGeneralComment(id: string, render: boolean): Promise<GeneralComments> {
    var uri = url(REVIEW_INFORMATION, id, GENERAL_COMMENTS);
    const token = vscode.workspace.getConfiguration(CONFIGNAME).get<string>(TOKEN);
    return got.get(uri, {
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Accept': 'application/json'
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        searchParams: {FEAUTH: token, render: render}
    }).json<GeneralComments>();
}

export function getRaw(...paths: string[]): Promise<Buffer> {
    var uri = url(...paths);
    var config = vscode.workspace.getConfiguration(CONFIGNAME);
    const token = config.get<string>(TOKEN);
    const data = got.get(uri, {
        // eslint-disable-next-line @typescript-eslint/naming-convention
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
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Accept': 'application/json'
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        searchParams: {FEAUTH: token, action: ttr, ignoreWarnings: ignoreWarnings}
    }).json<ReviewData>();
}

export function postComment(id: string, msg: string, isdraft: boolean, parentcomment?: string): Promise<GeneralCommentsComment> {
    var uri;
    if (parentcomment) {
        uri = url(REVIEW_INFORMATION, id, COMMENTS, parentcomment, "replies");
    } else {
        uri = url(REVIEW_INFORMATION, id, COMMENTS);
    }

    var config = vscode.workspace.getConfiguration(CONFIGNAME);
    const token = config.get<string>(TOKEN);
    return got.post(uri, {
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Content-Type': 'application/json',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Accept': 'application/json'
        },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        searchParams: { FEAUTH: token },
        json: {
            "message" : msg,
            "draft" : isdraft,
            "deleted" : false,
            "defectRaised" : false,
            "defectApproved" : false
        }
    }).json<GeneralCommentsComment>();

}