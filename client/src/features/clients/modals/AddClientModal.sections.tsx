import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button, ConfirmDialog, Input, Modal, Select } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { User } from "@/types";
import type { NipCheckResult } from "@seller/shared/types";
import type { AddClientFormValues, ArchivedClientInfo } from "./AddClientModal";

export const FieldError = ({ message }: { message?: string }) =>
  message ? <span className="min-h-4 text-xs text-red-400">{message}</span> : <span className="min-h-4" />;

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs font-semibold text-celery-500 uppercase tracking-wider mb-3">{children}</h3>
);

interface SalespersonStepProps {
  salespersonsLoading: boolean;
  selectedSpId: string;
  onSelect: (value: string) => void;
  salespersons: User[];
  onNext: () => void;
}

export const SalespersonStep = ({
  salespersonsLoading,
  selectedSpId,
  onSelect,
  salespersons,
  onNext,
}: SalespersonStepProps) => (
  <section className="flex flex-col gap-4">
    <SectionTitle>Select salesperson</SectionTitle>
    <div className="flex flex-col gap-1">
      <label className="text-xs text-celery-500">Salesperson</label>
      {salespersonsLoading ? (
        <span className="text-xs text-celery-600">Loading...</span>
      ) : (
        <Select
          value={selectedSpId}
          onChange={(e) => onSelect(e.target.value)}
          placeholder="Select salesperson..."
          placeholderDisabled={false}
          surface="elevated"
          hideErrorSpace
          options={salespersons
            .filter((user) => Boolean(user.position))
            .map((user) => {
              const regionName = user.position?.region?.name ?? "";
              return {
                value: user.position?._id ?? "",
                label: `${user.firstName} ${user.lastName} (${user.position?.code ?? ""})${regionName ? ` — ${regionName}` : ""}`,
              };
            })}
        />
      )}
    </div>
    <div className="flex justify-end pt-2 border-t border-celery-700">
      <Button type="button" disabled={!selectedSpId} onClick={onNext}>
        Next
      </Button>
    </div>
  </section>
);

interface NipStepProps {
  register: UseFormRegister<AddClientFormValues>;
  errors: FieldErrors<AddClientFormValues>;
  nipStatus: NipCheckResult | null;
  showSalespersonSelect: boolean;
  nipChecking: boolean;
  nipValue: string;
  onBack: () => void;
  onNext: () => void;
}

export const NipStep = ({
  register,
  errors,
  nipStatus,
  showSalespersonSelect,
  nipChecking,
  nipValue,
  onBack,
  onNext,
}: NipStepProps) => (
  <section className="flex flex-col gap-4">
    <SectionTitle>Basic information</SectionTitle>
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-celery-500">Company name</label>
        <Input {...register("companyName")} placeholder="Company name" />
        <FieldError message={errors.companyName?.message} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-celery-500">NIP</label>
        <Input {...register("nip")} placeholder="0123456789" />
        <FieldError message={errors.nip?.message} />
      </div>
    </div>
    {nipStatus?.status === "active" && (
      <p className="text-sm text-yellow-400">
        {nipStatus.companyName} is already connected with {nipStatus.salespersonName}.
      </p>
    )}
    <div className="flex justify-between pt-2 border-t border-celery-700">
      {showSalespersonSelect ? (
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
      ) : null}
      <Button
        type="button"
        className="ml-auto"
        disabled={nipChecking || !/^\d{10}$/.test(nipValue ?? "")}
        onClick={onNext}
      >
        {nipChecking ? "Checking..." : "Next"}
      </Button>
    </div>
  </section>
);

interface DetailsStepProps {
  control: Control<AddClientFormValues>;
  register: UseFormRegister<AddClientFormValues>;
  errors: FieldErrors<AddClientFormValues>;
  contactFields: Array<{ id: string }>;
  canDeleteContact: boolean;
  onDeleteContact: (idx: number) => void;
  onAddContact: () => void;
  onBack: () => void;
  isPending: boolean;
}

export const DetailsStep = ({
  control,
  register,
  errors,
  contactFields,
  canDeleteContact,
  onDeleteContact,
  onAddContact,
  onBack,
  isPending,
}: DetailsStepProps) => (
  <>
    <div className="flex flex-col gap-6 max-h-[60vh] overflow-y-auto pr-1">
      <section>
        <SectionTitle>Address</SectionTitle>
        <div className="flex flex-col gap-4 p-4 rounded-lg border border-celery-700">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs text-celery-500">Label</label>
              <Input {...register("address.label")} placeholder="e.g. HQ, Warehouse" />
              <FieldError message={errors.address?.label?.message} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-celery-500">Street</label>
              <Input {...register("address.street")} placeholder="Street" />
              <FieldError message={errors.address?.street?.message} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-celery-500">Postal code</label>
              <Controller
                control={control}
                name="address.postalCode"
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="00-000"
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 5);
                      field.onChange(raw.length > 2 ? `${raw.slice(0, 2)}-${raw.slice(2)}` : raw);
                    }}
                  />
                )}
              />
              <FieldError message={errors.address?.postalCode?.message} />
            </div>
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs text-celery-500">City</label>
              <Input {...register("address.city")} placeholder="City" />
              <FieldError message={errors.address?.city?.message} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-xs text-celery-600 font-medium">Contacts</span>
            {contactFields.map((contactField, idx) => (
              <div key={contactField.id} className="grid grid-cols-2 gap-2 pl-3 border-l-2 border-celery-700">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-celery-500">First name</label>
                  <Input {...register(`address.contacts.${idx}.firstName`)} placeholder="First name" />
                  <FieldError message={errors.address?.contacts?.[idx]?.firstName?.message} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-celery-500">Last name</label>
                  <Input {...register(`address.contacts.${idx}.lastName`)} placeholder="Last name" />
                  <FieldError message={errors.address?.contacts?.[idx]?.lastName?.message} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-celery-500">Phone</label>
                  <Input {...register(`address.contacts.${idx}.phone`)} placeholder="+48 000 000 000" />
                  <FieldError message={errors.address?.contacts?.[idx]?.phone?.message} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-celery-500">Email</label>
                  <Input {...register(`address.contacts.${idx}.email`)} placeholder="email@example.com" />
                  <FieldError message={errors.address?.contacts?.[idx]?.email?.message} />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "text-xs",
                      canDeleteContact ? "text-red-400 hover:text-red-300" : "text-celery-700 cursor-not-allowed",
                    )}
                    disabled={!canDeleteContact}
                    onClick={() => onDeleteContact(idx)}
                  >
                    <Trash2 size={12} className="mr-1" />
                    Remove contact
                  </Button>
                </div>
              </div>
            ))}
            <FieldError message={errors.address?.contacts?.root?.message} />
            <Button type="button" variant="ghost" size="sm" className="self-start text-celery-600 hover:text-celery-400 text-xs" onClick={onAddContact}>
              <Plus size={12} className="mr-1" />
              Add contact
            </Button>
          </div>
        </div>
      </section>
    </div>
    <div className="flex justify-between pt-2 border-t border-celery-700">
      <Button type="button" variant="ghost" onClick={onBack}>
        Back
      </Button>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Add client"}
      </Button>
    </div>
  </>
);

interface ArchivedClientModalProps {
  archivedClient: ArchivedClientInfo | null;
  unarchiveRequestSent: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ArchivedClientModal = ({
  archivedClient,
  unarchiveRequestSent,
  onClose,
  onConfirm,
}: ArchivedClientModalProps) => (
  <Modal isOpen={archivedClient !== null} onClose={onClose} title="Client is archived" size="sm">
    <div className="flex flex-col gap-6">
      {unarchiveRequestSent ? (
        <p className="text-sm text-celery-300">
          Your request has been sent to the director. You will be notified when the client is unarchived.
        </p>
      ) : (
        <>
          <p className="text-sm text-celery-400">
            A client with this NIP already exists in the archive:
            <span className="block mt-1 text-celery-200 font-medium">{archivedClient?.companyName}</span>
          </p>
          <p className="text-sm text-celery-500">Would you like to send an unarchive request to the director?</p>
        </>
      )}
      <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
        <Button variant="ghost" onClick={onClose}>
          {unarchiveRequestSent ? "Close" : "Cancel"}
        </Button>
        {unarchiveRequestSent ? null : <Button onClick={onConfirm}>Send unarchive request</Button>}
      </div>
    </div>
  </Modal>
);

export const DeleteContactDialog = ({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => (
  <ConfirmDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Delete contact"
    description="Are you sure you want to delete this contact?"
  />
);
