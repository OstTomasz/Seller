import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Modal, Button, ConfirmDialog } from "@/components/ui";
import type { Client } from "@/types";
import { clientsApi } from "@/api/clients";
import {
  useAddAddress,
  useUpdateAddress,
  useDeleteAddress,
  useAddContact,
  useUpdateContact,
  useDeleteContact,
} from "../hooks/useUpdateClient";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import { clientAddressSchema } from "../validation/schemas";
import { AddressSection } from "./EditAddressesModal.sections";

// ── Schemas ───────────────────────────────────────────────────────────────────

const schema = z.object({ addresses: z.array(clientAddressSchema) });
export type EditAddressesFormValues = z.infer<typeof schema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface EditAddressesModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

const toFormValues = (c: Client): EditAddressesFormValues => ({
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
  } = useForm<EditAddressesFormValues>({
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
    reset();
    onClose();
  });

  const onSubmit = async (values: EditAddressesFormValues) => {
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
      <Modal isOpen={isOpen} onClose={discard.tryClose} title="Edit adresses" size="lg">
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
