import got from 'got';
import * as ApiPath from './ApiPath';
import * as ConfigPath from "./ConfigPath";
import * as vscode from 'vscode';
import { url } from './Rest';

type Token = {
    'token': string
};

export async function login()
{
    var config = vscode.workspace.getConfiguration(ConfigPath.CONFIGNAME);
    const token = config.get<string>(ConfigPath.TOKEN);
    if (token)
    {
        return;
    }
    var username = config.get<string>(ConfigPath.USERNAME);
    if (!username)
    {
        username = await vscode.window.showInputBox({
            prompt: "Enter username",
            value: "minh.thai"
        });
        if (!username)
        {
            return;
        }
    }

    const password = await vscode.window.showInputBox({
        prompt: "Enter password",
            value: 'cout<<"M0322";',
            password: true,
    });
    if (!password)
    {
        return;
    }

    const data = await got.post(url(ApiPath.LOGIN), {
        body: `userName=${username}&password=${encodeURI(password)}`
    }).json<Token>();

    await config.update(ConfigPath.USERNAME, username, true);
    await config.update(ConfigPath.TOKEN, data.token, true);
}