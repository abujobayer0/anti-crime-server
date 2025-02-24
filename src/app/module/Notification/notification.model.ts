import { Schema, model } from "mongoose";
import { TNotification, NotificationType } from "./notification.interface";

const NotificationSchema = new Schema<TNotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    enum: Object.values(NotificationType),
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  relatedReport: {
    type: Schema.Types.ObjectId,
    ref: "CrimeReport",
    required: false,
  },
  relatedComment: {
    type: Schema.Types.ObjectId,
    ref: "Comment",
    required: false,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = model<TNotification>("Notification", NotificationSchema);

export default Notification;
