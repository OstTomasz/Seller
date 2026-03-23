import { Schema, model } from "mongoose";
import { IInvitation, InvitationStatus } from "../types";

const STATUSES: InvitationStatus[] = ["pending", "accepted", "rejected"];

const invitationSchema = new Schema<IInvitation>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    inviteeId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: STATUSES, default: "pending" },
  },
  { timestamps: true },
);

invitationSchema.index({ inviteeId: 1, status: 1 });
invitationSchema.index({ eventId: 1 });

export default model<IInvitation>("Invitation", invitationSchema);
