export const DETAIL = "details";
export const REVIEW_ITEMS = "reviewitems";
export const REVIEWERS = "reviewers";
export const COMMENTS = "comments";
export const GENERAL_COMMENTS = "comments/general";
export const TRANSITION = "transition";
export const LOGIN = "rest-service-fecru/auth/login";
export const USER_INFO = "rest-service/users-v1";
export const TO_REVIEW = "rest-service/reviews-v1/filter/toReview";
export const OPENED_REVIEW = "rest-service/reviews-v1/filter/open";
export const REVIEW_INFORMATION = "rest-service/reviews-v1";

export enum Transition {
    abandon = "action:abandonReview",
    delete = "action:deleteReview",
    submit = "action:submitReview",
    approve = "action:approveReview",
    reject = "action:rejectReview",
    summarize = "action:summarizeReview",
    close = "action:closeReview",
    reopen = "action:reopenReview",
    recover = "action:recoverReview"
}