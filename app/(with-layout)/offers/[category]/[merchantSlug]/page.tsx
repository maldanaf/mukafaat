"use client";
import { Suspense } from "react";
import RestaurantDetailsPage from "@views/offers/[category]/[restaurantId]";
export default function Page() { return <Suspense><RestaurantDetailsPage /></Suspense>; }
