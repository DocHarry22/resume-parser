import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MainNavbar from "./components/MainNavbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Resume Scanner - AI-Powered Resume Analysis",
  description: "Upload your resume and get instant feedback with quality scoring, parsed content, and actionable suggestions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MainNavbar />
        {children}
      </body>
    </html>
  );
}
