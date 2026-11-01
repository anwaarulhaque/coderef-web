"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { START_EDGE_URL, START_EXTENSION_URL, START_FIREFOX_URL } from "@/lib/start-marketing";

type Browser = "Chrome" | "Edge" | "Brave" | "Opera" | "Vivaldi" | "Firefox" | "Safari" | "Mobile";

// Edge installs from Edge Add-ons, other Chromium browsers from the Chrome Web Store, Firefox from Firefox Add-ons; the
// rest fall back to setting /start as the home page.
const CHROMIUM = new Set<Browser>(["Chrome", "Edge", "Brave", "Opera", "Vivaldi"]);

async function detectBrowser(): Promise<Browser> {
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return "Mobile";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/Vivaldi/.test(ua)) return "Vivaldi";
  const brave = (navigator as Navigator & { brave?: { isBrave: () => Promise<boolean> } }).brave;
  if (brave && (await brave.isBrave().catch(() => false))) return "Brave";
  if (/Chrome\/|Chromium\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return "Chrome";
}

/** Install button for the CodeRef Start extension, labelled for the visitor's browser. Renders "Add to Chrome" until detection runs. */
export function ExtensionInstallButton({ className }: { className: string }) {
  const [browser, setBrowser] = useState<Browser>("Chrome");

  useEffect(() => {
    detectBrowser().then(setBrowser);
  }, []);

  const storeUrl =
    browser === "Edge" ? START_EDGE_URL : CHROMIUM.has(browser) ? START_EXTENSION_URL : browser === "Firefox" ? START_FIREFOX_URL : "";
  if (storeUrl) {
    return (
      <a href={storeUrl} className={className} target="_blank" rel="noopener noreferrer">
        Add to {browser}, it&apos;s free
      </a>
    );
  }
  if (browser === "Mobile") {
    return (
      <Link href="/start/" className={className}>
        Open CodeRef Start
      </Link>
    );
  }
  return (
    <Link href="/start-page/extension/#other-browsers" className={className}>
      Use in {browser}
    </Link>
  );
}
