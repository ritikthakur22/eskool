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
import { useDeleteStudent } from "../hooks";
import type { Student } from "../types";

type DeleteStudentDialogProps = {
  student: Student | null;
  onClose: () => void;
};

export function DeleteStudentDialog({ student, onClose }: DeleteStudentDialogProps) {
  const { mutate, isPending } = useDeleteStudent();

  return (
    <Dialog open={!!student} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete student?</DialogTitle>
          <DialogDescription>
            {student?.profile.fullName} will be permanently removed. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => student && mutate(student.id, { onSuccess: onClose })}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}