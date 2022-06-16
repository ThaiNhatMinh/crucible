export interface Reviews {
    reviewData: ReviewData[];
}
export interface ReviewItems {
    reviewItem: ReviewItem[];
}

export interface ReviewData {
    projectKey:           string;
    name:                 string;
    description:          string;
    author:               User;
    moderator:            User;
    creator:              User;
    permaId:              PermaID;
    permaIdHistory:       string[];
    state:                string;
    type:                 string;
    allowReviewersToJoin: boolean;
    metricsVersion:       number;
    createDate:           string;
    dueDate?:             string;
}

export interface User {
    userName:    string;
    displayName: string;
    avatarUrl:   string;
    url:         URL;
}

export interface PermaID {
    id: string;
}


export interface ReviewItem {
    permId:            PermaID;
    participants:      Participant[];
    repositoryName:    string;
    fromPath:          string;
    fromRevision:      string;
    fromContentUrl?:   string;
    toPath:            string;
    toRevision:        string;
    toContentUrl:      string;
    fileType:          FileType;
    commitType:        CommitType;
    authorName:        string;
    showAsDiff:        boolean;
    commitDate:        number;
    expandedRevisions: ExpandedRevision[];
}

export interface ExpandedRevision {
    addDate:      number;
    revision:     string;
    path:         string;
    contentUrl:   string;
    source:       string;
    changedLines: number;
    fileType:     FileType;
    commitType:   CommitType;
}

export interface Participant {
    user:      User;
    completed: boolean;
}

export enum FileType {
    File = "File",
}

export enum CommitType {
    Added = "Added",
    Deleted = "Deleted",
    Modified = "Modified",
}