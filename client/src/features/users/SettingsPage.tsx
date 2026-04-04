import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Loader, FetchError, Button, Input, Textarea, ConfirmDialog } from "@/components/ui";
import { User, Lock, Clock, LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useMyProfile } from "./hooks/useMyProfile";
import { useUpdateMyProfile } from "./hooks/useMyProfile";

import logoPlaceholder from "@/assets/logo.avif";
import { ChangePasswordForm } from "../auth/ChangePasswordForm";
import { formatDate } from "@/lib/utils";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE = 1024 * 1024;

const SectionHeader = ({ icon: Icon, title }: { icon: LucideIcon; title: string }) => (
  <div className="flex items-center gap-2 mb-4 w-full justify-center">
    <Icon className="h-4 w-4 text-celery-500" />
    <h2 className="text-sm font-semibold text-celery-500 uppercase tracking-wider">{title}</h2>
  </div>
);

export const SettingsPage = () => {
  const { data, isLoading, isError } = useMyProfile();
  const { mutate: updateProfile, isPending } = useUpdateMyProfile();
  const navigate = useNavigate();
  const [workplace, setWorkplace] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingNavRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a[href]");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("http")) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDiscardOpen(true);

      pendingNavRef.current = href;
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [isDirty]);

  // Sync state when data loads
  const initialized = useRef(false);
  if (data && !initialized.current) {
    setWorkplace(data.profile?.workplace ?? "");
    setDescription(data.profile?.description ?? "");
    setAvatarPreview(data.profile?.avatar ?? null);
    initialized.current = true;
  }

  if (isLoading) return <Loader label="settings" />;
  if (isError || !data) return <FetchError label="settings" />;

  const { user, profile } = data;
  const fullName = `${user.firstName} ${user.lastName}`;
  const displayAvatar = avatarPreview ?? logoPlaceholder;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Unsupported format. Use JPG, PNG, WebP or AVIF.");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("File too large. Maximum size is 1.5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAvatar(base64);
      setAvatarPreview(base64);
      setIsDirty(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateProfile(
      {
        workplace: workplace || null,
        description: description || null,
        avatar: avatar ?? profile?.avatar ?? null,
      },
      {
        onSuccess: () => {
          toast.success("Settings saved.");
          setIsDirty(false);
          initialized.current = false; // re-sync on next render
        },
        onError: () => toast.error("Failed to save settings."),
      },
    );
  };

  return (
    <div className="flex flex-col max-w-3xl mx-auto gap-6">
      <h1 className="text-fluid-h1 font-bold text-celery-100">Settings</h1>

      {/* Header */}
      <div className="flex items-center gap-6">
        <div className="relative group">
          <img
            src={typeof displayAvatar === "string" ? displayAvatar : logoPlaceholder}
            alt={fullName}
            className="w-20 h-20 rounded-full object-cover border-2 border-celery-700 bg-bg-elevated"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100
                       transition-opacity flex items-center justify-center text-xs text-white"
          >
            Change
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.avif"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-celery-100">{fullName}</h2>
          <div className="flex items-center gap-4 text-sm text-celery-500">
            <span>#{user.numericId}</span>
            {user.position?.code ? <span>{user.position.code}</span> : null}
          </div>
        </div>
      </div>

      {/* Information — editable */}
      <Card>
        <SectionHeader icon={User} title="Information" />
        <div className="flex flex-col gap-4 w-[90%] mx-auto">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-celery-600">Workplace</label>
            <Input
              value={workplace}
              onChange={(e) => {
                setWorkplace(e.target.value);
                setIsDirty(true);
              }}
              placeholder="e.g. Warsaw HQ"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-celery-600">About</label>
            <Textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Short bio or description…"
              rows={4}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!isDirty || isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Account — read only for now */}
      <Card>
        <SectionHeader icon={Lock} title="Account" />
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5 w-[90%] mx-auto">
            <span className="text-xs text-celery-600">Email</span>
            <span className="text-sm text-celery-200">{user.email}</span>
          </div>
          <div className="border-t border-celery-700 pt-4">
            <p className="text-xs text-celery-600 w-[90%] mx-auto mb-4">Change password</p>
            <ChangePasswordForm />
          </div>
        </div>
      </Card>

      {/* Activity */}
      <Card>
        <SectionHeader icon={Clock} title="Activity" />
        <div className="grid grid-cols-2 gap-6 w-[90%] mx-auto">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-celery-600 mx-auto">Member since</span>
            <span className="text-sm text-celery-200 mx-auto">
              {formatDate(user.createdAt, true)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-celery-600 mx-auto">Last login</span>
            <span className="text-sm text-celery-200 mx-auto">
              {formatDate(profile?.lastLoginAt ?? null)}
            </span>
          </div>
        </div>
      </Card>
      <ConfirmDialog
        isOpen={isDiscardOpen}
        title="Discard changes?"
        description="You have unsaved changes. Leave anyway?"
        confirmLabel="Leave"
        onConfirm={() => {
          setIsDiscardOpen(false);
          setIsDirty(false);
          if (pendingNavRef.current) {
            navigate(pendingNavRef.current);
            pendingNavRef.current = null;
          }
        }}
        onClose={() => {
          setIsDiscardOpen(false);
          pendingNavRef.current = null;
        }}
      />
    </div>
  );
};
