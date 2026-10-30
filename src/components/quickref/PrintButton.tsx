"use client";

import { headerButton } from "@/components/layout/PageHeader";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={headerButton}
    >
      Print / PDF
    </button>
  );
}
