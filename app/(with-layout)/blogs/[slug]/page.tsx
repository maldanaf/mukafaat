"use client";
import { Suspense } from "react";
import BlogArticlePage from "@views/blogs/[slug]";
export default function Page() { return <Suspense><BlogArticlePage /></Suspense>; }
