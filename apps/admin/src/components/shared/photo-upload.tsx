"use client";

import { useRef } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const MAX_SIZE = 2 * 1024 * 1024;

type PhotoUploadProps = {
  value: string | null;
  onChange: (url: string | null) => void;
};

export function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Only .JPG, .JPEG or .PNG files are supported");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Photo must be smaller than 2MB");
      return;
    }

    // Local preview only. With the real backend, upload the file and store the returned URL.
    onChange(URL.createObjectURL(file));
  };

  return (
    <div className="flex items-center gap-5">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-6 w-6" />
        )}
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          We only support .JPG, .JPEG, or .PNG files (max 2MB).
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
            Upload Photo
          </Button>
          {value && (
            <Button type="button" variant="ghost" className="text-destructive" onClick={() => onChange(null)}>
              Delete Photo
            </Button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}