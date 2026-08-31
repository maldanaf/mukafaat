"use client";

import React from "react";
import { usePathname } from "next/navigation";
import AccountShell from "./components/AccountShell";
import ProfilePage from "./ProfilePage";
import SubscribeForOtherPage from "./SubscribeForOtherPage";
import ReferralsPage from "./ReferralsPage";
import FamilyPage from "./FamilyPage";
import MyGiftsPage from "./MyGiftsPage";
import MySubscriptionPage from "@views/subscription/MySubscriptionPage";
import GiftInvoicePage from "./GiftInvoicePage";
import MembershipCardPage from "./MembershipCardPage";
import NotificationsPage from "./NotificationsPage";
import NotificationSettingsPage from "./NotificationSettingsPage";

const ProfileSection: React.FC = () => {
  const pathname = usePathname();

  // /profile/gifts/{subscriptionId} — فاتورة اشتراك مُهدى
  const giftInvoiceMatch = /^\/profile\/gifts\/([^/]+)\/?$/.exec(pathname ?? "");

  let content: React.ReactNode;
  if (pathname === "/profile/subscription") {
    content = <MySubscriptionPage />;
  } else if (pathname === "/profile/subscribe-for-other") {
    content = <SubscribeForOtherPage />;
  } else if (pathname === "/profile/referrals") {
    content = <ReferralsPage />;
  } else if (pathname === "/profile/family") {
    content = <FamilyPage />;
  } else if (pathname === "/profile/card") {
    content = <MembershipCardPage />;
  } else if (pathname === "/profile/notifications/settings") {
    content = <NotificationSettingsPage />;
  } else if (pathname === "/profile/notifications") {
    content = <NotificationsPage />;
  } else if (giftInvoiceMatch) {
    content = <GiftInvoicePage subscriptionId={giftInvoiceMatch[1]} />;
  } else if (pathname === "/profile/gifts") {
    content = <MyGiftsPage />;
  } else {
    content = <ProfilePage />;
  }

  return <AccountShell>{content}</AccountShell>;
};

export default ProfileSection;
