import { CDN_URL } from "@/lib/design-md-shared";

/** Small print shared by the DESIGN.md library pages. The license notices the MIT/Apache sources require are
 * published with the data on the CDN. */
export function LibraryFootnote() {
  return (
    <p className="mt-10 text-xs text-muted">
      Brand names describe the visual style only; coderef is not affiliated with or endorsed by any brand listed.{" "}
      <a href={`${CDN_URL}/data/design-md/THIRD_PARTY_LICENSES.md`} target="_blank" rel="noopener" className="underline hover:text-accent">
        Licenses
      </a>
    </p>
  );
}
