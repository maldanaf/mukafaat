"use client";
import { Suspense } from "react";
import PaymentPage from "@views/cards/[companyId]/payment";
export default function Page() { return <Suspense><PaymentPage /></Suspense>; }
