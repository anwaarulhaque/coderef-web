import Link from "next/link";

/** Small print shared by the DESIGN.md library pages. */
export function LibraryFootnote() {
  return (
    <p className="mt-10 text-xs text-muted">
      Brand names describe the visual style only; coderef is not affiliated with or endorsed by any brand listed.{" "}
      <Link href="/design-md/licenses/" className="underline hover:text-accent">
        Licenses
      </Link>
    </p>
  );
}
