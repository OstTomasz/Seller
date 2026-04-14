import { beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../src/utils/errors";

vi.mock("../../src/repositories/event.repository", () => ({
  findEventsByUserId: vi.fn(),
  findEventById: vi.fn(),
  findEventsByUserIdAndDateRange: vi.fn(),
  createEvent: vi.fn(),
  updateEventById: vi.fn(),
  deleteEventById: vi.fn(),
}));

vi.mock("../../src/repositories/invitation.repository", () => ({
  findInvitationByEventAndUser: vi.fn(),
  createInvitations: vi.fn(),
  findInvitationsByEventId: vi.fn(),
  resetRejectedInvitations: vi.fn(),
  deleteInvitationsByEventId: vi.fn(),
  updateInvitationStatus: vi.fn(),
  findAllInvitationsByUserId: vi.fn(),
}));

vi.mock("../../src/repositories/notification.repository", () => ({
  createNotifications: vi.fn(),
  createNotification: vi.fn(),
}));

vi.mock("../../src/repositories/user.repository", () => ({
  findUserById: vi.fn(),
  findUsersByIds: vi.fn(),
  findAllUsersForInvite: vi.fn(),
}));

vi.mock("../../src/repositories/client.repository", () => ({
  findClientById: vi.fn(),
  updateClientById: vi.fn(),
}));

vi.mock("../../src/utils/rbac", () => ({
  getSubordinateUserIdsForDeputy: vi.fn(),
  getSubordinateUserIdsForDirector: vi.fn(),
  getUserIdsByRegionId: vi.fn(),
  getUserIdsBySuperregionId: vi.fn(),
}));

import * as eventService from "../../src/services/event.service";
import * as eventRepository from "../../src/repositories/event.repository";
import * as invitationRepository from "../../src/repositories/invitation.repository";
import * as notificationRepository from "../../src/repositories/notification.repository";
import * as userRepository from "../../src/repositories/user.repository";
import * as clientRepository from "../../src/repositories/client.repository";

const mkEvent = (overrides: Record<string, unknown> = {}) =>
  ({
    _id: { toString: () => "event-1" },
    title: "Planning",
    startDate: new Date("2026-01-01T10:00:00.000Z"),
    duration: 60,
    allDay: false,
    location: null,
    description: null,
    type: "team_meeting",
    clientId: null,
    createdBy: "owner-1",
    mandatory: false,
    ...overrides,
  }) as unknown as Awaited<ReturnType<typeof eventRepository.findEventById>>;

describe("event.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws NotFoundError when event does not exist", async () => {
    vi.mocked(eventRepository.findEventById).mockResolvedValue(null);

    await expect(eventService.getEventById("missing", "user-1")).rejects.toThrow(NotFoundError);
  });

  it("throws ForbiddenError when user is neither owner nor invitee", async () => {
    vi.mocked(eventRepository.findEventById).mockResolvedValue(mkEvent({ createdBy: "owner-1" }));
    vi.mocked(invitationRepository.findInvitationByEventAndUser).mockResolvedValue(null);

    await expect(eventService.getEventById("event-1", "user-2")).rejects.toThrow(ForbiddenError);
  });

  it("returns event for invitee", async () => {
    const event = mkEvent({ createdBy: "owner-1" });
    vi.mocked(eventRepository.findEventById).mockResolvedValue(event);
    vi.mocked(invitationRepository.findInvitationByEventAndUser).mockResolvedValue(
      { _id: "inv-1" } as unknown as never,
    );

    const result = await eventService.getEventById("event-1", "user-2");
    expect(result).toBe(event);
  });

  it("validates createEvent input", async () => {
    await expect(
      eventService.createEvent(
        {
          title: " ",
          startDate: new Date().toISOString(),
          allDay: false,
          duration: 30,
          type: "team_meeting",
        },
        "u1",
        "director",
      ),
    ).rejects.toThrow(BadRequestError);

    await expect(
      eventService.createEvent(
        {
          title: "Title",
          startDate: "",
          allDay: false,
          duration: 30,
          type: "team_meeting",
        },
        "u1",
        "director",
      ),
    ).rejects.toThrow(BadRequestError);

    await expect(
      eventService.createEvent(
        {
          title: "Title",
          startDate: new Date().toISOString(),
          allDay: false,
          duration: 0,
          type: "team_meeting",
        },
        "u1",
        "director",
      ),
    ).rejects.toThrow(BadRequestError);
  });

  it("rejects mandatory personal events and unauthorized mandatory creators", async () => {
    await expect(
      eventService.createEvent(
        {
          title: "Mandatory personal",
          startDate: new Date().toISOString(),
          allDay: false,
          duration: 30,
          type: "personal",
          mandatory: true,
        },
        "u1",
        "director",
      ),
    ).rejects.toThrow(BadRequestError);

    await expect(
      eventService.createEvent(
        {
          title: "Mandatory team",
          startDate: new Date().toISOString(),
          allDay: false,
          duration: 30,
          type: "team_meeting",
          mandatory: true,
        },
        "u1",
        "advisor",
      ),
    ).rejects.toThrow(ForbiddenError);
  });

  it("creates invitations and notifications for regular event", async () => {
    vi.mocked(eventRepository.findEventsByUserIdAndDateRange).mockResolvedValue([]);
    vi.mocked(eventRepository.createEvent).mockResolvedValue(
      mkEvent({ _id: { toString: () => "event-10" }, title: "Sync" }) as never,
    );

    await eventService.createEvent(
      {
        title: "Sync",
        startDate: new Date().toISOString(),
        allDay: false,
        duration: 30,
        type: "team_meeting",
        inviteeIds: ["u2", "u1"], // creator should be filtered out
      },
      "u1",
      "director",
    );

    expect(invitationRepository.createInvitations).toHaveBeenCalledTimes(1);
    expect(notificationRepository.createNotifications).toHaveBeenCalledTimes(1);
  });

  it("handles invitation response flow", async () => {
    vi.mocked(eventRepository.findEventById).mockResolvedValue(mkEvent({ createdBy: "owner-9" }));
    vi.mocked(invitationRepository.findInvitationByEventAndUser).mockResolvedValue(
      { status: "pending" } as unknown as never,
    );
    vi.mocked(invitationRepository.updateInvitationStatus).mockResolvedValue(
      { _id: "inv-1" } as unknown as never,
    );
    vi.mocked(userRepository.findUserById).mockResolvedValue(
      { firstName: "Anna", lastName: "Nowak" } as unknown as never,
    );

    const result = await eventService.respondToInvitation("event-1", "user-1", "accepted");
    expect(result).toBeTruthy();
    expect(notificationRepository.createNotification).toHaveBeenCalledTimes(1);
  });

  it("throws ForbiddenError when mandatory invitation is responded", async () => {
    vi.mocked(eventRepository.findEventById).mockResolvedValue(mkEvent({ mandatory: true }));
    await expect(eventService.respondToInvitation("event-1", "u1", "accepted")).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("returns only pending invitations", async () => {
    vi.mocked(invitationRepository.findAllInvitationsByUserId).mockResolvedValue(
      [
        { status: "pending", _id: "1" },
        { status: "accepted", _id: "2" },
      ] as unknown as never,
    );

    const invitations = await eventService.getAllInvitations("u1");
    expect(invitations).toHaveLength(1);
  });

  it("enforces access on getEventInvitations", async () => {
    vi.mocked(eventRepository.findEventById).mockResolvedValue(mkEvent({ createdBy: "owner-x" }));
    vi.mocked(invitationRepository.findInvitationByEventAndUser).mockResolvedValue(null);

    await expect(eventService.getEventInvitations("event-1", "not-allowed")).rejects.toThrow(
      ForbiddenError,
    );
  });

  it("returns invitations list for event owner", async () => {
    vi.mocked(eventRepository.findEventById).mockResolvedValue(mkEvent({ createdBy: "owner-x" }));
    vi.mocked(invitationRepository.findInvitationByEventAndUser).mockResolvedValue(null);
    vi.mocked(invitationRepository.findInvitationsByEventId).mockResolvedValue(
      [{ _id: "inv-1" }] as unknown as never,
    );

    const result = await eventService.getEventInvitations("event-1", "owner-x");
    expect(result).toHaveLength(1);
  });

  it("deletes event and notifies invitees", async () => {
    vi.mocked(eventRepository.findEventById).mockResolvedValue(mkEvent({ createdBy: "owner-1" }));
    vi.mocked(invitationRepository.findInvitationsByEventId).mockResolvedValue(
      [{ inviteeId: "u2" }, { inviteeId: "owner-1" }] as unknown as never,
    );
    vi.mocked(eventRepository.deleteEventById).mockResolvedValue({ _id: "event-1" } as never);

    await eventService.deleteEvent("event-1", "owner-1");

    expect(invitationRepository.deleteInvitationsByEventId).toHaveBeenCalledWith("event-1");
    expect(notificationRepository.createNotifications).toHaveBeenCalledTimes(1);
  });

  it("adds meeting note when client meeting is created", async () => {
    vi.mocked(eventRepository.findEventsByUserIdAndDateRange).mockResolvedValue([]);
    vi.mocked(eventRepository.createEvent).mockResolvedValue(
      mkEvent({
        _id: { toString: () => "event-50" },
        type: "client_meeting",
        clientId: "client-1",
        title: "Client call",
      }) as never,
    );
    vi.mocked(clientRepository.findClientById).mockResolvedValue(
      { _id: { toString: () => "client-1" } } as unknown as never,
    );
    vi.mocked(userRepository.findUsersByIds).mockResolvedValue(
      [{ firstName: "A", lastName: "B" }] as unknown as never,
    );

    await eventService.createEvent(
      {
        title: "Client call",
        startDate: new Date().toISOString(),
        allDay: false,
        duration: 30,
        type: "client_meeting",
        clientId: "client-1",
        inviteeIds: ["u2"],
      },
      "u1",
      "director",
    );

    expect(clientRepository.updateClientById).toHaveBeenCalledTimes(1);
  });

  it("includes location and description in client meeting note", async () => {
    vi.mocked(eventRepository.findEventsByUserIdAndDateRange).mockResolvedValue([]);
    vi.mocked(eventRepository.createEvent).mockResolvedValue(
      mkEvent({
        _id: { toString: () => "event-60" },
        type: "client_meeting",
        clientId: "client-2",
        title: "Client workshop",
        location: "HQ",
        description: "Agenda details",
      }) as never,
    );
    vi.mocked(clientRepository.findClientById).mockResolvedValue(
      { _id: { toString: () => "client-2" } } as unknown as never,
    );
    vi.mocked(userRepository.findUsersByIds).mockResolvedValue([]);

    await eventService.createEvent(
      {
        title: "Client workshop",
        startDate: new Date().toISOString(),
        allDay: false,
        duration: 45,
        type: "client_meeting",
        clientId: "client-2",
      },
      "u1",
      "director",
    );

    const payload = vi.mocked(clientRepository.updateClientById).mock.calls[0]?.[1] as {
      $push: { notes: { content: string } };
    };
    expect(payload.$push.notes.content).toContain("Location: HQ");
    expect(payload.$push.notes.content).toContain("Notes: Agenda details");
  });
});
