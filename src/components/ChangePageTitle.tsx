"use client";

import { useEffect } from "react";
import { Helmet } from "@/lib/helmet-compat";

const ChangePageTitle = (props: {
  pageTitle: string;
  path?: string;
  description?: string;
}) => {
  useEffect(() => {
    document.title = props.pageTitle;
  }, [props.pageTitle]);

  return (
    <Helmet>
      <title>{props.pageTitle}</title>
      <link rel="canonical" href={`https://mukafaat.com.sa${props.path || "/"}`} />
      <meta name="description" content={props.description || ""} />
      <meta property="og:title" content={props.pageTitle} />
      <meta property="og:description" content={props.description || ""} />
    </Helmet>
  );
};

export default ChangePageTitle;
