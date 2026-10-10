"use client";

import { useState } from "react";
import { X } from "lucide-react";

type TagInputProps = {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
  maxLength?: number;
  placeholder?: string;
  suggestions?: string[];
};

export function TagInput({
  id = "tags",
  value,
  onChange,
  max = 20,
  maxLength = 100,
  placeholder,
  suggestions = [],
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const tag = raw.trim().slice(0, maxLength);
    const duplicate = value.some((v) => v.toLowerCase() === tag.toLowerCase());
    if (tag && !duplicate && value.length < max) onChange([...value, tag]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-input px-3 py-2 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(value.filter((v) => v !== tag))}
              className="hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          list={`${id}-suggestions`}
          value={draft}
          placeholder={value.length ? "" : placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => add(draft)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <datalist id={`${id}-suggestions`}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
      <p className="text-xs text-muted-foreground">
        Press Enter or comma to add · {value.length}/{max}
      </p>
    </div>
  );
}