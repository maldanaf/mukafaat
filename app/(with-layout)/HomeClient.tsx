"use client";
import { Suspense } from "react";
import HomePage from "@views/home";

export default function HomeClient() {
  return (
    <Suspense>
      <HomePage />
    </Suspense>
  );
}
