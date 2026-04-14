import { Controller, useFieldArray } from "react-hook-form";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button, ConfirmDialog, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/hooks/useConfirm";
import type { EditAddressesFormValues } from "./EditAddressesModal";

const FieldError = ({ message }: { message?: string }) =>
  message ? <span className="min-h-4 text-xs text-red-400">{message}</span> : <span className="min-h-4" />;

interface AddressSectionProps {
  addrIdx: number;
  register: UseFormRegister<EditAddressesFormValues>;
  control: Control<EditAddressesFormValues>;
  errors: FieldErrors<EditAddressesFormValues>;
  canDelete: boolean;
  onDelete: () => void;
}

export const AddressSection = ({
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
          <Controller
            control={control}
            name={`addresses.${addrIdx}.postalCode`}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="00-000"
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 5);
                  const formatted =
                    digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits;
                  field.onChange(formatted);
                }}
              />
            )}
          />
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
