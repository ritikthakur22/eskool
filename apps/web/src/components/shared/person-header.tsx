import { Ban, Pencil, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { LinkButton } from "./link-button";
import { PersonAvatar, StatusPill } from "./person-ui";

type PersonHeaderProps = {
  name: string;
  email: string;
  id: string;
  status: string;
  createdAt: string;
  editHref: string;
  onToggleStatus: () => void;
  badge?: React.ReactNode;
};

export function PersonHeader({
  name,
  email,
  id,
  status,
  createdAt,
  editHref,
  onToggleStatus,
  badge,
}: PersonHeaderProps) {
  const disabled = status === "DISABLED";

  return (
    <div className="flex flex-col gap-5 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center">
      <PersonAvatar name={name} className="h-24 w-24 text-2xl" />

      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold">{name}</h2>
          <StatusPill status={status} />
          {badge}
        </div>
        <p className="text-sm text-muted-foreground">{email}</p>
        <p className="text-xs text-muted-foreground">
          ID #{id} · Joined {formatDate(createdAt)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <LinkButton href={editHref}>
          <Pencil className="mr-1.5 h-4 w-4" />
          Edit
        </LinkButton>
        <Button
          variant={disabled ? "secondary" : "destructive"}
          className="h-10 rounded-xl px-4"
          onClick={onToggleStatus}
        >
          {disabled ? <RotateCcw className="mr-1.5 h-4 w-4" /> : <Ban className="mr-1.5 h-4 w-4" />}
          {disabled ? "Restore" : "Disable"}
        </Button>
      </div>
    </div>
  );
}