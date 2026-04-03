import { useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, Input, Button, ConfirmDialog } from "@/components/ui";

import { useFieldArray } from "react-hook-form";

import type { UserRole } from "@/types";
import { useCreateClient } from "./hooks/useCreateClient";
import { useSalespersons } from "@/hooks/useSalespersons";
import { useConfirm } from "@/hooks/useConfirm";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import { clientsApi } from "@/api/clients";
import { toast } from "sonner";
import { NipCheckResult } from "@seller/shared/types";

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

  const { remove: removeContact } = useFieldArray({ control, name: "address.contacts" });

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

  const onSubmit = async (values: FormValues) => {
    await createClient.mutateAsync({
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
    });
    resetModal();
    onClose();
  };

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
              {/* ... existing address + contacts JSX bez zmian ... */}
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
    </>
  );
};
