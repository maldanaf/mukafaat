import type { Metadata } from "next";
import { Suspense } from "react";
import { pageMetadata } from "@config/pageMetadata";
import BusinessRegistrationPage from "@business-registration/index";

export const metadata: Metadata = pageMetadata({
  title: "انضم كشريك | مكافآت",
  description:
    "سجّل نشاطك التجاري في منصة مكافآت وقدّم عروضك وخصوماتك لآلاف العملاء في السعودية.",
  path: "/business-registration",
});

export default function Page() {
  return (
    <Suspense>
      <BusinessRegistrationPage />
    </Suspense>
  );
}
