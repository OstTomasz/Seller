import { Controller, useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal, Input, Button, ConfirmDialog } from "@/components/ui";
import type { UserRole } from "@/types";
import { NipCheckResult } from "@seller/shared/types";
import { useCreateClient } from "./hooks/useCreateClient";
import { useSalespersons } from "@/hooks/useSalespersons";
import { useConfirm } from "@/hooks/useConfirm";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import { clientsApi } from "@/api/clients";
import { toast } from "sonner";

// ── Step type ─────────────────────────────────────────────────────────────────
type Step = "salesperson" | "nip" | "details";

// ── Schemas ───────────────────────────────────────────
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

/** Factory — walidacja salesperson zależna od roli */
const createSchema = (requiresSalesperson: boolean) =>
  z.object({
    companyName: z.string().min(1, "Required"),
    nip: z
      .string()
      .min(1, "Required")
      .regex(/^\d{10}$/, "NIP must be exactly 10 digits"),
    salespersonPositionId: requiresSalesperson
      ? z.string().min(1, "Salesperson is required")
      : z.string().optional(),
    address: addressSchema,
  });

type FormValues = z.infer<ReturnType<typeof createSchema>>;

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
  // ── Step state ────────────────────────────────────────────────────────────
  const initialStep: Step = userRole === "salesperson" ? "nip" : "salesperson";
  const [step, setStep] = useState<Step>(initialStep);
  const [selectedSpId, setSelectedSpId] = useState("");
  const [nipStatus, setNipStatus] = useState<NipCheckResult | null>(null);
  const [nipChecking, setNipChecking] = useState(false);

  // ── Archive state ─────────────────────────────────────────────────────────
  const [archivedClient, setArchivedClient] = useState<ArchivedClientInfo | null>(null);
  const [unarchiveRequestSent, setUnarchiveRequestSent] = useState(false);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const createClient = useCreateClient();
  const showSalespersonSelect = userRole !== "salesperson";
  const { data: salespersons = [], isLoading: salespersonsLoading } = useSalespersons(userRole);

  // ── Form ──────────────────────────────────────────────────────────────────
  const schema = useMemo(() => createSchema(showSalespersonSelect), [showSalespersonSelect]);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });
  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isDirty },
  } = form;

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({ control, name: "address.contacts" });

  // ── Reset helpers ─────────────────────────────────────────────────────────
  const resetModal = () => {
    reset(defaultValues);
    setStep(initialStep);
    setSelectedSpId("");
    setNipStatus(null);
  };

  // ── Confirm hooks ─────────────────────────────────────────────────────────
  const discard = useDiscardConfirm(isDirty, () => {
    resetModal();
    onClose();
  });
  const deleteContactConfirm = useConfirm<number>((idx) => removeContact(idx));

  const submitConfirm = useConfirm<FormValues>((values) => {
    void createClient
      .mutateAsync({
        companyName: values.companyName,
        nip: values.nip,
        addresses: [
          {
            label: values.address.label,
            street: values.address.street,
            postalCode: values.address.postalCode,
            city: values.address.city,
            contacts: values.address.contacts,
          },
        ],
        salespersonPositionId: values.salespersonPositionId || undefined,
      })
      .then(() => {
        resetModal();
        onClose();
      });
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const nipValue = watch("nip");

  const checkNipAndAdvance = async () => {
    if (!/^\d{10}$/.test(nipValue)) return;
    setNipChecking(true);
    try {
      const spId = showSalespersonSelect ? selectedSpId : undefined;
      const { data: result } = await clientsApi.checkNip(nipValue, spId || undefined);
      setNipStatus(result);
      if (result.status === "free") setStep("details");
      else if (result.status === "archived") {
        setArchivedClient({ clientId: result.clientId, companyName: result.companyName });
      }
    } finally {
      setNipChecking(false);
    }
  };

  const onSubmit = (values: FormValues) => {
    submitConfirm.ask(values);
  };

  const canDeleteContact = contactFields.length > 1;

  const handleRequestUnarchive = async () => {
    if (!archivedClient) return;
    try {
      await clientsApi.requestUnarchive(archivedClient.clientId);
      setArchivedClient(null);
      setUnarchiveRequestSent(false);
      resetModal();
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
          {/* ── Step 1: Salesperson ───────────────────────────────── */}
          {step === "salesperson" && (
            <section className="flex flex-col gap-4">
              <SectionTitle>Select salesperson</SectionTitle>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-celery-500">Salesperson</label>
                {salespersonsLoading ? (
                  <span className="text-xs text-celery-600">Loading...</span>
                ) : (
                  <select
                    value={selectedSpId}
                    onChange={(e) => setSelectedSpId(e.target.value)}
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
              </div>
              <div className="flex justify-end pt-2 border-t border-celery-700">
                <Button
                  type="button"
                  disabled={!selectedSpId}
                  onClick={() => {
                    form.setValue("salespersonPositionId", selectedSpId);
                    setStep("nip");
                  }}
                >
                  Next
                </Button>
              </div>
            </section>
          )}

          {/* ── Step 2: NIP check ─────────────────────────────────── */}
          {step === "nip" && (
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

              {/* NIP status feedback */}
              {nipStatus?.status === "active" && (
                <p className="text-sm text-yellow-400">
                  {nipStatus.companyName} is already connected with {nipStatus.salespersonName}.
                </p>
              )}

              <div className="flex justify-between pt-2 border-t border-celery-700">
                {showSalespersonSelect && (
                  <Button type="button" variant="ghost" onClick={() => setStep("salesperson")}>
                    Back
                  </Button>
                )}
                <Button
                  type="button"
                  className="ml-auto"
                  disabled={nipChecking || !/^\d{10}$/.test(nipValue ?? "")}
                  onClick={checkNipAndAdvance}
                >
                  {nipChecking ? "Checking..." : "Next"}
                </Button>
              </div>
            </section>
          )}

          {/* ── Step 3: Details ───────────────────────────────────── */}
          {step === "details" && (
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
                                const formatted =
                                  raw.length > 2 ? `${raw.slice(0, 2)}-${raw.slice(2)}` : raw;
                                field.onChange(formatted);
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
                            <FieldError
                              message={errors.address?.contacts?.[idx]?.firstName?.message}
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs text-celery-500">Last name</label>
                            <Input
                              {...register(`address.contacts.${idx}.lastName`)}
                              placeholder="Last name"
                            />
                            <FieldError
                              message={errors.address?.contacts?.[idx]?.lastName?.message}
                            />
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

              <div className="flex justify-between pt-2 border-t border-celery-700">
                <Button type="button" variant="ghost" onClick={() => setStep("nip")}>
                  Back
                </Button>
                <Button type="submit" disabled={createClient.isPending}>
                  {createClient.isPending ? "Creating..." : "Add client"}
                </Button>
              </div>
            </>
          )}
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
      <ConfirmDialog
        isOpen={submitConfirm.isOpen}
        onClose={submitConfirm.cancel}
        onConfirm={submitConfirm.confirm}
        title="Add client?"
        description={`Create client "${submitConfirm.payload?.companyName}"?`}
        confirmLabel="Add client"
        isLoading={createClient.isPending}
      />
    </>
  );
};
