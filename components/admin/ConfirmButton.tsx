"use client";

import { Button } from "@/components/ui/button";

export function ConfirmActionButton({
  children,
  confirmText,
}: {
  children: React.ReactNode;
  confirmText: string;
}) {
  return (
    <Button
      type="submit"
      size="sm"
      variant="outline"
      onClick={(e) => {
        if (!confirm(confirmText)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </Button>
  );
}
