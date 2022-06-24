const vscode = acquireVsCodeApi();
window.addEventListener("load", main);
var leftRevisionHtml;
var rightRevisionHtml;
var leftDiv;
var rightDiv;
var nameHtml;
var leftRevision;
var rightRevision;

// Handle the message inside the webview
window.addEventListener('message', event => {
    const message = event.data; // The JSON data our extension sent
    switch (message.msg) {
        case 'revisions':
            updateRevision(message.revisions, message.left, message.right);
            if (message.name) {
                nameHtml.innerText = message.name;
            }
            break;
    }
});

function updateRevision(revisions, left, right) {
    if (revisions.length <= 1) {
        leftDiv.style.display = 'none';
        rightDiv.style.display = 'none';

        // TODO: Update label to notice file is added
        return;
    } else {
        leftDiv.style.display = 'inline';
        rightDiv.style.display = 'inline';
    }

    leftRevision = left ?? revisions[0].revision;
    rightRevision = right ?? revisions[revisions.length - 1].revision;

    var leftselect = document.getElementById("leftselect");
    if (leftselect) {
        leftselect.remove();
    }
    var rightselect = document.getElementById("rightselect");
    if (rightselect) {
        rightselect.remove();
    }

    leftselect = document.createElement("vscode-dropdown");
    rightselect = document.createElement("vscode-dropdown");
    leftselect.id = "leftselect";
    rightselect.id = "rightselect";

    var rightIndex;
    for (var i = 0; i < revisions.length - 1; i++) {
        if (revisions[i].revision === rightRevision) {
            break;
        }
        var option = document.createElement('vscode-option');
        option.innerText = revisions[i].revision;
        if (revisions[i].revision === leftRevision) {
            option.setAttribute("selected", "selected");
            option.selected = true;
            rightIndex = i;
        }
        leftselect.appendChild(option);
    }
    for (var i = rightIndex + 1; i < revisions.length; i++) {
        var option = document.createElement('vscode-option');
        option.innerText = revisions[i].revision;
        if (revisions[i].revision === rightRevision) {
            option.setAttribute("selected", "selected");
            option.selected = true;
        }
        rightselect.appendChild(option);
    }

    leftselect.onchange = leftChange;
    rightselect.onchange = rightChange;
    leftRevisionHtml.appendChild(leftselect);
    rightRevisionHtml.appendChild(rightselect);
}

/** 
 * @param {Event} e
 */
function leftChange(e) {
    vscode.postMessage({command: 'leftSelect', revision: e.target.value, id: nameHtml.innerText});
}

function rightChange(e) {
    vscode.postMessage({command: 'rightSelect', revision: e.target.value, id: nameHtml.innerText});
}

function main() {
    leftRevisionHtml = document.getElementById("leftchild");
    rightRevisionHtml = document.getElementById("rightchild");

    leftDiv = document.getElementById("left");
    rightDiv = document.getElementById("right");
    nameHtml = document.getElementById("name");
}