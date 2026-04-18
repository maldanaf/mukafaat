"use client";
import { Suspense } from "react";
import RegisterPage from "@views/auth/RegisterPage";

export default function Page() {
  return (
    <Suspense>
      <RegisterPage />
    </Suspense>
  );
}
