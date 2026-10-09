"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type StudentCredentials = {
  name: string;
  email: string;
//   userId: string | null;
  password: string;
};

function buildText(c: StudentCredentials) {
  return [
    "Student Login Credentials",
    "=========================",
    `Name:      ${c.name}`,
    `Email:     ${c.email}`,
    // ...(c.userId ? [`User ID:   ${c.userId}`] : []),
    `Password:  ${c.password}`,
    "",
    "Keep this file safe and change the password after the first login.",
  ].join("\n");
}

function downloadTxt(c: StudentCredentials) {
  const blob = new Blob([buildText(c)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "student";
  const a = document.createElement("a");
  a.href = url;
  a.download = `credentials-${slug}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-all font-mono text-sm font-medium">{value}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Copy ${label}`}
        onClick={async () => {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
type Props = { credentials: StudentCredentials | null; onDone: () => void };

export function StudentCredentialsDialog({ credentials, onDone }: Props) {
  return (
    // onOpenChange is a no-op on purpose: outside click and Escape can't dismiss it,
    // so the one-time password isn't lost. Only the Done button closes it.
    <Dialog open={!!credentials} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Student account created</DialogTitle>
          <DialogDescription>
            Share these login details with {credentials?.name}. The password can't be viewed again after you close this.
          </DialogDescription>
        </DialogHeader>

        {credentials && (
          <div className="space-y-3">
            <CredentialRow label="Email (login)" value={credentials.email} />
            {/* {credentials.userId && <CredentialRow label="User ID" value={credentials.userId} />} */}
            <CredentialRow label="Password" value={credentials.password} />
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => credentials && downloadTxt(credentials)}>
            <Download className="mr-1.5 h-4 w-4" />
            Save as .txt
          </Button>
          <Button type="button" onClick={onDone}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}