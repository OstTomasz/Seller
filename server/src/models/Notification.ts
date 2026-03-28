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
        "event_invitation",
        "event_mandatory",
        "event_conflict",
        "event_response",
      ],
      required: true,
    },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },
    eventId: { type: Schema.Types.ObjectId, ref: "Event", default: null },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
    metadata: {
      // client notifications
      reason: { type: String, default: null },
      rejectionReason: { type: String, default: null },
      companyName: { type: String, default: null },
      // event notifications
      eventTitle: { type: String, default: null },
      conflictingEventId: { type: String, default: null },
      conflictingEventTitle: { type: String, default: null },
      responderName: { type: String, default: null },
      responderStatus: { type: String, default: null },
    },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export default model<INotification>("Notification", notificationSchema);
