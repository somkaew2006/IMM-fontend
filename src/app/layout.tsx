import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import AdminLayout from "@/components/layout/AdminLayout";

export const metadata: Metadata = {
  title: "ERP System Dashboard",
  description: "Enterprise Resource Planning dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
    >
      <body className="h-full m-0 p-0 overflow-hidden font-sans">
        <AntdRegistry>
          <AdminLayout>{children}</AdminLayout>
        </AntdRegistry>
      </body>
    </html>
  );
}
