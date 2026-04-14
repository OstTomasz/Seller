import { Button, Card, LabeledField, SectionHeader } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { FileText, Mail, MapPin, Pencil, Phone, Users, Clock } from "lucide-react";
import type { Client, INoteAuthor, UserRole } from "@/types";

const getNoteAuthor = (createdBy: string | INoteAuthor | null): string => {
  if (!createdBy || typeof createdBy === "string") return "Unknown";
  return `${createdBy.firstName} ${createdBy.lastName}`;
};

interface AddressesCardProps {
  client: Client;
  onEdit: () => void;
}

export const AddressesCard = ({ client, onEdit }: AddressesCardProps) => (
  <Card>
    <div className="flex justify-between items-center mb-4">
      <SectionHeader icon={MapPin} title="Addresses" />
      <Button variant="ghost" size="sm" onClick={onEdit} className="text-celery-500 hover:text-celery-300">
        <Pencil size={14} />
      </Button>
    </div>
    {client.addresses.length === 0 ? (
      <p className="text-sm text-celery-600">No addresses</p>
    ) : (
      <div className="flex flex-col gap-10">
        {client.addresses.map((address) => (
          <div key={address._id} className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-celery-500 uppercase tracking-wider mx-auto">
              {address.label}
            </span>
            <div className="flex flex-col gap-8">
              <div className="w-[90%] max-w-md flex justify-between gap-3 mx-auto">
                <LabeledField label="Street" value={address.street} />
                <LabeledField label="Postal code" value={address.postalCode} />
                <LabeledField label="City" value={address.city} />
              </div>
              {address.contacts.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-celery-600 font-medium">Contacts</span>
                  <div className="flex flex-wrap gap-3">
                    {address.contacts.map((contact) => (
                      <div key={contact._id} className="flex flex-col gap-1 pl-3 border-l-2 border-celery-700">
                        <span className="text-sm text-celery-200">
                          {contact.firstName} {contact.lastName}
                        </span>
                        {contact.phone ? (
                          <span className="flex items-center gap-1.5 text-xs text-celery-500">
                            <Phone className="h-3 w-3" /> {contact.phone}
                          </span>
                        ) : null}
                        {contact.email ? (
                          <span className="flex items-center gap-1.5 text-xs text-celery-500">
                            <Mail className="h-3 w-3" /> {contact.email}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="text-xs text-celery-600 italic">No contacts assigned</span>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </Card>
);

interface AssignmentCardProps {
  role: UserRole;
  salespersonId: string | null;
  salespersonName: string;
  advisorId: string | null;
  advisorName: string;
  region: string;
  superregion: string;
  onOpenEdit: () => void;
  onOpenUser: (id: string) => void;
}

export const AssignmentCard = ({
  role,
  salespersonId,
  salespersonName,
  advisorId,
  advisorName,
  region,
  superregion,
  onOpenEdit,
  onOpenUser,
}: AssignmentCardProps) => {
  const canEditAssignment = role === "deputy" || role === "director";
  const showSuperregion = role === "director";
  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <SectionHeader icon={Users} title="Assignment" />
        {canEditAssignment ? (
          <Button variant="ghost" size="sm" onClick={onOpenEdit} className="text-celery-500 hover:text-celery-300">
            <Pencil size={14} />
          </Button>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-10 w-[90%] mx-auto items-center">
        <LabeledField
          label="Salesperson"
          value={
            salespersonId ? (
              <button
                onClick={() => onOpenUser(salespersonId)}
                className="text-celery-200 hover:text-celery-100 hover:underline transition-colors text-left"
              >
                {salespersonName}
              </button>
            ) : (
              salespersonName
            )
          }
        />
        {role !== "advisor" ? (
          <LabeledField
            label="Advisor"
            value={
              advisorId ? (
                <button
                  onClick={() => onOpenUser(advisorId)}
                  className="text-celery-200 hover:text-celery-100 hover:underline transition-colors text-left"
                >
                  {advisorName}
                </button>
              ) : (
                advisorName
              )
            }
          />
        ) : null}
        {role !== "advisor" ? <LabeledField label="Region" value={region} /> : null}
        {showSuperregion ? <LabeledField label="Superregion" value={superregion} /> : null}
      </div>
    </Card>
  );
};

interface NotesCardProps {
  client: Client;
  onEdit: () => void;
}

export const NotesCard = ({ client, onEdit }: NotesCardProps) => (
  <Card>
    <div className="flex justify-between items-center mb-4">
      <SectionHeader icon={FileText} title="Notes" />
      <Button variant="ghost" size="sm" onClick={onEdit} className="text-celery-500 hover:text-celery-300">
        <Pencil size={14} />
      </Button>
    </div>
    {client.notes && client.notes.length > 0 ? (
      <div className="flex flex-wrap gap-3">
        {client.notes.map((note) => (
          <div
            key={note._id}
            className="flex flex-col gap-2 p-3 rounded-lg border border-celery-700 bg-bg-base
                 w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]"
          >
            <p className="text-sm text-celery-300 whitespace-pre-wrap">{note.content}</p>
            <div className="flex flex-col gap-0.5 mt-auto">
              <span className="text-xs text-celery-500">{getNoteAuthor(note.createdBy)}</span>
              <span className="text-xs text-celery-600">{new Date(note.createdAt).toLocaleDateString("pl-PL")}</span>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-celery-600">No notes</p>
    )}
  </Card>
);

export const OthersCard = ({ client }: { client: Client }) => (
  <Card>
    <SectionHeader icon={Clock} title="Others" />
    <div className="flex flex-col gap-4 w-[90%] mx-auto items-center">
      <div className="flex gap-10">
        <LabeledField label="Created at" value={formatDate(client.createdAt, true)} />
        <LabeledField label="Last updated" value={formatDate(client.updatedAt, true)} />
      </div>
    </div>
  </Card>
);
