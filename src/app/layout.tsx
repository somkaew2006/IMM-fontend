import type { Metadata } from "next";
import { Kanit, Geist_Mono } from "next/font/google";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
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
      className={`${kanit.variable} ${geistMono.variable} antialiased h-full`}
    >
      <body className="h-full m-0 p-0 overflow-y-auto font-sans" suppressHydrationWarning>
        <AntdRegistry>
          <AdminLayout>{children}</AdminLayout>
        </AntdRegistry>
      </body>
    </html>
  );
}
