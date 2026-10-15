import type { Metadata } from "next";
import "./globals.css";
import MainNavbar from "./components/MainNavbar";

export const metadata: Metadata = {
  title: "CareerForge | DoCHEng Resume Studio",
  description: "Build and improve your CV, write a cover letter, and organize your next career move with DoCHEng CareerForge.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <MainNavbar />
        {process.env.NEXT_PUBLIC_SITE_MODE === '1' && <aside className="no-print relative mt-16 border-b border-teal-200 bg-teal-50 px-5 py-3 text-center text-sm text-teal-950">Browser workspace edition: edit resumes, export backups and track applications here. For document processing, AI and server-saved letters, <a className="font-semibold underline" href="https://resume.docheng.co.za/">continue in the main DoCHEng app</a>.</aside>}
        {children}
      </body>
    </html>
  );
}
