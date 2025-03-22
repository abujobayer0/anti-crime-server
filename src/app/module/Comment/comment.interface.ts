export interface IComment {
  userId: string;
  _id: string;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  reportId: string;
  proofImage: string[];
  proofVideo: string[];
  replyTo: string[];
  commentId?: string;
}
