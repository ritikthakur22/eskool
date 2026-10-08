import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CurrentYear } from "@/components/shared/current-year";
import { AuthIllustration } from "@/features/auth/components/auth-illustration";
import { LoginForm } from "@/features/auth/components/login-form";
import { SocialButtons } from "@/features/auth/components/social-buttons";
import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="flex justify-between items-center mt-4 sm:mt-6 mx-4 sm:mx-10">
        <div className="flex gap-3 sm:gap-5 items-center text-xl sm:text-2xl font-bold text-primary-foreground">
          <div className="relative w-8 h-8 sm:w-12 sm:h-12 overflow-hidden rounded-full">
            <Image
              src="/icon.png"
              alt="ESkool logo"
              fill
              className="object-cover"
              sizes="(max-width: 640px) 32px, 48px"
              priority
            />
          </div>
          <span>ESkool</span>
        </div>
        <ThemeToggle />
      </div>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-6xl items-center gap-16 lg:grid-cols-2">
          {/* Left: illustration + headline */}
          <section className="hidden flex-col items-center text-center lg:flex">
            <AuthIllustration className="w-full max-w-md" />
            <h2 className="mt-8 max-w-md text-4xl font-bold leading-tight tracking-tight">
              Run your whole school from one place
            </h2>
            <p className="mt-4 max-w-sm text-muted-foreground">
              Manage students, teachers, classes and fees with a single admin
              panel.
            </p>
          </section>

          {/* Right: form */}
          <section className="mx-auto w-full max-w-lg">
            <div className="mb-8 space-y-2 text-center">
              <h1 className="text-4xl font-bold tracking-tight">Sign In</h1>
              <p className="text-muted-foreground">
                Welcome back, you&apos;ve been missed!
              </p>
            </div>

            <LoginForm />

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-sm font-medium">OR</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <SocialButtons />
          </section>
        </div>
      </main>

      <footer className="space-y-3 px-6 pb-8 text-center text-sm">
        <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          <Link href="#" className="hover:text-primary">
            Terms &amp; Conditions
          </Link>
          <Link href="#" className="hover:text-primary">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-primary">
            Help
          </Link>
        </nav>
        <p className="text-muted-foreground">
          © <CurrentYear /> Eskool, All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
