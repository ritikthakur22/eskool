"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type StatusDialogProps = {
  target: { id: string; name: string; status: string } | null;
  noun: string;
  isPending: boolean;
  onConfirm: (restoring: boolean) => void;
  onClose: () => void;
};

export function StatusDialog({ target, noun, isPending, onConfirm, onClose }: StatusDialogProps) {
  const restoring = target?.status === "DISABLED";

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{restoring ? `Restore ${noun}?` : `Disable ${noun}?`}</DialogTitle>
          <DialogDescription>
            {target?.name}{" "}
            {restoring
              ? "will be able to sign in again."
              : "will be signed out immediately and won't be able to sign in until restored."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant={restoring ? "default" : "destructive"}
            disabled={isPending}
            onClick={() => onConfirm(restoring)}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {restoring ? "Restore" : "Disable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}