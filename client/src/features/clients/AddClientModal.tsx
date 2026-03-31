import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, Input, Button, ConfirmDialog } from "@/components/ui";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";
import { useCreateClient } from "./hooks/useCreateClient";
import { useSalespersons } from "@/hooks/useSalespersons";
import { useConfirm } from "@/hooks/useConfirm";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import { clientsApi } from "@/api/clients";
import { toast } from "sonner";

// ── Schemas ───────────────────────────────────────────────────────────────────

const contactSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  phone: z
    .string()
    .min(1, "Required")
    .regex(/^(\+48)?\d{9}$/, "9 digits, optionally with +48"),
  email: z.string().min(1, "Required").email("Invalid email"),
});

const addressSchema = z.object({
  label: z.string().min(1, "Required"),
  street: z.string().min(1, "Required"),
  postalCode: z
    .string()
    .min(1, "Required")
    .regex(/^\d{2}-\d{3}$/, "Format: XX-XXX"),
  city: z.string().min(1, "Required"),
  contacts: z.array(contactSchema).min(1, "At least one contact is required"),
});

const schema = z.object({
  companyName: z.string().min(1, "Required"),
  nip: z
    .string()
    .min(1, "Required")
    .regex(/^\d{10}$/, "NIP must be exactly 10 digits"),
  salespersonPositionId: z.string().optional(),
  address: addressSchema,
});

type FormValues = z.infer<typeof schema>;

// ── FieldError ────────────────────────────────────────────────────────────────

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <span className="min-h-4 text-xs text-red-400">{message}</span>
  ) : (
    <span className="min-h-4" />
  );

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs font-semibold text-celery-500 uppercase tracking-wider mb-3">
    {children}
  </h3>
);

// ── Props ─────────────────────────────────────────────────────────────────────

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
}

interface ArchivedClientInfo {
  clientId: string;
  companyName: string;
}

// ── Default values ────────────────────────────────────────────────────────────

const defaultValues: FormValues = {
  companyName: "",
  nip: "",
  salespersonPositionId: "",
  address: {
    label: "",
    street: "",
    postalCode: "",
    city: "",
    contacts: [{ firstName: "", lastName: "", phone: "", email: "" }],
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

export const AddClientModal = ({ isOpen, onClose, userRole }: AddClientModalProps) => {
  const [archivedClient, setArchivedClient] = useState<ArchivedClientInfo | null>(null);
  const [unarchiveRequestSent, setUnarchiveRequestSent] = useState(false);
  const createClient = useCreateClient();
  const { data: salespersons = [], isLoading: salespersonsLoading } = useSalespersons(userRole);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({ control, name: "address.contacts" });

  const discard = useDiscardConfirm(isDirty, () => {
    reset(defaultValues);
    onClose();
  });

  const deleteContactConfirm = useConfirm<number>((idx) => removeContact(idx));
  const canDeleteContact = contactFields.length > 1;

  const showSalespersonSelect =
    userRole === "deputy" || userRole === "director" || userRole === "advisor";

  const onSubmit = async (values: FormValues) => {
    const { data: nipCheck } = await clientsApi.checkNip(values.nip);
    if (nipCheck.archived && nipCheck.clientId && nipCheck.companyName) {
      setArchivedClient({ clientId: nipCheck.clientId, companyName: nipCheck.companyName });
      return;
    }

    await createClient.mutateAsync({
      companyName: values.companyName,
      nip: values.nip,
      addresses: [
        {
          label: values.address.label,
          street: values.address.street,
          postalCode: values.address.postalCode,
          city: values.address.city,
          contacts: values.address.contacts.map((c) => ({
            firstName: c.firstName,
            lastName: c.lastName,
            phone: c.phone,
            email: c.email,
          })),
        },
      ],
      salespersonPositionId: values.salespersonPositionId || undefined,
    });
    reset(defaultValues);
    onClose();
  };

  const handleRequestUnarchive = async () => {
    if (!archivedClient) return;
    try {
      await clientsApi.requestUnarchive(archivedClient.clientId);
      setArchivedClient(null);
      setUnarchiveRequestSent(false);
      onClose();
      toast.success("Unarchive request sent to director");
    } catch {
      toast.error("Failed to send request");
    }
  };
  return (
    <>
      {/* proper client modal */}
      <Modal isOpen={isOpen} onClose={discard.tryClose} title="Add client" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 max-h-[60vh] overflow-y-auto pr-1">
            {/* ── Basic info ──────────────────────────────────────────── */}
            <section>
              <SectionTitle>Basic information</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-celery-500">Company name</label>
                  <Input {...register("companyName")} placeholder="Company name" />
                  <FieldError message={errors.companyName?.message} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-celery-500">NIP</label>
                  <Input {...register("nip")} placeholder="0000000000" />
                  <FieldError message={errors.nip?.message} />
                </div>
              </div>
            </section>

            {/* ── Salesperson (zależne od roli) ────────────────────── */}
            {showSalespersonSelect ? (
              <section>
                <SectionTitle>Assignment</SectionTitle>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-celery-500">Salesperson</label>
                  {salespersonsLoading ? (
                    <span className="text-xs text-celery-600">Loading...</span>
                  ) : (
                    <select
                      {...register("salespersonPositionId")}
                      className="w-full rounded-lg bg-bg-elevated border border-celery-700
                                 px-3 py-2 text-sm text-celery-200
                                 focus:outline-none focus:border-celery-500"
                    >
                      <option value="">Select salesperson...</option>
                      {salespersons.map((u) => {
                        if (!u.position) return null;
                        const regionName = u.position.region?.name ?? "";
                        return (
                          <option key={u._id} value={u.position._id}>
                            {u.firstName} {u.lastName} ({u.position.code})
                            {regionName ? ` — ${regionName}` : ""}
                          </option>
                        );
                      })}
                    </select>
                  )}
                  <FieldError message={errors.salespersonPositionId?.message} />
                </div>
              </section>
            ) : null}

            {/* ── Address ─────────────────────────────────────────────── */}
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
                    <Input {...register("address.postalCode")} placeholder="00-000" />
                    <FieldError message={errors.address?.postalCode?.message} />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-xs text-celery-500">City</label>
                    <Input {...register("address.city")} placeholder="City" />
                    <FieldError message={errors.address?.city?.message} />
                  </div>
                </div>

                {/* ── Contacts ──────────────────────────────────────── */}
                <div className="flex flex-col gap-3">
                  <span className="text-xs text-celery-600 font-medium">Contacts</span>
                  {contactFields.map((contactField, idx) => (
                    <div
                      key={contactField.id}
                      className="grid grid-cols-2 gap-2 pl-3 border-l-2 border-celery-700"
                    >
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-celery-500">First name</label>
                        <Input
                          {...register(`address.contacts.${idx}.firstName`)}
                          placeholder="First name"
                        />
                        <FieldError message={errors.address?.contacts?.[idx]?.firstName?.message} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-celery-500">Last name</label>
                        <Input
                          {...register(`address.contacts.${idx}.lastName`)}
                          placeholder="Last name"
                        />
                        <FieldError message={errors.address?.contacts?.[idx]?.lastName?.message} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-celery-500">Phone</label>
                        <Input
                          {...register(`address.contacts.${idx}.phone`)}
                          placeholder="+48 000 000 000"
                        />
                        <FieldError message={errors.address?.contacts?.[idx]?.phone?.message} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-celery-500">Email</label>
                        <Input
                          {...register(`address.contacts.${idx}.email`)}
                          placeholder="email@example.com"
                        />
                        <FieldError message={errors.address?.contacts?.[idx]?.email?.message} />
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
                          onClick={() => deleteContactConfirm.ask(idx)}
                        >
                          <Trash2 size={12} className="mr-1" />
                          Remove contact
                        </Button>
                      </div>
                    </div>
                  ))}
                  <FieldError message={errors.address?.contacts?.root?.message} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="self-start text-celery-600 hover:text-celery-400 text-xs"
                    onClick={() =>
                      appendContact({ firstName: "", lastName: "", phone: "", email: "" })
                    }
                  >
                    <Plus size={12} className="mr-1" />
                    Add contact
                  </Button>
                </div>
              </div>
            </section>
          </div>

          {/* ── Actions ─────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
            <Button
              type="button"
              variant="ghost"
              onClick={discard.tryClose}
              disabled={createClient.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createClient.isPending}>
              {createClient.isPending ? "Creating..." : "Add client"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* archived client modal */}
      <Modal
        isOpen={archivedClient !== null}
        onClose={() => {
          setArchivedClient(null);
          setUnarchiveRequestSent(false);
        }}
        title="Client is archived"
        size="sm"
      >
        <div className="flex flex-col gap-6">
          {unarchiveRequestSent ? (
            <p className="text-sm text-celery-300">
              Your request has been sent to the director. You will be notified when the client is
              unarchived.
            </p>
          ) : (
            <>
              <p className="text-sm text-celery-400">
                A client with this NIP already exists in the archive:
                <span className="block mt-1 text-celery-200 font-medium">
                  {archivedClient?.companyName}
                </span>
              </p>
              <p className="text-sm text-celery-500">
                Would you like to send an unarchive request to the director?
              </p>
            </>
          )}
          <div className="flex justify-end gap-3 pt-2 border-t border-celery-700">
            <Button
              variant="ghost"
              onClick={() => {
                setArchivedClient(null);
                setUnarchiveRequestSent(false);
              }}
            >
              {unarchiveRequestSent ? "Close" : "Cancel"}
            </Button>
            {unarchiveRequestSent ? null : (
              <Button onClick={handleRequestUnarchive}>Send unarchive request</Button>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteContactConfirm.isOpen}
        onClose={deleteContactConfirm.cancel}
        onConfirm={deleteContactConfirm.confirm}
        title="Delete contact"
        description="Are you sure you want to delete this contact?"
      />
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
