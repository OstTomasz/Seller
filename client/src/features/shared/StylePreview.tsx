import { useState } from "react";
import {
  Button,
  Input,
  Textarea,
  Badge,
  Card,
  Modal,
  Table,
  Select,
} from "@/components/ui";

const sections = [
  "Buttons",
  "Inputs",
  "Badges",
  "Cards",
  "Modal",
  "Table",
  "Select",
];

interface SampleRow {
  id: string;
  company: string;
  status: "active" | "reminder" | "inactive" | "archived";
  person: string;
  date: string;
}

const sampleData: SampleRow[] = [
  {
    id: "1",
    company: "Acme Corp",
    status: "active",
    person: "John Doe",
    date: "2025-03-01",
  },
  {
    id: "2",
    company: "Globex Inc",
    status: "reminder",
    person: "Jane Smith",
    date: "2025-02-15",
  },
  {
    id: "3",
    company: "Initech",
    status: "inactive",
    person: "Bob Brown",
    date: "2024-11-20",
  },
  {
    id: "4",
    company: "Umbrella Ltd",
    status: "archived",
    person: "Alice Green",
    date: "2024-08-05",
  },
];

const statusVariantMap = {
  active: "active",
  reminder: "warning",
  inactive: "error",
  archived: "muted",
} as const;

export const StylePreview = () => {
  const [active, setActive] = useState("Buttons");
  const [modalOpen, setModalOpen] = useState(false);
  const [clickedRow, setClickedRow] = useState<SampleRow | null>(null);

  return (
    <div className="min-h-screen bg-bg-base text-celery-100 font-mono">
      {/* Header */}
      <div className="border-b border-celery-800 px-4 sm:px-8 py-4 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
        <span className="text-gold-400 text-sm font-bold tracking-widest uppercase">
          Seller CRM — Style Preview
        </span>
      </div>

      {/* Nav */}
      <div className="border-b border-celery-800 px-4 sm:px-8 overflow-x-auto">
        <div className="flex gap-1 py-2 min-w-max">
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => setActive(s)}
              className={
                active === s
                  ? "px-3 py-1.5 text-xs rounded-md bg-celery-700 text-celery-100 border border-gold-500"
                  : "px-3 py-1.5 text-xs rounded-md text-celery-500 hover:text-celery-300 hover:bg-celery-900"
              }
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-8 py-8 max-w-5xl">
        {/* ─── Buttons ─── */}
        {active === "Buttons" ? (
          <div className="flex flex-col gap-8">
            <div>
              <p className="text-xs text-celery-500 uppercase tracking-widest mb-4">
                Variants
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </div>
            <div className="border-t border-celery-600 my-2" />
            <div>
              <p className="text-xs text-celery-500 uppercase tracking-widest mb-4">
                Sizes
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Default</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            <div className="border-t border-celery-600 my-2" />
            <div>
              <p className="text-xs text-celery-500 uppercase tracking-widest mb-4">
                Loading & Disabled
              </p>
              <div className="flex flex-wrap gap-3">
                <Button isLoading>Loading</Button>
                <Button disabled>Disabled</Button>
                <Button variant="danger" disabled>
                  Disabled danger
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {/* ─── Inputs ─── */}
        {active === "Inputs" ? (
          <div className="flex flex-col gap-4 max-w-md">
            <Input label="Default input" placeholder="Enter value..." />
            <Input
              label="Input with error"
              placeholder="Enter value..."
              defaultValue="wrong value"
              error="This field is required"
            />
            <Input label="Disabled input" placeholder="Disabled..." disabled />
            <Textarea
              label="Textarea"
              placeholder="Enter long text..."
              rows={4}
            />
            <Textarea
              label="Textarea with error"
              placeholder="Enter long text..."
              error="This field cannot be empty"
              rows={4}
            />
          </div>
        ) : null}

        {/* ─── Badges ─── */}
        {active === "Badges" ? (
          <div className="flex flex-col gap-6">
            <p className="text-xs text-celery-500 uppercase tracking-widest mb-2">
              All variants
            </p>
            <div className="flex flex-wrap gap-3">
              <Badge variant="active">Active</Badge>
              <Badge variant="warning">Reminder</Badge>
              <Badge variant="error">Inactive</Badge>
              <Badge variant="muted">Archived</Badge>
              <Badge variant="gold">Gold</Badge>
            </div>
          </div>
        ) : null}

        {/* ─── Cards ─── */}
        {active === "Cards" ? (
          <div className="flex flex-col gap-6 max-w-lg">
            <div>
              <p className="text-xs text-celery-500 uppercase tracking-widest mb-3">
                Default card
              </p>
              <Card>
                <p className="text-lg font-semibold text-celery-100">
                  Card title
                </p>
                <p className="text-sm text-celery-500 mt-2">
                  This is a standard card used for most content areas.
                </p>
              </Card>
            </div>
            <div>
              <p className="text-xs text-celery-500 uppercase tracking-widest mb-3">
                Elevated card (gold border)
              </p>
              <Card elevated>
                <p className="text-lg font-semibold text-celery-100">
                  Elevated card
                </p>
                <p className="text-sm text-celery-500 mt-2">
                  Used for featured content, modals, or highlighted sections.
                </p>
              </Card>
            </div>
          </div>
        ) : null}

        {/* ─── Modal ─── */}
        {active === "Modal" ? (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-celery-500 uppercase tracking-widest mb-2">
              Click to open — close with Escape or backdrop click
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setModalOpen(true)}>Open modal</Button>
            </div>
            <Modal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Example modal"
            >
              <div className="flex flex-col gap-4">
                <Input label="Full name" placeholder="John Doe" />
                <Input
                  label="Email"
                  placeholder="john@example.com"
                  type="email"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => setModalOpen(false)}>Confirm</Button>
                </div>
              </div>
            </Modal>
          </div>
        ) : null}

        {/* ─── Table ─── */}
        {active === "Table" ? (
          <Table<SampleRow>
            keyExtractor={(row) => row.id}
            data={sampleData}
            onRowClick={(row) => setClickedRow(row)}
            columns={[
              { key: "company", header: "Company" },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge variant={statusVariantMap[row.status]}>
                    {row.status}
                  </Badge>
                ),
              },
              { key: "person", header: "Salesperson" },
              {
                key: "date",
                header: "Last activity",
                className: "text-celery-500",
                render: (row) => (
                  <span className="text-celery-500">{row.date}</span>
                ),
              },
            ]}
          />
        ) : null}

        <Modal
          isOpen={clickedRow !== null}
          onClose={() => setClickedRow(null)}
          title={clickedRow?.company ?? ""}
        >
          <div className="flex flex-col gap-2">
            <p className="text-celery-300">
              Salesperson:{" "}
              <span className="text-celery-100">{clickedRow?.person}</span>
            </p>
            <p className="text-celery-300">
              Status:{" "}
              <span className="text-celery-100">{clickedRow?.status}</span>
            </p>
            <p className="text-celery-300">
              Last activity:{" "}
              <span className="text-celery-100">{clickedRow?.date}</span>
            </p>
            <div className="flex justify-end pt-4">
              <Button variant="secondary" onClick={() => setClickedRow(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>

        {/* ─── Select ─── */}
        {active === "Select" ? (
          <div className="flex flex-col gap-4 max-w-md">
            <Select
              label="Default select"
              placeholder="Choose an option..."
              options={[
                { value: "active", label: "Active" },
                { value: "reminder", label: "Reminder" },
                { value: "inactive", label: "Inactive" },
                { value: "archived", label: "Archived" },
              ]}
            />
            <Select
              label="Select with error"
              placeholder="Choose an option..."
              error="Please select an option"
              options={[
                { value: "director", label: "Director" },
                { value: "deputy", label: "Deputy" },
                { value: "advisor", label: "Advisor" },
                { value: "salesperson", label: "Salesperson" },
              ]}
            />
            <Select
              label="Disabled select"
              placeholder="Disabled..."
              disabled
              options={[]}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

// Preview: paste in App.tsx;

// import { StylePreview } from "@/features/shared/StylePreview";

// export const App = () => {
//   return (
//     <div className="min-h-screen bg-bg-base">
//       <StylePreview />
//     </div>
//   );
// };
