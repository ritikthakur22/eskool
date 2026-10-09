export const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 };

export const gridStroke = "var(--input)";

export const tooltipProps = {
  contentStyle: {
    backgroundColor: "var(--card)",
    border: "1px solid var(--input)",
    borderRadius: 12,
    fontSize: 12,
  },
  labelStyle: { color: "var(--foreground)", fontWeight: 600 },
} as const;