"use client";
import { Suspense } from "react";
import CompanyDetailsPage from "@views/cards/[companyId]";
export default function Page() { return <Suspense><CompanyDetailsPage /></Suspense>; }
