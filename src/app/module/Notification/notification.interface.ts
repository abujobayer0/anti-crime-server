import { Types } from "mongoose";

export enum NotificationType {
  UPVOTE = "upvote",
  DOWNVOTE = "downvote",
  COMMENT = "comment",
  REPLY = "reply",
  FOLLOW = "follow",
}

export interface TNotification {
  recipient: Types.ObjectId;
  sender: Types.ObjectId;
  type: NotificationType;
  title: string;
  isDeleted: boolean;
  message: string;
  relatedReport?: Types.ObjectId;
  relatedComment?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}
