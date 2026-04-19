"use client";
import { Suspense } from "react";
import CategoryOffersPage from "@views/offers/[category]";
export default function Page() { return <Suspense><CategoryOffersPage /></Suspense>; }
