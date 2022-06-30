const vscode = acquireVsCodeApi();
let reviewerGrid;
let replyform;
let commentplaceholder;
let generalcommentcontainer;

window.addEventListener("load", main);
// Handle the message inside the webview
window.addEventListener('message', event => {
    const message = event.data; // The JSON data our extension sent
    switch (message.msg) {
        case 'reviewers':
            updateReviewer(message.data, message.percents);
            break;
    }
});

function updateReviewer(reviewers, percents) {
    var data = [];
    for(const element of reviewers) {
        var timeSpend = "";
        var status = "";
        if (element.timeSpent) {
            timeSpend = `${Math.floor(element.timeSpent / 60000)}m`;
        }
        if (element.completed) {
            status = "Completed";
        } else {
            if (element.userName in percents) {
                status = `${Math.floor(percents[element.userName])}% reviewed`;
            } else {
                status = "0% reviewed";
            }
        }
        data.push({"col1": element.displayName, "col2": status, "col3": timeSpend});
    }
    reviewerGrid = document.getElementById("reviewer-grid");
    reviewerGrid.rowsData = data;
    reviewerGrid.columnDefinitions = [
        { columnDataKey: "col1", title: "Name"},
        { columnDataKey: "col2", title: "Status"},
        { columnDataKey: "col3", title: "Time Spend"},
    ];

}

function closeReview() {
    vscode.postMessage({command: 'transition', transition: "close"});
}


function abandonReview() {
    vscode.postMessage({command: 'transition', transition: "abandon"});
}


function reopenReview() {
    vscode.postMessage({command: 'transition', transition: "reopen"});

}

function recoverReview() {
    vscode.postMessage({command: 'transition', transition: "recover"});
}

function main() {
    reviewerGrid = document.getElementById("reviewer-grid");
    const closeReviewButton = document.getElementById("closeReviewButton");
    if (closeReviewButton) {
        closeReviewButton.addEventListener("click", () => closeReview());
    }
    const abandonReviewButton = document.getElementById("abandonReviewButton");
    if (abandonReviewButton) {
        abandonReviewButton.addEventListener("click", () => abandonReview());
    }
    const reopenReviewButton = document.getElementById("reopenReviewButton");
    if (reopenReviewButton) {
        reopenReviewButton.addEventListener("click", () => reopenReview());
    }
    const recoverReviewButton = document.getElementById("recoverReviewButton");
    if (recoverReviewButton) {
        recoverReviewButton.addEventListener("click", () => recoverReview());
    }
    generalcommentcontainer = document.getElementById('general-comments-container');
    commentplaceholder = document.getElementById("commentplaceholder");
    commentplaceholder.addEventListener('click', () => {
        commentplaceholder.style.display = "none";
        displayCommentForm(undefined, generalcommentcontainer);
    });

    replyform = document.getElementById("replyform");
    const cancelBtn = document.getElementById("cancelBtn");
    cancelBtn.addEventListener("click", () => {
        replyform.style.display = "none";
        if (commentplaceholder.style.display === "none") {
            commentplaceholder.style.display = "inline";
        }
    });

    document.getElementById("submitComment").addEventListener("click", () => {
        let comment = document.getElementById("inputComment").value;
        console.log(comment);
        if (comment.length === 0) {
            vscode.postMessage({command: 'msg', message: "Comment is empty!", type: "error"});
        } else {
            vscode.postMessage({command: 'generalcomment', message: comment, isdraft: false, parentid: replyform.getAttribute("parentid")});
        }
    });

    document.getElementById("saveDraftComment").addEventListener("click", () => {
        let comment = document.getElementById("inputComment").value;
        console.log(comment);
        if (comment.length === 0) {
            vscode.postMessage({command: 'msg', message: "Comment is empty!", type: "error"});
        } else {
            vscode.postMessage({command: 'generalcomment', message: comment, isdraft: true, parentid: replyform.getAttribute("parentid")});
        }
    });

    const replys = document.querySelectorAll(`[id^="reply_"]`);
    replys.forEach(reply => {
        const id = reply.id.split('_')[1];
        const formparent = document.getElementById("generalreplyFormDiv_" + id);
        reply.addEventListener("click", () => displayCommentForm(id, formparent));
    });
}

function displayCommentForm(parentcommentid, formparent) {
    formparent.appendChild(replyform);
    replyform.style.display = "inline";
    replyform.setAttribute("parentid", parentcommentid);
    formparent.style.display = "block";
}