export type AppVariant = "personal" | "school";

export const appVariant: AppVariant =
  process.env.NEXT_PUBLIC_APP_VARIANT === "school" ? "school" : "personal";

export const isSchoolVariant = appVariant === "school";

export const personalSiteUrl = process.env.NEXT_PUBLIC_PERSONAL_SITE_URL;
export const schoolSiteUrl = process.env.NEXT_PUBLIC_SCHOOL_SITE_URL;
