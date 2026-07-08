import { APP_NAME } from "@callsheet/shared";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <p className="text-sm text-muted-foreground">
          © {year} {APP_NAME}. All rights reserved.
        </p>
        <nav className="flex gap-6 text-sm">
          <a href="#" className="text-muted-foreground hover:text-foreground">
            Terms
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground">
            Privacy
          </a>
        </nav>
      </div>
    </footer>
  );
}
