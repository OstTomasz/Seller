import { z } from "zod";

export const clientContactSchema = z.object({
  _id: z.string().optional(),
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  phone: z
    .string()
    .min(1, "Required")
    .regex(/^(\+48)?\d{9}$/, "9 digits, optionally with +48"),
  email: z.string().min(1, "Required").email("Invalid email"),
});

export const clientAddressSchema = z.object({
  _id: z.string().optional(),
  label: z.string().min(1, "Required"),
  street: z.string().min(1, "Required"),
  postalCode: z
    .string()
    .min(1, "Required")
    .regex(/^\d{2}-\d{3}$/, "Format: XX-XXX"),
  city: z.string().min(1, "Required"),
  contacts: z.array(clientContactSchema).min(1, "At least one contact is required"),
});

export const clientBasicSchema = z.object({
  companyName: z.string().min(1, "Required"),
  nip: z
    .string()
    .min(1, "Required")
    .regex(/^\d{10}$/, "NIP must be exactly 10 digits"),
});

export const createClientSchema = (requiresSalesperson: boolean) =>
  z.object({
    ...clientBasicSchema.shape,
    salespersonPositionId: requiresSalesperson
      ? z.string().min(1, "Salesperson is required")
      : z.string().optional(),
    address: clientAddressSchema.omit({ _id: true }),
  });
