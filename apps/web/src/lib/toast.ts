import { toast } from "sonner";
import { ApiError } from "@/lib/api";

export function showApiError(error: unknown, fallback = "Something went wrong") {
  if (error instanceof ApiError) {
    const body = error.body as { message?: string; error?: string } | undefined;
    toast.error(body?.message ?? body?.error ?? error.message);
    return;
  }

  if (error instanceof Error) {
    toast.error(error.message);
    return;
  }

  toast.error(fallback);
}

export function showSuccess(message: string) {
  toast.success(message);
}
