"use client";

import Link from "next/link";
import { FiZap, FiCheckCircle, FiLayout, FiArrowRight, FiUpload } from "react-icons/fi";
import TemplateGallery from "./components/TemplateGallery";
import ProductHeroHeader from "./components/ProductHeroHeader";

export default function Home() {
  const handleImportClick = () => {
    console.log("Import resume clicked");
  };

  const handleBuildClick = () => {
    window.scrollTo({ top: 600, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 pt-16">
      {/* Product Hero Header */}
      <ProductHeroHeader 
        onImportClick={handleImportClick}
        onBuildClick={handleBuildClick}
      />

      {/* Main Hero Section */}
      <div className="bg-gradient-to-br from-[#061B2D] via-[#0a2540] to-[#082032] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Build Your Perfect Resume with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2BC4A8] to-[#4FD1C5]">AI Power</span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 leading-relaxed">
              Create ATS-optimized resumes, check compatibility, and land your dream job with our intelligent career tools
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/tools?view=scanner"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#2BC4A8] to-[#20a090] text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-[#2BC4A8]/30 hover:-translate-y-1 transition-all duration-200"
              >
                <FiCheckCircle size={24} />
                Check Your Resume
                <FiArrowRight size={20} />
              </Link>
              <Link
                href="/tools?view=builder"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border-2 border-white/20 hover:bg-white/20 transition-all duration-200"
              >
                <FiZap size={24} />
                Build New Resume
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Get Hired
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional tools powered by AI to create, optimize, and perfect your career documents
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Link
              href="/tools?view=scanner"
              className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:border-[#2BC4A8] hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2BC4A8]/10 to-[#20a090]/5 flex items-center justify-center mb-6 group-hover:from-[#2BC4A8] group-hover:to-[#20a090] transition-all duration-300">
                <FiCheckCircle className="text-[#2BC4A8] group-hover:text-white transition-colors" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#2BC4A8] transition-colors">
                ATS Resume Checker
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Upload your resume and get instant ATS compatibility analysis with detailed scoring and optimization tips
              </p>
              <div className="flex items-center text-[#2BC4A8] font-semibold group-hover:gap-2 transition-all">
                Try it now
                <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Feature 2 */}
            <Link
              href="/tools?view=builder"
              className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:border-[#2BC4A8] hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2BC4A8]/10 to-[#20a090]/5 flex items-center justify-center mb-6 group-hover:from-[#2BC4A8] group-hover:to-[#20a090] transition-all duration-300">
                <FiZap className="text-[#2BC4A8] group-hover:text-white transition-colors" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#2BC4A8] transition-colors">
                AI Resume Builder
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Create professional resumes with AI-powered suggestions, smart formatting, and industry-specific templates
              </p>
              <div className="flex items-center text-[#2BC4A8] font-semibold group-hover:gap-2 transition-all">
                Start building
                <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Feature 3 */}
            <Link
              href="/tools?view=templates"
              className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:border-[#2BC4A8] hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2BC4A8]/10 to-[#20a090]/5 flex items-center justify-center mb-6 group-hover:from-[#2BC4A8] group-hover:to-[#20a090] transition-all duration-300">
                <FiLayout className="text-[#2BC4A8] group-hover:text-white transition-colors" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#2BC4A8] transition-colors">
                Resume Templates
              </h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Browse 50+ professional templates designed for different industries and career levels
              </p>
              <div className="flex items-center text-[#2BC4A8] font-semibold group-hover:gap-2 transition-all">
                Browse templates
                <FiArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Template Gallery */}
      <div className="pb-20">
        <TemplateGallery />
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#061B2D] to-[#0a2540] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Join thousands of job seekers who've improved their resumes with CareerForge AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/tools?view=scanner"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#2BC4A8] to-[#20a090] text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-[#2BC4A8]/30 hover:-translate-y-1 transition-all duration-200"
            >
              <FiUpload size={24} />
              Check Your Resume Now
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
