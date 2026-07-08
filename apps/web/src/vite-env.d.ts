/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="vite/client" />

import type { Clerk } from "@clerk/clerk-react";

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_APP_NAME: string;
}

declare global {
  interface Window {
    Clerk?: Clerk;
  }
}

export {};
