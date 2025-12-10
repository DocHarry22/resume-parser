"use client";

import { useState } from "react";
import ResumeUploadForm from "../components/ResumeUploadForm";
import ResumeResultCard from "../components/ResumeResultCard";
import ScoreBreakdown from "../components/ScoreBreakdown";
import TemplateGallery from "../components/TemplateGallery";
import ProductHeroHeader from "../components/ProductHeroHeader";
import { ParseAndScoreResponse } from "@/lib/types";

export default function ResumeScannerPage() {
  const [result, setResult] = useState<ParseAndScoreResponse | null>(null);

  const handleResult = (data: ParseAndScoreResponse) => {
    setResult(data);
    // Scroll to results
    setTimeout(() => {
      window.scrollTo({ top: 400, behavior: "smooth" });
    }, 100);
  };

  const handleReset = () => {
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleImportClick = () => {
    console.log("Import resume clicked");
    // TODO: Implement import resume functionality
  };

  const handleBuildClick = () => {
    console.log("Build resume clicked");
    window.scrollTo({ top: 600, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-16">
      {/* Product Hero Header */}
      <ProductHeroHeader 
        onImportClick={handleImportClick}
        onBuildClick={handleBuildClick}
      />
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900">Resume Scanner</h1>
          </div>
          <p className="mt-2 text-gray-600">
            Upload your resume to get instant feedback and a quality score
          </p>
        </div>
      </div>

      {/* Template Gallery Section */}
      <TemplateGallery />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Upload Section */}
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Upload Your Resume
            </h2>
            <ResumeUploadForm onResult={handleResult} />
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="mt-12">
            {/* Reset Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Scan Another Resume
              </button>
            </div>

            {/* Results Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Score Section */}
              <div className="order-1 md:order-2">
                <ScoreBreakdown score={result.score} />
              </div>

              {/* Resume Details Section */}
              <div className="order-2 md:order-1">
                <ResumeResultCard resume={result.resume} />
              </div>
            </div>
          </div>
        )}

        {/* Features Section (shown when no results) */}
        {!result && (
          <div className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 text-center mb-8">
              What You'll Get
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-md text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Parsed Content
                </h3>
                <p className="text-sm text-gray-600">
                  Extract contact info, experience, education, skills, and more
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Quality Score
                </h3>
                <p className="text-sm text-gray-600">
                  Get a comprehensive score based on readability, structure, and
                  content
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Actionable Feedback
                </h3>
                <p className="text-sm text-gray-600">
                  Receive suggestions to improve your resume and stand out
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>
            Resume Scanner • Powered by AI • Your data is processed securely
          </p>
        </div>
      </footer>
    </main>
  );
}
