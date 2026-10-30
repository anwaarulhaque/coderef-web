import { AccountShell } from "@/components/account/dashboard/AccountShell";
import { PageHeader } from "@/components/layout/PageHeader";

// Every /account/ page shares the side menu. Signed-out visitors see only the sign-in form.
export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Your account" crumbs={[{ href: "/", label: "Home" }, { label: "Account" }]} />
      <AccountShell>{children}</AccountShell>
    </>
  );
}
