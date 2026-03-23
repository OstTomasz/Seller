import { Schema, model } from "mongoose";
import { IEvent, EventType } from "../types";

const EVENT_TYPES: EventType[] = ["client_meeting", "team_meeting", "personal"];

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    duration: { type: Number, default: null, min: 1 },
    allDay: { type: Boolean, default: false },
    location: { type: String, default: null, trim: true },
    description: { type: String, default: null, trim: true },
    type: { type: String, enum: EVENT_TYPES, required: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    mandatory: { type: Boolean, default: false },
  },
  { timestamps: true },
);

eventSchema.index({ createdBy: 1, startDate: 1 });
eventSchema.index({ startDate: 1 });

export default model<IEvent>("Event", eventSchema);
