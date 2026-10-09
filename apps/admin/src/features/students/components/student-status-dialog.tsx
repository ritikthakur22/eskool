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
import { useSetStudentStatus } from "../hooks";
import type { Student } from "../types";
import { getStudentName } from "../utils";

type StudentStatusDialogProps = {
  student: Student | null;
  onClose: () => void;
};

export function StudentStatusDialog({ student, onClose }: StudentStatusDialogProps) {
  const { mutate, isPending } = useSetStudentStatus();
  const restoring = student?.status === "DISABLED";

  return (
    <Dialog open={!!student} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{restoring ? "Restore student?" : "Disable student?"}</DialogTitle>
          <DialogDescription>
            {student && getStudentName(student)}{" "}
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
            onClick={() =>
              student && mutate({ id: student.id, active: restoring }, { onSuccess: onClose })
            }
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {restoring ? "Restore" : "Disable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}