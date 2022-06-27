const vscode = acquireVsCodeApi();
let reviewerGrid;

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
                status = `${int(percents[element.userName])}% reviewed`;
            } else {
                status = "0% reviewed";
            }
        }
        data.push({"col1": element.displayName, "col2": status, "col3": timeSpend});
    }
    reviewerGrid.rowsData = data;
    reviewerGrid.columnDefinitions = [
        { columnDataKey: "col1", title: "Name"},
        { columnDataKey: "col2", title: "Status"},
        { columnDataKey: "col3", title: "Time Spend"},
    ];

}

function closeReview() {
    console.log("closeReviewButton");
}


function abandonReview() {
    console.log("abandonReviewButton");

}


function reopenReview() {
    console.log("reopenReviewButton");

}

function recoverReview() {
    console.log("recoverReviewButton");
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
}