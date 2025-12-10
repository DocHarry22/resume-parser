"use client";

interface ProductHeroHeaderProps {
  onImportClick: () => void;
  onBuildClick: () => void;
}

export default function ProductHeroHeader({
  onImportClick,
  onBuildClick,
}: ProductHeroHeaderProps) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const employerLogos = [
    { name: "Boeing", width: "120" },
    { name: "Medtronic", width: "140" },
    { name: "Google", width: "110" },
    { name: "Amazon", width: "130" },
    { name: "Verizon", width: "120" },
  ];

  return (
    <section className="w-full bg-[#082032] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8 text-sm text-gray-300">
          <ol className="flex items-center space-x-2">
            <li>
              <a href="/" className="hover:text-teal-400 transition-colors">
                AI Resume Builder
              </a>
            </li>
            <li className="text-gray-500">»</li>
            <li>
              <a href="/templates" className="hover:text-teal-400 transition-colors">
                Resume Templates
              </a>
            </li>
            <li className="text-gray-500">»</li>
            <li className="text-white font-medium">PDF Resume Templates</li>
          </ol>
        </nav>

        {/* Main Hero Content */}
        <div className="grid lg:grid-cols-2 gap-12 mb-12">
          {/* Left Column - Headline */}
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="font-serif">PDF Resume Templates</span>
              <br />
              <span className="text-3xl sm:text-4xl lg:text-5xl font-normal text-gray-200">
                (Customize & Download)
              </span>
            </h1>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={onImportClick}
                className="px-8 py-4 border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-[#082032] transition-all duration-300 text-lg"
              >
                Import existing resume
              </button>
              <button
                onClick={onBuildClick}
                className="px-8 py-4 bg-teal-500 text-white font-bold rounded-full hover:bg-teal-600 hover:shadow-lg transition-all duration-300 text-lg shadow-md"
              >
                Build my resume
              </button>
            </div>
          </div>

          {/* Right Column - Description & Social Proof */}
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-lg text-gray-200 leading-relaxed">
                Build your resume on any device with customizable PDF resume templates.
                Browse examples and stand out to get hired faster.
              </p>
              <p className="text-sm text-gray-400">
                Last Updated: {currentDate}
              </p>
            </div>

            {/* Trustpilot Rating */}
            <div className="flex items-center gap-4 pt-4">
              {/* Trustpilot Logo Placeholder */}
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                <svg
                  className="w-6 h-6 text-green-400"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                <span className="font-semibold text-white">Trustpilot</span>
              </div>

              {/* Star Rating */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-300 mt-1">
                  <span className="font-semibold">16,872 reviews</span> — Excellent
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Employer Logo Trust Bar */}
        <div className="border-t border-gray-700 pt-8">
          <p className="text-center text-sm text-gray-400 mb-6">
            Our customers have been hired at:*
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
            {employerLogos.map((logo) => (
              <div
                key={logo.name}
                className="group transition-all duration-300"
                style={{ width: logo.width + "px" }}
              >
                {/* Logo Placeholder - Grayscale with hover effect */}
                <div className="h-12 flex items-center justify-center bg-white/5 rounded-lg px-4 py-2 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 group-hover:bg-white/10">
                  <span className="text-white font-bold text-lg tracking-wide">
                    {logo.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 mt-6">
            * Based on our customer success stories and testimonials
          </p>
        </div>
      </div>
    </section>
  );
}
