const vscode = acquireVsCodeApi();
window.addEventListener("load", main);
var leftRevisionHtml;
var rightRevisionHtml;
var nameHtml;
var leftRevision;
var rightRevision;

// Handle the message inside the webview
window.addEventListener('message', event => {
    const message = event.data; // The JSON data our extension sent
    console.log(message);
    switch (message.msg) {
        case 'revisions':
            updateRevision(message.revisions);
            if (message.name) {
                nameHtml.text = message.name;
            }
            break;
    }
});

function updateRevision(revisions) {
    if (revisions.length <= 1) {
        leftRevisionHtml.style.display = 'none';
        rightRevisionHtml.style.display = 'none';

        // TODO: Update label to notice file is added
        return;
    }

    leftRevision = revisions[0].revision;
    rightRevision = revisions[revisions.length-1].revision;
    for (var i = 0; i < revisions.length-1; i++) {
        var option = document.createElement('vscode-option');
        option.innerText = revisions[i].revision;
        leftRevisionHtml.appendChild(option);
    }
    for (var i = 1; i < revisions.length; i++) {
        var option = document.createElement('vscode-option');
        option.innerText = revisions[i].revision;
        rightRevisionHtml.appendChild(option);
    }
}

function main() {
    leftRevisionHtml = document.getElementById("base-changelist");
    rightRevisionHtml = document.getElementById("rev-changelist");
    nameHtml = document.getElementById("name");
}