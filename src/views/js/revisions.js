const vscode = acquireVsCodeApi();
window.addEventListener("load", main);
var leftRevisionHtml;
var rightRevisionHtml;
var left;
var right;
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
        left.style.display = 'none';
        right.style.display = 'none';

        // TODO: Update label to notice file is added
        return;
    } else {
        left.style.display = 'inline';
        right.style.display = 'inline';
    }

    leftRevision = revisions[0].revision;
    rightRevision = revisions[revisions.length-1].revision;

    while (leftRevisionHtml.firstChild) {
        leftRevisionHtml.removeChild(leftRevisionHtml.firstChild);
    }

    while (rightRevisionHtml.firstChild) {
        rightRevisionHtml.removeChild(rightRevisionHtml.firstChild);
    }

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
    left = document.getElementById("left");
    right = document.getElementById("right");
    nameHtml = document.getElementById("name");
}