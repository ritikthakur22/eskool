// "use client";

// import { useMemo, useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { Eye, EyeOff, Loader2, Wand2 } from "lucide-react";

// import { FormField } from "@/components/shared/form-field";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import type { Student, StudentFormPayload } from "../types";

// type Mode = "create" | "edit";

// const buildSchema = (mode: Mode) =>
//   z.object({
//     firstName: z.string().trim().min(1, "First name is required").max(100),
//     lastName: z.string().trim().min(1, "Last name is required").max(100),
//     email: z.string().trim().email("Enter a valid email").max(254),
//     grade: z.string().trim().max(50).optional(),
//     section: z.string().trim().max(50).optional(),
//     rollNo: z.string().trim().max(50).optional(),
//     password:
//       mode === "create"
//         ? z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be at most 128 characters")
//         : z.string().optional(),
//   });

// type FormValues = z.infer<ReturnType<typeof buildSchema>>;

// function toDefaults(student?: Student): FormValues {
//   return {
//     firstName: student?.profile.firstName ?? "",
//     lastName: student?.profile.lastName ?? "",
//     email: student?.email ?? "",
//     grade: student?.profile.grade ?? "",
//     section: student?.profile.section ?? "",
//     rollNo: student?.profile.rollNo ?? "",
//     password: "",
//   };
// }

// function generatePassword(length = 12) {
//   const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
//   const bytes = crypto.getRandomValues(new Uint32Array(length));
//   return Array.from(bytes, (b) => chars[b % chars.length]).join("");
// }

// type StudentFormProps = {
//   mode: Mode;
//   student?: Student;
//   isPending: boolean;
//   onSubmit: (payload: StudentFormPayload) => void;
//   onCancel: () => void;
// };

// const inputClass = "h-11 rounded-xl";

// export function StudentForm({ mode, student, isPending, onSubmit, onCancel }: StudentFormProps) {
//   const schema = useMemo(() => buildSchema(mode), [mode]);
//   const [showPassword, setShowPassword] = useState(false);

//   const {
//     register,
//     setValue,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<FormValues>({
//     resolver: zodResolver(schema),
//     defaultValues: toDefaults(student),
//   });

//   return (
//     <form
//       onSubmit={handleSubmit((v) =>
//         onSubmit({
//           firstName: v.firstName,
//           lastName: v.lastName,
//           email: v.email,
//           grade: v.grade ?? "",
//           section: v.section ?? "",
//           rollNo: v.rollNo ?? "",
//           password: v.password || undefined,
//         }),
//       )}
//       className="space-y-8"
//     >
//       <section className="space-y-5">
//         <h2 className="border-b pb-3 text-lg font-semibold">General Information</h2>
//         <div className="grid gap-5 md:grid-cols-2">
//           <FormField label="First Name" htmlFor="firstName" required error={errors.firstName?.message}>
//             <Input id="firstName" placeholder="First Name" className={inputClass} {...register("firstName")} />
//           </FormField>
//           <FormField label="Last Name" htmlFor="lastName" required error={errors.lastName?.message}>
//             <Input id="lastName" placeholder="Last Name" className={inputClass} {...register("lastName")} />
//           </FormField>
//           <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
//             <Input id="email" type="email" placeholder="Email" className={inputClass} {...register("email")} />
//           </FormField>
//           {mode === "create" && (
//             <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
//               <div className="flex gap-2">
//                 <div className="relative flex-1">
//                   <Input
//                     id="password"
//                     type={showPassword ? "text" : "password"}
//                     autoComplete="new-password"
//                     placeholder="Minimum 8 characters"
//                     className={`${inputClass} pr-10`}
//                     {...register("password")}
//                   />
//                   <button
//                     type="button"
//                     aria-label={showPassword ? "Hide password" : "Show password"}
//                     onClick={() => setShowPassword((s) => !s)}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
//                   >
//                     {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                   </button>
//                 </div>
//                 <Button
//                   type="button"
//                   variant="outline"
//                   className="h-11 rounded-xl"
//                   onClick={() => {
//                     setValue("password", generatePassword(), { shouldValidate: true });
//                     setShowPassword(true);
//                   }}
//                 >
//                   <Wand2 className="mr-1.5 h-4 w-4" />
//                   Generate
//                 </Button>
//               </div>
//             </FormField>
//           )}
//         </div>
//       </section>

//       <section className="space-y-5">
//         <h2 className="border-b pb-3 text-lg font-semibold">Academic Information</h2>
//         <div className="grid gap-5 md:grid-cols-3">
//           <FormField label="Grade" htmlFor="grade" error={errors.grade?.message}>
//             <Input id="grade" placeholder="e.g. 10" className={inputClass} {...register("grade")} />
//           </FormField>
//           <FormField label="Section" htmlFor="section" error={errors.section?.message}>
//             <Input id="section" placeholder="e.g. A" className={inputClass} {...register("section")} />
//           </FormField>
//           <FormField label="Roll Number" htmlFor="rollNo" error={errors.rollNo?.message}>
//             <Input id="rollNo" placeholder="Roll number" className={inputClass} {...register("rollNo")} />
//           </FormField>
//         </div>
//       </section>

//       <div className="flex items-center gap-3">
//         <Button type="button" variant="outline" disabled={isPending} className="h-11 rounded-xl px-8 text-destructive" onClick={onCancel}>
//           {mode === "create" ? "Discard" : "Cancel"}
//         </Button>
//         <Button type="submit" disabled={isPending} className="h-11 rounded-xl px-10">
//           {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//           {mode === "create" ? "Add" : "Save Changes"}
//         </Button>
//       </div>
//     </form>
//   );
// }

"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Wand2 } from "lucide-react";

import { FormField } from "@/components/shared/form-field";
import { NativeSelect } from "@/components/shared/native-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Student, StudentFormPayload } from "../types";

type Mode = "create" | "edit";

const opt = (max: number) => z.string().trim().max(max, `Maximum ${max} characters`).optional();

const buildSchema = (mode: Mode) =>
  z.object({
    firstName: z.string().trim().min(1, "First name is required").max(100),
    lastName: z.string().trim().min(1, "Last name is required").max(100),
    email: z.string().trim().email("Enter a valid email").max(254),
    password:
      mode === "create"
        ? z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be at most 128 characters")
        : z.string().optional(),
    userId: opt(50),
    emisId: opt(50),
    grade: opt(50),
    section: opt(50),
    rollNo: opt(50),
    admissionDate: opt(30),
    gender: opt(30),
    dob: opt(30),
    dobBs: opt(20),
    bloodGroup: opt(10),
    phone: opt(30),
    address: opt(500),
    temporaryAddress: opt(500),
    fatherName: opt(150),
    fatherPhone: opt(30),
    motherName: opt(150),
    motherPhone: opt(30),
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

const day = (v?: string | null) => (v ? v.slice(0, 10) : ""); // ISO datetime -> yyyy-mm-dd for <input type="date">

function toDefaults(student?: Student): FormValues {
  const p = student?.profile;
  return {
    firstName: p?.firstName ?? "",
    lastName: p?.lastName ?? "",
    email: student?.email ?? "",
    password: "",
    // userId: student?.userId ?? "",
    // emisId: student?.emisId ?? "",
    grade: p?.grade ?? "",
    section: p?.section ?? "",
    rollNo: p?.rollNo ?? "",
    admissionDate: day(p?.admissionDate),
    gender: p?.gender ?? "",
    dob: day(p?.dob),
    dobBs: p?.dobBs ?? "",
    bloodGroup: p?.bloodGroup ?? "",
    phone: p?.phone ?? "",
    address: p?.address ?? "",
    temporaryAddress: p?.temporaryAddress ?? "",
    fatherName: p?.fatherName ?? "",
    fatherPhone: p?.fatherPhone ?? "",
    motherName: p?.motherName ?? "",
    motherPhone: p?.motherPhone ?? "",
  };
}

function toPayload(v: FormValues): StudentFormPayload {
  const { password, ...rest } = v;
  const filled = Object.fromEntries(Object.entries(rest).map(([k, x]) => [k, x ?? ""])) as Omit<StudentFormPayload, "password">;
  return { ...filled, password: password || undefined };
}

function generatePassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

const GENDERS = ["Male", "Female", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

type StudentFormProps = {
  mode: Mode;
  student?: Student;
  isPending: boolean;
  onSubmit: (payload: StudentFormPayload) => void;
  onCancel: () => void;
};

const inputClass = "h-11 rounded-xl";

export function StudentForm({ mode, student, isPending, onSubmit, onCancel }: StudentFormProps) {
  const schema = useMemo(() => buildSchema(mode), [mode]);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toDefaults(student),
  });

  const text = (name: keyof FormValues, label: string, o?: { placeholder?: string; type?: string; required?: boolean }) => (
    <FormField label={label} htmlFor={name} required={o?.required} error={errors[name]?.message}>
      <Input id={name} type={o?.type} placeholder={o?.placeholder ?? label} className={inputClass} {...register(name)} />
    </FormField>
  );

  const select = (name: "gender" | "bloodGroup", label: string, options: string[]) => (
    <FormField label={label} htmlFor={name} error={errors[name]?.message}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <NativeSelect
            id={name}
            name={field.name}
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </NativeSelect>
        )}
      />
    </FormField>
  );

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(toPayload(v)))} className="space-y-8">
      <section className="space-y-5">
        <h2 className="border-b pb-3 text-lg font-semibold">General Information</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {text("firstName", "First Name", { required: true })}
          {text("lastName", "Last Name", { required: true })}
          {text("email", "Email", { type: "email", required: true })}
          {mode === "create" && (
            <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    className={`${inputClass} pr-10`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl"
                  onClick={() => {
                    setValue("password", generatePassword(), { shouldValidate: true });
                    setShowPassword(true);
                  }}
                >
                  <Wand2 className="mr-1.5 h-4 w-4" />
                  Generate
                </Button>
              </div>
            </FormField>
          )}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="border-b pb-3 text-lg font-semibold">Academic Information</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {text("userId", "User ID / Admission No", { placeholder: "e.g. 2026-0123" })}
          {text("emisId", "EMIS ID")}
          {text("admissionDate", "Admission Date", { type: "date" })}
          {text("grade", "Grade", { placeholder: "e.g. 10" })}
          {text("section", "Section", { placeholder: "e.g. A" })}
          {text("rollNo", "Roll Number", { placeholder: "Roll number" })}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="border-b pb-3 text-lg font-semibold">Personal Information</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {select("gender", "Gender", GENDERS)}
          {text("dob", "Date of Birth (AD)", { type: "date" })}
          {text("dobBs", "Date of Birth (BS)", { placeholder: "e.g. 2065-01-15" })}
          {select("bloodGroup", "Blood Group", BLOOD_GROUPS)}
          {text("phone", "Phone")}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {text("address", "Permanent Address")}
          {text("temporaryAddress", "Temporary Address")}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="border-b pb-3 text-lg font-semibold">Guardian Information</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {text("fatherName", "Father's Name")}
          {text("fatherPhone", "Father's Phone")}
          {text("motherName", "Mother's Name")}
          {text("motherPhone", "Mother's Phone")}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" disabled={isPending} className="h-11 rounded-xl px-8 text-destructive" onClick={onCancel}>
          {mode === "create" ? "Discard" : "Cancel"}
        </Button>
        <Button type="submit" disabled={isPending} className="h-11 rounded-xl px-10">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Add" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}