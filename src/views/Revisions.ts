import * as vscode from "vscode";
import { ReviewData, ReviewItem } from "../crucible/Structure";
import { getUri } from "./utilities";


export class Revisions implements vscode.WebviewViewProvider {
    public static readonly viewType = "crucible.revisions";
    private extensionUri: vscode.Uri;
    private view?: vscode.Webview;

    constructor(extensionsUri: vscode.Uri) {
        this.extensionUri = extensionsUri;
    }

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<{name:string, item: ReviewItem}>, token: vscode.CancellationToken): void | Thenable<void> {
        // Allow scripts in the webview
        webviewView.webview.options = {
            enableScripts: true,
        };
        // Set the HTML content that will fill the webview view
        webviewView.webview.html = this.getWebviewContent(webviewView.webview, context.state?.name);
        this.setWebviewMessageListener(webviewView);
        if (context.state?.item) {
            webviewView.webview.postMessage({ msg: "revisions", revisions: context.state?.item});
        }
        this.view = webviewView.webview;
    }

    public setData(info: ReviewData, item: ReviewItem) {
        if (this.view) {
            this.view.postMessage({msg: "revisions", name: info.permaId.id, revisions: item.expandedRevisions});
        }
        // this._panel.dispose();
    }

    private getWebviewContent(webview: vscode.Webview, name?:string): string {
        const toolkitUri = getUri(webview, this.extensionUri, [
            "node_modules",
            "@vscode",
            "webview-ui-toolkit",
            "dist",
            "toolkit.js",
          ]);
        const scriptUri = getUri(webview, this.extensionUri, ["src", "views", "js", "revisions.js"]);
        // https://viblo.asia/p/tao-responsive-html-don-gian-voi-grid-4dbZNq9vKYM
        return `
        <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script type="module" src="${toolkitUri}"></script>
              <script type="module" src="${scriptUri}"></script>
              <style>
                .container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    grid-template-rows: 50px 50px;
                }
              </style>
            </head>
            <body>
                <div><h1 id="name">${name ?? ""}</h1></div>
                <div class="container">
                    <div>
                        <div style="vertical-align: middle;">
                            <label style="line-height:25px;">Base revision: </label>
                            <vscode-dropdown id="base-changelist"></vscode-dropdown>
                        </div>
                    </div>
                    <div>
                        <div style="vertical-align: middle;">
                            <label style="line-height:25px;">Diff againt revision: </label>
                            <vscode-dropdown id="rev-changelist"></vscode-dropdown>
                        </div>
                    </div>
                </div>
            </body>
          </html>`;
    }

    private setWebviewMessageListener(webviewView: vscode.WebviewView) {
        webviewView.webview.onDidReceiveMessage((message) => {});
    }
}