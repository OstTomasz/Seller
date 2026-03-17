import { Request, Response, NextFunction } from "express";
import * as clientService from "../services/client.service";
import { UserRole } from "../types";
import { BadRequestError } from "../utils/errors";

export const getClients = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const clients = await clientService.getClients(req.userId!, req.userRole as UserRole);
    res.status(200).json({ clients });
  } catch (error) {
    next(error);
  }
};

export const getClientById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const client = await clientService.getClientById(id, req.userId!, req.userRole as UserRole);
    res.status(200).json({ client });
  } catch (error) {
    next(error);
  }
};

export const createClient = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { companyName, nip, notes, addresses, salespersonPositionId } = req.body;

    if (!companyName) {
      next(new BadRequestError("companyName is required"));
      return;
    }

    if (!addresses || addresses.length === 0) {
      next(new BadRequestError("At least one address is required"));
      return;
    }

    const client = await clientService.createClient(
      { companyName, nip, notes, addresses, salespersonPositionId },
      req.userId!,
      req.userRole as UserRole,
    );

    res.status(201).json({ client });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { companyName, nip, notes, addresses } = req.body;

    const client = await clientService.updateClient(
      id,
      { companyName, nip, notes, addresses },
      req.userId!,
      req.userRole as UserRole,
    );

    res.status(200).json({ client });
  } catch (error) {
    next(error);
  }
};

export const updateClientStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { status, inactivityReason } = req.body;

    if (!status) {
      next(new BadRequestError("status is required"));
      return;
    }

    const client = await clientService.updateClientStatus(
      id,
      status,
      inactivityReason ?? null,
      req.userId!,
      req.userRole as UserRole,
    );

    res.status(200).json({ client });
  } catch (error) {
    next(error);
  }
};

export const requestArchive = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { reason } = req.body;

    if (!reason) {
      next(new BadRequestError("reason is required"));
      return;
    }

    const client = await clientService.requestArchive(
      id,
      reason,
      req.userId!,
      req.userRole as UserRole,
    );

    res.status(200).json({ client });
  } catch (error) {
    next(error);
  }
};

export const approveArchive = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const client = await clientService.approveArchive(id, req.userId!, req.userRole as UserRole);

    res.status(200).json({ client });
  } catch (error) {
    next(error);
  }
};

export const unarchiveClient = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const client = await clientService.unarchiveClient(id, req.userId!, req.userRole as UserRole);

    res.status(200).json({ client });
  } catch (error) {
    next(error);
  }
};
export const updateClientSalesperson = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { salespersonPositionId } = req.body;

    if (!salespersonPositionId) {
      next(new BadRequestError("salespersonPositionId is required"));
      return;
    }

    const client = await clientService.updateClientSalesperson(
      id,
      salespersonPositionId,
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(200).json({ client });
  } catch (error) {
    next(error);
  }
};

export const addNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { content } = req.body;

    if (!content) {
      next(new BadRequestError("content is required"));
      return;
    }

    const client = await clientService.addNote(id, content, req.userId!, req.userRole as UserRole);
    res.status(201).json({ client });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id, noteId } = req.params as { id: string; noteId: string };
    const { content } = req.body;

    if (!content) {
      next(new BadRequestError("content is required"));
      return;
    }

    const client = await clientService.updateNote(
      id,
      noteId,
      content,
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(200).json({ client });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id, noteId } = req.params as { id: string; noteId: string };
    const client = await clientService.deleteNote(
      id,
      noteId,
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(200).json({ client });
  } catch (error) {
    next(error);
  }
};

export const addAddress = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { label, street, city, postalCode } = req.body;

    if (!label || !street || !city || !postalCode) {
      next(new BadRequestError("label, street, city and postalCode are required"));
      return;
    }

    const client = await clientService.addAddress(
      id,
      { label, street, city, postalCode },
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(201).json({ client });
  } catch (error) {
    next(error);
  }
};

export const updateAddress = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
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
  } catch (error) {
    next(error);
  }
};

export const deleteAddress = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id, addressId } = req.params as { id: string; addressId: string };
    const client = await clientService.deleteAddress(
      id,
      addressId,
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(200).json({ client });
  } catch (error) {
    next(error);
  }
};

export const addContact = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id, addressId } = req.params as { id: string; addressId: string };
    const { firstName, lastName, phone, email } = req.body;

    if (!firstName || !lastName) {
      next(new BadRequestError("firstName and lastName are required"));
      return;
    }

    const client = await clientService.addContact(
      id,
      addressId,
      { firstName, lastName, phone: phone ?? null, email: email ?? null },
      req.userId!,
      req.userRole as UserRole,
    );
    res.status(201).json({ client });
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
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
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
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
  } catch (error) {
    next(error);
  }
};
