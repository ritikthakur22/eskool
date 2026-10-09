import { Label } from "@/components/ui/label";

type FormFieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
};

export function FormField({ label, htmlFor, required, error, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}