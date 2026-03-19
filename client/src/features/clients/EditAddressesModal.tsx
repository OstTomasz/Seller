import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Modal, Input, Button, ConfirmDialog } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Client } from "@/types";
import type { UseFormRegister, Control, FieldErrors } from "react-hook-form";
import { clientsApi } from "@/api/clients";
import { useConfirm } from "@/hooks/useConfirm";
import {
  useAddAddress,
  useUpdateAddress,
  useDeleteAddress,
  useAddContact,
  useUpdateContact,
  useDeleteContact,
} from "./hooks/useUpdateClient";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";

// ── Schemas ───────────────────────────────────────────────────────────────────

const contactSchema = z.object({
  _id: z.string().optional(),
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  phone: z
    .string()
    .min(1, "Required")
    .regex(/^(\+48)?\d{9}$/, "9 digits, optionally with +48"),
  email: z.email("Invalid email").min(1, "Required"),
});

const addressSchema = z.object({
  _id: z.string().optional(),
  label: z.string().min(1, "Required"),
  street: z.string().min(1, "Required"),
  postalCode: z
    .string()
    .min(1, "Required")
    .regex(/^\d{2}-\d{3}$/, "Format: XX-XXX"),
  city: z.string().min(1, "Required"),
  contacts: z.array(contactSchema).min(1, "At least one contact is required"),
});

const schema = z.object({ addresses: z.array(addressSchema) });
type FormValues = z.infer<typeof schema>;

// ── FieldError ────────────────────────────────────────────────────────────────

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <span className="min-h-4 text-xs text-red-400">{message}</span>
  ) : (
    <span className="min-h-4" />
  );

// ── Props ─────────────────────────────────────────────────────────────────────

interface EditAddressesModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

const toFormValues = (c: Client): FormValues => ({
  addresses: c.addresses.map((a) => ({
    _id: a._id,
    label: a.label,
    street: a.street,
    postalCode: a.postalCode,
    city: a.city,
    contacts: a.contacts.map((ct) => ({
      _id: ct._id,
      firstName: ct.firstName,
      lastName: ct.lastName,
      phone: ct.phone ?? "",
      email: ct.email ?? "",
    })),
  })),
});

// ── Component ─────────────────────────────────────────────────────────────────

export const EditAddressesModal = ({ isOpen, onClose, client }: EditAddressesModalProps) => {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(client),
  });

  const {
    fields: addressFields,
    append: appendAddress,
    remove: removeAddress,
  } = useFieldArray({ control, name: "addresses" });

  useEffect(() => {
    reset(toFormValues(client));
  }, [client, reset]);

  const addAddress = useAddAddress(client._id);
  const updateAddress = useUpdateAddress(client._id);
  const deleteAddress = useDeleteAddress(client._id);
  const addContact = useAddContact(client._id);
  const updateContact = useUpdateContact(client._id);
  const deleteContact = useDeleteContact(client._id);

  const isPending =
    addAddress.isPending ||
    updateAddress.isPending ||
    deleteAddress.isPending ||
    addContact.isPending ||
    updateContact.isPending ||
    deleteContact.isPending;

  const discard = useDiscardConfirm(isDirty, () => {
    reset(); // przywróć wartości formularza
    onClose();
  });

  const onSubmit = async (values: FormValues) => {
    // Deleted addresses
    for (const original of client.addresses) {
      const stillExists = values.addresses.some((a) => a._id === original._id);
      if (!stillExists) {
        await deleteAddress.mutateAsync(original._id);
      }
    }

    for (const addr of values.addresses) {
      let resolvedAddressId: string;

      if (!addr._id) {
        const { data } = await clientsApi.addAddress(client._id, {
          label: addr.label,
          street: addr.street,
          postalCode: addr.postalCode,
          city: addr.city,
        });
        const created = data.client.addresses[data.client.addresses.length - 1];
        if (!created) continue;
        resolvedAddressId = created._id;
      } else {
        resolvedAddressId = addr._id;
        const original = client.addresses.find((a) => a._id === addr._id);
        if (original) {
          const addrChanged =
            addr.label !== original.label ||
            addr.street !== original.street ||
            addr.postalCode !== original.postalCode ||
            addr.city !== original.city;

          if (addrChanged) {
            await updateAddress.mutateAsync({
              addressId: addr._id,
              payload: {
                label: addr.label,
                street: addr.street,
                postalCode: addr.postalCode,
                city: addr.city,
              },
            });
          }
        }
      }

      const originalAddress = client.addresses.find((a) => a._id === addr._id);

      if (originalAddress) {
        for (const originalContact of originalAddress.contacts) {
          const stillExists = addr.contacts.some((c) => c._id === originalContact._id);
          if (!stillExists) {
            await deleteContact.mutateAsync({
              addressId: resolvedAddressId,
              contactId: originalContact._id,
            });
          }
        }
      }

      for (const contact of addr.contacts) {
        if (!contact._id) {
          await addContact.mutateAsync({
            addressId: resolvedAddressId,
            payload: {
              firstName: contact.firstName,
              lastName: contact.lastName,
              phone: contact.phone || null,
              email: contact.email || null,
            },
          });
        } else {
          const originalContact = originalAddress?.contacts.find((c) => c._id === contact._id);
          if (!originalContact) continue;

          const contactChanged =
            contact.firstName !== originalContact.firstName ||
            contact.lastName !== originalContact.lastName ||
            (contact.phone || null) !== originalContact.phone ||
            (contact.email || null) !== originalContact.email;

          if (contactChanged) {
            await updateContact.mutateAsync({
              addressId: resolvedAddressId,
              contactId: contact._id,
              payload: {
                firstName: contact.firstName,
                lastName: contact.lastName,
                phone: contact.phone || null,
                email: contact.email || null,
              },
            });
          }
        }
      }
    }
    reset(values);
    onClose();
  };

  const canDeleteAddress = addressFields.length > 1;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={discard.tryClose}
        disableOutsideClick={true}
        title="Edit adresses"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 max-h-[60vh] overflow-y-auto pr-1">
            {addressFields.map((addressField, addrIdx) => (
              <AddressSection
                key={addressField.id}
                addrIdx={addrIdx}
                register={register}
                control={control}
                errors={errors}
                canDelete={canDeleteAddress}
                onDelete={() => removeAddress(addrIdx)}
              />
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start text-celery-500"
              onClick={() =>
                appendAddress({
                  label: "",
                  street: "",
                  postalCode: "",
                  city: "",
                  contacts: [{ firstName: "", lastName: "", phone: "", email: "" }],
                })
              }
            >
              <Plus size={14} className="mr-1" />
              Add address
            </Button>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
            <Button type="button" variant="ghost" onClick={discard.tryClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !isDirty}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={discard.isOpen}
        onClose={discard.cancel}
        onConfirm={discard.confirm}
        title="Discard changes?"
        description="You have unsaved changes. Are you sure you want to discard them?"
        confirmLabel="Discard"
      />
    </>
  );
};

// ── AddressSection ────────────────────────────────────────────────────────────

interface AddressSectionProps {
  addrIdx: number;
  register: UseFormRegister<FormValues>;
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  canDelete: boolean;
  onDelete: () => void;
}

const AddressSection = ({
  addrIdx,
  register,
  control,
  errors,
  canDelete,
  onDelete,
}: AddressSectionProps) => {
  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({ control, name: `addresses.${addrIdx}.contacts` });

  const deleteAddressConfirm = useConfirm<void>(() => onDelete());
  const deleteContactConfirm = useConfirm((idx: number) => removeContact(idx));

  const addrErrors = errors.addresses?.[addrIdx];
  const canDeleteContact = contactFields.length > 1;

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg border border-celery-700">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-celery-400 uppercase tracking-wider">
          Address {addrIdx + 1}
        </span>
        {canDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300 p-1"
            onClick={() => deleteAddressConfirm.ask()}
          >
            <Trash2 size={14} />
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-xs text-celery-500">Label</label>
          <Input {...register(`addresses.${addrIdx}.label`)} placeholder="e.g. HQ, Warehouse" />
          <FieldError message={addrErrors?.label?.message} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-celery-500">Street</label>
          <Input {...register(`addresses.${addrIdx}.street`)} placeholder="Street" />
          <FieldError message={addrErrors?.street?.message} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-celery-500">Postal code</label>
          <Input {...register(`addresses.${addrIdx}.postalCode`)} placeholder="00-000" />
          <FieldError message={addrErrors?.postalCode?.message} />
        </div>
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-xs text-celery-500">City</label>
          <Input {...register(`addresses.${addrIdx}.city`)} placeholder="City" />
          <FieldError message={addrErrors?.city?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-xs text-celery-600 font-medium">Contacts</span>
        {contactFields.map((contactField, contactIdx) => (
          <div
            key={contactField.id}
            className="grid grid-cols-2 gap-2 pl-3 border-l-2 border-celery-700"
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs text-celery-500">First name</label>
              <Input
                {...register(`addresses.${addrIdx}.contacts.${contactIdx}.firstName`)}
                placeholder="First name"
              />
              <FieldError message={addrErrors?.contacts?.[contactIdx]?.firstName?.message} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-celery-500">Last name</label>
              <Input
                {...register(`addresses.${addrIdx}.contacts.${contactIdx}.lastName`)}
                placeholder="Last name"
              />
              <FieldError message={addrErrors?.contacts?.[contactIdx]?.lastName?.message} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-celery-500">Phone</label>
              <Input
                {...register(`addresses.${addrIdx}.contacts.${contactIdx}.phone`)}
                placeholder="+48 000 000 000"
              />
              <FieldError message={addrErrors?.contacts?.[contactIdx]?.phone?.message} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-celery-500">Email</label>
              <Input
                {...register(`addresses.${addrIdx}.contacts.${contactIdx}.email`)}
                placeholder="email@example.com"
              />
              <FieldError message={addrErrors?.contacts?.[contactIdx]?.email?.message} />
            </div>
            <div className="col-span-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "text-xs",
                  canDeleteContact
                    ? "text-red-400 hover:text-red-300"
                    : "text-celery-700 cursor-not-allowed",
                )}
                disabled={!canDeleteContact}
                onClick={() => deleteContactConfirm.ask(contactIdx)}
              >
                <Trash2 size={12} className="mr-1" />
                Remove contact
              </Button>
            </div>
          </div>
        ))}
        <FieldError message={addrErrors?.contacts?.root?.message} />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start text-celery-600 hover:text-celery-400 text-xs"
          onClick={() => appendContact({ firstName: "", lastName: "", phone: "", email: "" })}
        >
          <Plus size={12} className="mr-1" />
          Add contact
        </Button>
      </div>

      <ConfirmDialog
        isOpen={deleteAddressConfirm.isOpen}
        onClose={deleteAddressConfirm.cancel}
        onConfirm={deleteAddressConfirm.confirm}
        title="Delete address"
        description="Are you sure you want to delete this address? All contacts assigned to it will also be removed."
      />
      <ConfirmDialog
        isOpen={deleteContactConfirm.isOpen}
        onClose={deleteContactConfirm.cancel}
        onConfirm={deleteContactConfirm.confirm}
        title="Delete contact"
        description="Are you sure you want to delete this contact?"
      />
    </div>
  );
};
