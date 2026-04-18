"use client";

/**
 * React Router DOM compatibility layer for Next.js migration.
 * Re-exports Next.js equivalents with the same API signatures
 * so existing components work without individual file changes.
 */

import NextLink from "next/link";
import {
  useRouter as useNextRouter,
  useParams as useNextParams,
  useSearchParams as useNextSearchParams,
  usePathname,
} from "next/navigation";
import React, { forwardRef } from "react";

// ─── useNavigate ───
export function useNavigate() {
  const router = useNextRouter();
  const navigate = (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === "number") {
      if (to === -1) router.back();
      else router.forward();
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
  return navigate;
}

// ─── useParams ───
export function useParams<
  T extends Record<string, string | string[]> = Record<string, string>,
>(): T {
  return useNextParams() as T;
}

// ─── useSearchParams ───
// React Router returns [searchParams, setSearchParams], Next.js returns just searchParams.
// We memoize the setter to avoid unnecessary re-renders.
export function useSearchParams(): [URLSearchParams, (params: URLSearchParams) => void] {
  const searchParams = useNextSearchParams();
  const router = useNextRouter();
  const pathname = usePathname();

  const setSearchParams = React.useCallback(
    (newParams: URLSearchParams) => {
      router.push(`${pathname}?${newParams.toString()}`);
    },
    [router, pathname],
  );

  // Return a tuple like React Router
  return [searchParams as unknown as URLSearchParams, setSearchParams];
}

// ─── useLocation ───
export function useLocation() {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  return {
    pathname,
    search: searchParams?.toString() ? `?${searchParams.toString()}` : "",
    hash: "",
    state: null,
    key: "default",
  };
}

// ─── Link ───
interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: string;
  replace?: boolean;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  state?: unknown;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, replace: shouldReplace, children, onClick, state: _state, ...rest }, ref) => {
    return (
      <NextLink
        href={to}
        replace={shouldReplace}
        ref={ref}
        onClick={onClick}
        prefetch={null}
        {...rest}
      >
        {children}
      </NextLink>
    );
  }
);
Link.displayName = "Link";

// ─── NavLink ───
interface NavLinkProps extends Omit<LinkProps, "className"> {
  end?: boolean;
  className?: string | ((props: { isActive: boolean }) => string);
}

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ to, end, className, children, state: _state, ...rest }, ref) => {
    const pathname = usePathname();
    const isActive = end ? pathname === to : pathname.startsWith(to);

    const resolvedClassName =
      typeof className === "function"
        ? className({ isActive })
        : className;

    return (
      <NextLink
        href={to}
        ref={ref}
        className={resolvedClassName}
        prefetch={null}
        {...rest}
      >
        {children}
      </NextLink>
    );
  }
);
NavLink.displayName = "NavLink";

// ─── Navigate (redirect component) ───
export function Navigate({ to, replace: shouldReplace }: { to: string; replace?: boolean }) {
  const router = useNextRouter();
  React.useEffect(() => {
    if (shouldReplace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, shouldReplace, router]);
  return null;
}

// ─── Outlet (for nested layouts) ───
// In Next.js, {children} replaces Outlet. This is a passthrough for compatibility.
export function Outlet({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

// ─── Routes & Route (for ProfileSection nested routing) ───
// These are compatibility shims for nested routing patterns.
// ProfileSection uses <Routes><Route> internally - we need to handle that.
interface RouteProps {
  path?: string;
  index?: boolean;
  element?: React.ReactElement;
  children?: React.ReactNode;
}

export function Route(_props: RouteProps) {
  return null;
}

export function Routes({ children: _children }: { children?: React.ReactNode }) {
  return null;
}

// Re-export BrowserRouter as a no-op wrapper for backward compat
export function BrowserRouter({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
