"use client";

import React from "react";
import { usePathname } from "next/navigation";
import DashboardLayout from "@components/DashboardLayout";
import ProfilePage from "./ProfilePage";
import SubscribeForOtherPage from "./SubscribeForOtherPage";

const ProfileSection: React.FC = () => {
  const pathname = usePathname();

  let content: React.ReactNode;
  if (pathname === "/profile/subscribe-for-other") {
    content = <SubscribeForOtherPage />;
  } else {
    content = <ProfilePage />;
  }

  return <DashboardLayout>{content}</DashboardLayout>;
};

export default ProfileSection;
