export interface Reviews {
    reviewData: ReviewData[];
}
export interface ReviewItems {
    reviewItem: ReviewItem[];
}

export interface ReviewDetail {
    projectKey:           string;
    name:                 string;
    description:          string;
    author:               User;
    moderator:            User;
    creator:              User;
    permaId:              ID;
    permaIdHistory:       string[];
    state:                string;
    type:                 string;
    allowReviewersToJoin: boolean;
    metricsVersion:       number;
    createDate:           string;
    dueDate:              string;
    reviewers:            Reviewers;
    reviewItems:          ReviewItems;
    generalComments:      GeneralComments;
    versionedComments:    VersionedComments;
    transitions:          Transitions;
    actions:              Actions;
    stats:                Stat[];
}
export interface Actions {
    actionData: TionDatum[];
}

export interface TionDatum {
    name:        string;
    displayName: string;
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


export enum ReadStatus {
    Read = "READ",
    Unread = "UNREAD",
}

export interface Reply {
    metrics:         Metrics;
    message:         string;
    draft:           boolean;
    deleted:         boolean;
    defectRaised:    boolean;
    defectApproved:  boolean;
    readStatus:      ReadStatus;
    user:            User;
    createDate:      string;
    permaId:         ID;
    replies:         Reply[];
    messageAsHtml:   string;
    permId:          ID;
    parentCommentId: ID;
}

export interface Reviewers {
    reviewer: Reviewer[];
}

export interface Reviewer {
    userName:                    User;
    displayName:                 string;
    avatarUrl:                   string;
    completed:                   boolean;
    timeSpent?:                  number;
    completionStatusChangeDate?: number;
}

export interface Stat {
    user:        User;
    published:   number;
    drafts:      number;
    defects:     number;
    unread:      number;
    leaveUnread: number;
    read:        number;
}

export interface TionDatum {
    name:        string;
    displayName: string;
}

export interface Transitions {
    transitionData: TionDatum[];
}

export interface VersionedComments {
    comments: VersionedCommentsComment[];
}

export interface VersionedCommentsComment {
    metrics:        Metrics;
    message:        string;
    draft:          boolean;
    deleted:        boolean;
    defectRaised:   boolean;
    defectApproved: boolean;
    readStatus:     ReadStatus;
    user:           User;
    createDate:     number;
    permaId:        string;
    replies:        Reply[];
    messageAsHtml:  string;
    reviewItemId:   ID;
    toLineRange:    string;
    lineRanges:     LineRange[];
    fromLineRange?: string;
}

export interface LineRange {
    revision: string;
    range:    string;
}


export interface GeneralComments {
    comments: GeneralCommentsComment[];
}

export interface GeneralCommentsComment {
    metrics:         Metrics;
    message:         string;
    draft:           boolean;
    deleted:         boolean;
    defectRaised:    boolean;
    defectApproved:  boolean;
    readStatus:      ReadStatus;
    user:            User;
    createDate:      string;
    permaId:         ID;
    replies:         GeneralCommentsComment[];
    messageAsHtml:   string;
    permId:          ID;
    parentCommentId: Metrics;
}

export interface Metrics {
}

export interface ID {
    id: string;
}
