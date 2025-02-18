export interface IComment {
  userId: string;
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
