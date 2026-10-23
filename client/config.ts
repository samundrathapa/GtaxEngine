import { ClientAppConfig } from "./types.ts";

export const clientConfig: ClientAppConfig = {
  appName: "gtax Enterprise Tax Liabilities & Architecture Engine",
  version: "2.5.0",
  apiBaseUrl: "/api/v1",
  singleCommonEntry: "/api/v1/entry/manifest",
  flutterDeploymentReady: true,
  framework: "Next.js 15 App Router / React 19",
};

export const isMobileBrowser = (): boolean => {
  if (typeof window === "undefined" || !window.navigator) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};
