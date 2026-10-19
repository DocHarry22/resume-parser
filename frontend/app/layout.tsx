import type { Metadata } from "next";
import "./globals.css";
import "./homepage.css";
import "./app-theme.css";
import "./resume-templates.css";
import "./letter-templates.css";
import "./workspace.css";
import "./tailor/tailor.css";
import "./history/history.css";
import "./letters/letters.css";
import "./jobs/jobs.css";
import "./auto-apply/auto-apply.css";
import "./salary-analyzer/salary.css";
import "./career-plan/plan.css";
import MainNavbar from "./components/MainNavbar";
import StorageNotice from "./components/StorageNotice";
import SiteFooter from "./components/SiteFooter";
import WorkspaceFrame from "@/components/workspace/WorkspaceFrame";

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
      <body className="career-theme">
        <WorkspaceFrame publicHeader={<><MainNavbar /><StorageNotice /></>} publicFooter={<SiteFooter />}>{children}</WorkspaceFrame>
      </body>
    </html>
  );
}
