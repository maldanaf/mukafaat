"use client";

/**
 * React Helmet Async compatibility layer for Next.js migration.
 *
 * In Next.js, metadata is handled via generateMetadata in server components.
 * This compatibility layer renders <head> elements using React portals
 * so existing page components work without changes.
 *
 * For SEO-critical pages, server-side generateMetadata is added in the
 * app/ page.tsx wrappers - this client-side Helmet still runs for
 * dynamic updates after hydration.
 */

import React, { useEffect } from "react";

interface HelmetProps {
  children?: React.ReactNode;
}

// Client-side Helmet that updates document.head
export function Helmet({ children }: HelmetProps) {
  useEffect(() => {
    const elements: HTMLElement[] = [];

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;

      const { type, props } = child;

      if (type === "title" && props.children) {
        document.title = String(props.children);
      } else if (type === "meta") {
        const meta = document.createElement("meta");
        Object.entries(props as Record<string, string>).forEach(
          ([key, value]) => {
            if (key === "children") return;
            meta.setAttribute(key === "className" ? "class" : key, value);
          }
        );
        // Remove existing meta with same name/property
        const selector = props.name
          ? `meta[name="${props.name}"]`
          : props.property
            ? `meta[property="${props.property}"]`
            : null;
        if (selector) {
          document.head.querySelector(selector)?.remove();
        }
        document.head.appendChild(meta);
        elements.push(meta);
      } else if (type === "link") {
        const link = document.createElement("link");
        Object.entries(props as Record<string, string>).forEach(
          ([key, value]) => {
            if (key === "children") return;
            link.setAttribute(key === "className" ? "class" : key, value);
          }
        );
        // Remove existing link with same rel+href
        if (props.rel === "canonical") {
          document.head.querySelector('link[rel="canonical"]')?.remove();
        }
        document.head.appendChild(link);
        elements.push(link);
      }
    });

    return () => {
      elements.forEach((el) => el.remove());
    };
  }, [children]);

  return null;
}

// HelmetProvider is a no-op in Next.js (metadata handled by the framework)
export function HelmetProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
