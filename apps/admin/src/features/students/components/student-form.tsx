"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/form-field";
import { NativeSelect } from "@/components/shared/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/config/routes";
import { useCreateStudent } from "../hooks";
import { CLASS_OPTIONS } from "../mock-data";

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  className: z.string().optional(),
  address: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  status: z.enum(["ACTIVE", "DISABLED"]),
});

type FormValues = z.infer<typeof schema>;

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const inputClass = "h-11 rounded-xl";

export function StudentForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { mutate, isPending } = useCreateStudent();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "ACTIVE", className: "" },
  });

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Only .JPG, .JPEG or .PNG files are supported");
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      toast.error("Photo must be smaller than 2MB");
      return;
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const onSubmit = (values: FormValues) =>
    mutate({ ...values, profilePictureUrl: photoPreview });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* General information */}
      <section className="space-y-5">
        <h2 className="border-b pb-3 text-lg font-semibold">General Information</h2>

        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-6 w-6" />
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              We only support .JPG, .JPEG, or .PNG files (max 2MB).
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
                Upload Photo
              </Button>
              {photoPreview && (
                <Button type="button" variant="ghost" className="text-destructive" onClick={removePhoto}>
                  Delete Photo
                </Button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handlePhoto}
            />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Full Name" htmlFor="fullName" required error={errors.fullName?.message}>
            <Input id="fullName" placeholder="Full Name" className={inputClass} {...register("fullName")} />
          </FormField>

          <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
            <Input id="email" type="email" placeholder="Email" className={inputClass} {...register("email")} />
          </FormField>

          <FormField label="Phone Number" htmlFor="phone" error={errors.phone?.message}>
            <Input id="phone" placeholder="Phone" className={inputClass} {...register("phone")} />
          </FormField>

          <FormField label="Class" htmlFor="className" error={errors.className?.message}>
            <NativeSelect id="className" {...register("className")}>
              <option value="">Select class</option>
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </NativeSelect>
          </FormField>
        </div>
      </section>

      {/* Account */}
      <section className="space-y-5">
        <h2 className="border-b pb-3 text-lg font-semibold">Account</h2>

        <div className="grid gap-5 md:grid-cols-2">
          <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              className={inputClass}
              {...register("password")}
            />
          </FormField>

          <FormField label="User Status" htmlFor="status" required error={errors.status?.message}>
            <NativeSelect id="status" {...register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
            </NativeSelect>
          </FormField>
        </div>
      </section>

      {/* Address */}
      <section className="space-y-5">
        <h2 className="border-b pb-3 text-lg font-semibold">Address</h2>
        <FormField label="Address" htmlFor="address" error={errors.address?.message}>
          <Input id="address" placeholder="Type your address" className={inputClass} {...register("address")} />
        </FormField>
      </section>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          className="h-11 rounded-xl px-8 text-destructive"
          onClick={() => router.push(ROUTES.students)}
        >
          Discard
        </Button>
        <Button type="submit" disabled={isPending} className="h-11 rounded-xl px-10">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add
        </Button>
      </div>
    </form>
  );
}