"use client";
import { Suspense } from "react";
import CardOfferDetailPage from "@views/cards/[companyId]/offer/[offerId]";
export default function Page() { return <Suspense><CardOfferDetailPage /></Suspense>; }
