import { redirect } from "next/navigation";

// Billing history now lives on the subscription page; keep old links working.
export default function Page() {
  redirect("/account/subscription/");
}
