import Invitation from "../models/Invitation";
import { IInvitation, InvitationStatus } from "../types";

export const createInvitations = async (
  data: { eventId: string; inviteeId: string; status: InvitationStatus }[],
): Promise<void> => {
  await Invitation.insertMany(data);
};

export const findPendingInvitationsByUserId = async (userId: string): Promise<IInvitation[]> =>
  Invitation.find({ inviteeId: userId, status: "pending" })
    .populate({
      path: "eventId",
      populate: { path: "createdBy", select: "firstName lastName" },
    })
    .sort({ createdAt: -1 });

export const findAllInvitationsByUserId = async (userId: string): Promise<IInvitation[]> =>
  Invitation.find({ inviteeId: userId });

export const findInvitationByEventAndUser = async (
  eventId: string,
  inviteeId: string,
): Promise<IInvitation | null> => Invitation.findOne({ eventId, inviteeId });

export const updateInvitationStatus = async (
  eventId: string,
  inviteeId: string,
  status: InvitationStatus,
): Promise<IInvitation | null> =>
  Invitation.findOneAndUpdate({ eventId, inviteeId }, { status }, { returnDocument: "after" });

export const deleteInvitationsByEventId = async (eventId: string): Promise<void> => {
  await Invitation.deleteMany({ eventId });
};

export const findAcceptedInviteesByEventId = async (eventId: string): Promise<IInvitation[]> =>
  Invitation.find({ eventId, status: "accepted" }).populate("inviteeId", "firstName lastName");

/**
 * Returns all invitations for an event with invitee details.
 */
export const findInvitationsByEventId = async (eventId: string) =>
  Invitation.find({ eventId })
    .populate("inviteeId", "firstName lastName numericId")
    .sort({ status: 1, createdAt: 1 });
/**
 * Resets rejected invitations back to pending for re-invite flow.
 */
export const resetRejectedInvitations = async (
  eventId: string,
  inviteeIds: string[],
): Promise<void> => {
  await Invitation.updateMany(
    { eventId, inviteeId: { $in: inviteeIds }, status: "rejected" },
    { status: "pending" },
  );
};
