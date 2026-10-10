import { LinkButton } from "./link-button";

export function EntityNotFound({ noun, backHref }: { noun: string; backHref: string }) {
  const title = noun.charAt(0).toUpperCase() + noun.slice(1);

  return (
    <div className="rounded-2xl border bg-card p-10 text-center">
      <h2 className="text-lg font-semibold">{title} not found</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This {noun} may have been removed, or the link is incorrect.
      </p>
      <div className="mt-5 flex justify-center">
        <LinkButton href={backHref}>Back to {noun}s</LinkButton>
      </div>
    </div>
  );
}