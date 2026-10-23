/**
 * gtax Enterprise - Next.js App Router Root Layout
 * Next.js 15+ Layout with HTML shell, metadata, and Tailwind CSS v4 support
 */

import React from "react";
import { NextLayoutProps } from "../types.ts";

export const metadata = {
  title: "gtax Enterprise - Municipal Property & Tax Liabilities Engine",
  description: "Next.js & React 19 Client Tier for Multi-Jurisdiction Municipal Property Valuation and Tax Engine",
};

export default function RootLayout({ children }: NextLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
