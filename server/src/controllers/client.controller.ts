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
    const clients = await clientService.getClients(
      req.userId!,
      req.userRole as UserRole,
    );
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
    const client = await clientService.getClientById(
      id,
      req.userId!,
      req.userRole as UserRole,
    );
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
    const { companyName, nip, notes, addresses, salespersonPositionId } =
      req.body;

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

    const client = await clientService.approveArchive(
      id,
      req.userId!,
      req.userRole as UserRole,
    );

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

    const client = await clientService.unarchiveClient(
      id,
      req.userId!,
      req.userRole as UserRole,
    );

    res.status(200).json({ client });
  } catch (error) {
    next(error);
  }
};
