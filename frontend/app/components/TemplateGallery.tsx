"use client";

import Link from "next/link";

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  colorFrom: string;
  colorTo: string;
  previewBg: string;
}

const templates: Template[] = [
  {
    id: "modern",
    name: "Modern Sidebar",
    category: "Modern",
    description: "Contemporary design with colored sidebar, perfect for creative professionals",
    colorFrom: "from-blue-500",
    colorTo: "to-blue-600",
    previewBg: "bg-gradient-to-r from-blue-100 to-blue-50"
  },
  {
    id: "classic",
    name: "Classic Professional",
    category: "Classic",
    description: "Traditional two-column layout, ideal for corporate positions",
    colorFrom: "from-gray-700",
    colorTo: "to-gray-900",
    previewBg: "bg-gradient-to-r from-gray-100 to-gray-50"
  },
  {
    id: "minimal",
    name: "Clean Minimal",
    category: "Minimal",
    description: "Simple and elegant design focusing on content clarity",
    colorFrom: "from-slate-600",
    colorTo: "to-slate-800",
    previewBg: "bg-white"
  },
  {
    id: "professional",
    name: "Professional Executive",
    category: "Professional",
    description: "Sophisticated layout with accent bars, great for senior roles",
    colorFrom: "from-indigo-600",
    colorTo: "to-indigo-800",
    previewBg: "bg-gradient-to-r from-indigo-50 to-blue-50"
  },
  {
    id: "creative",
    name: "Creative Bold",
    category: "Creative",
    description: "Eye-catching design with unique sections for creative fields",
    colorFrom: "from-purple-500",
    colorTo: "to-pink-500",
    previewBg: "bg-gradient-to-r from-purple-50 to-pink-50"
  },
  {
    id: "elegant",
    name: "Elegant Serif",
    category: "Elegant",
    description: "Refined typography and spacing for traditional industries",
    colorFrom: "from-teal-600",
    colorTo: "to-emerald-600",
    previewBg: "bg-gradient-to-r from-teal-50 to-emerald-50"
  }
];

export default function TemplateGallery() {

  return (
    <div className="w-full py-16 px-4 bg-gray-50">
      {/* Section Header */}
      <div className="max-w-7xl mx-auto mb-12 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Choose Your Resume Template
        </h2>
        <p className="text-lg text-gray-600">
          Select a professional template that best matches your style and industry
        </p>
      </div>

      {/* Template Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {templates.map((template) => (
          <Link
            key={template.id}
            href={`/builder?template=${template.id}`}
            className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-105"
          >
            {/* Template Name */}
            <div className="px-6 pt-5 pb-3">
              <h3 className="text-xl font-semibold text-gray-800">
                {template.name}
              </h3>
              <span className="inline-block mt-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                {template.category}
              </span>
            </div>

            {/* Template Preview */}
            <div className={`relative mx-6 mb-4 aspect-[8.5/11] rounded-lg overflow-hidden shadow-lg border border-gray-200`}>
              {/* PDF Preview as iframe */}
              <iframe
                src={`/templates/${template.id}.pdf#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full pointer-events-none"
                title={`${template.name} preview`}
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center pointer-events-none">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className={`px-3 py-1.5 bg-gradient-to-r ${template.colorFrom} ${template.colorTo} text-white rounded-lg text-xs font-semibold shadow-lg`}>
                    Preview
                  </div>
                </div>
              </div>
            </div>

            {/* Template Info */}
            <div className="px-6 pb-5">
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Use Template Button */}
              <div className={`w-full py-2.5 px-4 bg-gradient-to-r ${template.colorFrom} ${template.colorTo} text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group-hover:shadow-lg`}>
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Use Template
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
