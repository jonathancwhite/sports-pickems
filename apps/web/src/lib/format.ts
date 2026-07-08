export function formatKickoff(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatPickStatus(status: "not_started" | "partial" | "complete"): string {
  switch (status) {
    case "not_started":
      return "Not started";
    case "partial":
      return "Partial";
    case "complete":
      return "Complete";
    default:
      return status;
  }
}
