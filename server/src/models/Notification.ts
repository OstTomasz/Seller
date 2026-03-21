// server/src/models/Notification.ts
import { Schema, model } from "mongoose";
import { INotification } from "../types";

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "archive_request",
        "archive_approved",
        "archive_rejected",
        "unarchive_request",
        "unarchive_approved",
        "unarchive_rejected",
        "client_unarchived",
      ],
      required: true,
    },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
    metadata: {
      reason: { type: String, default: null },
      rejectionReason: { type: String, default: null },
      companyName: { type: String, default: null },
    },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export default model<INotification>("Notification", notificationSchema);
