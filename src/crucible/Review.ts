import { get } from "./Rest";
import { REVIEWERS, REVIEW_INFORMATION, REVIEW_ITEMS } from "./ApiPath";
import { Reviews, ReviewItems, ReviewItem, ReviewData, Reviewer, Reviewers } from "./Structure";

export async function getListReviews(path: string, detail: boolean): Promise<ReviewData[]> {
    return get<Reviews>(path).then(result => {
        return result.reviewData;
    });
}

export async function getReviewItems(id:string, detail: boolean): Promise<ReviewItem[]> {
    return get<ReviewItems>(REVIEW_INFORMATION, id, REVIEW_ITEMS).then(result => {
        return result.reviewItem;
    });
}

export async function getListReviewers(id: string): Promise<Reviewer[]> {
    return get<Reviewers>(REVIEW_INFORMATION, id, REVIEWERS).then(result => {
        return result.reviewer;
    });
}