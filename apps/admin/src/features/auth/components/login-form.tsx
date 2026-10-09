// src/features/auth/components/login-form.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

import { getErrorMessage } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useLogin } from "../hooks";
import { getSafeNext } from "../utils";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  // The server decides password validity; don't lock out shorter existing passwords.
  password: z.string().min(1, "Enter your password"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const { mutate, isPending, isError, error } = useLogin();
  const { isAuthenticated } = useAuth();

  // Redirect after login, or if an already-signed-in user opens /login.
  useEffect(() => {
    if (!isAuthenticated) return;
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(getSafeNext(next));
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const busy = isPending || isAuthenticated;

  const onSubmit = (values: FormValues) => {
    mutate(
      { ...values, remember },
      {
        onSuccess: () => {
          reset();
        },
      },
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
      noValidate
    >
      {isError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {getErrorMessage(error, "Invalid credentials")}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="Your Email"
            autoComplete="username"
            disabled={busy}
            className="h-12 rounded-xl bg-muted/50 pl-10 text-base"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Your Password"
            disabled={busy}
            autoComplete="current-password"
            className="h-12 rounded-xl bg-muted/50 pl-10 pr-11 text-base"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(v) => setRemember(v === true)}
          />
          <Label htmlFor="remember" className="cursor-pointer font-normal">
            Remember me
          </Label>
        </div>
        <a
          href="#"
          className="text-sm font-medium text-destructive hover:underline"
        >
          Forgot password?
        </a>
      </div>

      <Button
        type="submit"
        disabled={busy}
        className="h-12 w-full rounded-xl text-base"
      >
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign In
      </Button>
    </form>
  );
}
