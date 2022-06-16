import { get } from "./Rest";
import { REVIEW_INFORMATION, REVIEW_ITEMS } from "./ApiPath";
import { Reviews, ReviewItems, ReviewItem, ReviewData } from "./Structure";

export async function getListReviews(path: string, detail: boolean): Promise<ReviewData[]> {
    var json = await get<Reviews>(path);
    return json.reviewData;
}

export async function getReviewItems(id:string, detail: boolean): Promise<ReviewItem[]> {
    var json = await get<ReviewItems>(REVIEW_INFORMATION, id, REVIEW_ITEMS);
    return json.reviewItem;
}