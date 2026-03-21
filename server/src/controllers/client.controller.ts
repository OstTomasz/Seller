import { Request, Response, NextFunction } from "express";
import * as clientService from "../services/client.service";
import { UserRole } from "../types";
import { BadRequestError } from "../utils/errors";
import { wrapAsync } from "../utils/wrapAsync";

export const getClients = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const clients = await clientService.getClients(req.userId!, req.userRole as UserRole);
    res.status(200).json({ clients });
  },
);

export const getClientById = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const client = await clientService.getClientById(id, req.userId!, req.userRole as UserRole);
    res.status(200).json({ client });
  },
);

export const createClient = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { companyName, nip, notes, addresses, salespersonPositionId } = req.body;

    if (!companyName) {
      throw new BadRequestError("companyName is required");
    }

    if (!addresses || addresses.length === 0) {
      throw new BadRequestError("At least one address is required");
    }

    const client = await clientService.createClient(
      { companyName, nip, notes, addresses, salespersonPositionId },
      req.userId!,
      req.userRole as UserRole,
    );

    res.status(201).json({ client });
  },
);

export const updateClient = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const { companyName, nip, notes, addresses } = req.body;

    const client = await clientService.updateClient(
      id,
      { companyName, nip, notes, addresses },
      req.userId!,
      req.userRole as UserRole,
    );

    res.status(200).json({ client });
  },
);

export const updateClientStatus = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const { status, inactivityReason } = req.body;

    if (!status) {
      throw new BadRequestError("status is required");
    }

    const client = await clientService.updateClientStatus(
      id,
      status,
      inactivityReason ?? null,
      req.userId!,
      req.userRole as UserRole,
    );

    res.status(200).json({ client });
  },
);

export const requestArchive = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const { reason } = req.body;

    if (!reason) {
      throw new BadRequestError("reason is required");
    }

    const client = await clientService.requestArchive(
      id,
      reason,
      req.userId!,
      req.userRole as UserRole,
    );

    res.status(200).json({ client });
  },
);

export const approveArchive = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };

    const client = await clientService.approveArchive(id, req.userId!, req.userRole as UserRole);

    res.status(200).json({ client });
  },
);

export const unarchiveClient = wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const { reason } = req.body as { reason: string };
  if (!reason?.trim()) throw new BadRequestError("Reason is required");

  const client = await clientService.unarchiveClient(id, reason, req.userId!, req.userRole!);
  res.status(200).json({ client });
});

export const rejectUnarchive = wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const { reason } = req.body as { reason: string };
  if (!reason?.trim()) throw new BadRequestError("Rejection reason is required");

  await clientService.rejectUnarchive(id, reason, req.userId!, req.userRole!);
  res.status(200).json({ message: "Unarchive request rejected" });
});
export const updateClientSalesperson = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const { salespersonPositionId } = req.body;

    if (!salespersonPositionId) {
      throw new BadRequestError("salespersonPositionId is required");
    }

    const client = await clientService.updateClientSalesperson(
      id,
      salespersonPositionId,
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(200).json({ client });
  },
);

export const addNote = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const { content } = req.body;

    if (!content) {
      throw new BadRequestError("content is required");
    }

    const client = await clientService.addNote(id, content, req.userId!, req.userRole as UserRole);
    res.status(201).json({ client });
  },
);

export const updateNote = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id, noteId } = req.params as { id: string; noteId: string };
    const { content } = req.body;

    if (!content) {
      throw new BadRequestError("content is required");
    }

    const client = await clientService.updateNote(
      id,
      noteId,
      content,
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(200).json({ client });
  },
);

export const deleteNote = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id, noteId } = req.params as { id: string; noteId: string };
    const client = await clientService.deleteNote(
      id,
      noteId,
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(200).json({ client });
  },
);

export const addAddress = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const { label, street, city, postalCode } = req.body;

    if (!label || !street || !city || !postalCode) {
      throw new BadRequestError("label, street, city and postalCode are required");
    }

    const client = await clientService.addAddress(
      id,
      { label, street, city, postalCode },
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(201).json({ client });
  },
);

export const updateAddress = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id, addressId } = req.params as { id: string; addressId: string };
    const { label, street, city, postalCode } = req.body;

    const client = await clientService.updateAddress(
      id,
      addressId,
      { label, street, city, postalCode },
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(200).json({ client });
  },
);

export const deleteAddress = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id, addressId } = req.params as { id: string; addressId: string };
    const client = await clientService.deleteAddress(
      id,
      addressId,
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(200).json({ client });
  },
);

export const addContact = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id, addressId } = req.params as { id: string; addressId: string };
    const { firstName, lastName, phone, email } = req.body;

    if (!firstName || !lastName) {
      throw new BadRequestError("firstName and lastName are required");
    }

    const client = await clientService.addContact(
      id,
      addressId,
      { firstName, lastName, phone: phone ?? null, email: email ?? null },
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(201).json({ client });
  },
);

export const updateContact = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id, addressId, contactId } = req.params as {
      id: string;
      addressId: string;
      contactId: string;
    };
    const { firstName, lastName, phone, email } = req.body;

    const client = await clientService.updateContact(
      id,
      addressId,
      contactId,
      { firstName, lastName, phone: phone ?? null, email: email ?? null },
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(200).json({ client });
  },
);

export const deleteContact = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id, addressId, contactId } = req.params as {
      id: string;
      addressId: string;
      contactId: string;
    };
    const client = await clientService.deleteContact(
      id,
      addressId,
      contactId,
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(200).json({ client });
  },
);

export const directArchive = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params as { id: string };
    const { reason } = req.body;

    if (!reason) throw new BadRequestError("reason is required");

    const client = await clientService.directArchive(
      id,
      reason,
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(200).json({ client });
  },
);

export const checkNip = wrapAsync(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { nip } = req.params as { nip: string };
    const result = await clientService.checkNipInArchive(nip);
    res.status(200).json(result);
  },
);

export const rejectArchive = wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  const { reason } = req.body as { reason: string };
  if (!reason?.trim()) throw new BadRequestError("Rejection reason is required");

  const client = await clientService.rejectArchive(id, reason, req.userId!, req.userRole!);
  res.status(200).json({ client });
});

export const getArchivedClients = wrapAsync(async (req: Request, res: Response): Promise<void> => {
  const clients = await clientService.getArchivedClients(req.userRole!);
  res.status(200).json({ clients });
});
