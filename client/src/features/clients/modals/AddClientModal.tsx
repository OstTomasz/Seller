import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal, ConfirmDialog } from "@/components/ui";
import type { UserRole } from "@/types";
import { NipCheckResult } from "@seller/shared/types";
import { useCreateClient } from "../hooks/useCreateClient";
import { useSalespersons } from "@/hooks/useSalespersons";
import { useConfirm } from "@/hooks/useConfirm";
import { useDiscardConfirm } from "@/hooks/useDiscardConfirm";
import { clientsApi } from "@/api/clients";
import { toast } from "sonner";
import { createClientSchema } from "../validation/schemas";
import {
  ArchivedClientModal,
  DeleteContactDialog,
  DetailsStep,
  NipStep,
  SalespersonStep,
} from "./AddClientModal.sections";

// ── Step type ─────────────────────────────────────────────────────────────────
type Step = "salesperson" | "nip" | "details";

export type AddClientFormValues = z.infer<ReturnType<typeof createClientSchema>>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
}

export interface ArchivedClientInfo {
  clientId: string;
  companyName: string;
}

// ── Default values ────────────────────────────────────────────────────────────

const defaultValues: AddClientFormValues = {
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
  const schema = useMemo(() => createClientSchema(showSalespersonSelect), [showSalespersonSelect]);
  const form = useForm<AddClientFormValues>({ resolver: zodResolver(schema), defaultValues });
  const {
    register,
    handleSubmit,
    reset,
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

  const submitConfirm = useConfirm<AddClientFormValues>((values) => {
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
  const nipValue = useWatch({ control, name: "nip" });

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

  const onSubmit = (values: AddClientFormValues) => {
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
            <SalespersonStep
              salespersonsLoading={salespersonsLoading}
              selectedSpId={selectedSpId}
              onSelect={setSelectedSpId}
              salespersons={salespersons}
              onNext={() => {
                form.setValue("salespersonPositionId", selectedSpId);
                setStep("nip");
              }}
            />
          )}

          {/* ── Step 2: NIP check ─────────────────────────────────── */}
          {step === "nip" && (
            <NipStep
              register={register}
              errors={errors}
              nipStatus={nipStatus}
              showSalespersonSelect={showSalespersonSelect}
              nipChecking={nipChecking}
              nipValue={nipValue}
              onBack={() => setStep("salesperson")}
              onNext={checkNipAndAdvance}
            />
          )}

          {/* ── Step 3: Details ───────────────────────────────────── */}
          {step === "details" && (
            <DetailsStep
              control={control}
              register={register}
              errors={errors}
              contactFields={contactFields}
              canDeleteContact={canDeleteContact}
              onDeleteContact={(idx) => deleteContactConfirm.ask(idx)}
              onAddContact={() =>
                appendContact({ firstName: "", lastName: "", phone: "", email: "" })
              }
              onBack={() => setStep("nip")}
              isPending={createClient.isPending}
            />
          )}
        </form>
      </Modal>

      <ArchivedClientModal
        archivedClient={archivedClient}
        unarchiveRequestSent={unarchiveRequestSent}
        onClose={() => {
          setArchivedClient(null);
          setUnarchiveRequestSent(false);
        }}
        onConfirm={handleRequestUnarchive}
      />

      <DeleteContactDialog
        isOpen={deleteContactConfirm.isOpen}
        onClose={deleteContactConfirm.cancel}
        onConfirm={deleteContactConfirm.confirm}
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
