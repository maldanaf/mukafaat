import { AboutUsModel, ContactInfosModel } from "@entities";

const isBrowser = typeof window !== "undefined";

export const setLocalAboutUs = (aboutUs: string): void => {
  if (isBrowser) localStorage.setItem("aboutUs", aboutUs);
};

export const setLocalContactInfos = (contactInfos: string): void => {
  if (isBrowser) localStorage.setItem("contactInfos", contactInfos);
};

export const getLocalAboutUs = (): AboutUsModel | null => {
  if (!isBrowser) return null;
  const aboutUs = localStorage.getItem("aboutUs");
  return aboutUs !== null ? JSON.parse(aboutUs) : null;
};

export const getLocalContactInfos = (): ContactInfosModel | null => {
  if (!isBrowser) return null;
  const contactInfos = localStorage.getItem("contactInfos");
  return contactInfos !== null ? JSON.parse(contactInfos) : null;
};

export const removeLocalAboutUs = (): void => {
  if (isBrowser) localStorage.removeItem("aboutUs");
};

export const removeLocalContactInfos = (): void => {
  if (isBrowser) localStorage.removeItem("contactInfos");
};
