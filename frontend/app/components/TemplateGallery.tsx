"use client";

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  colorFrom: string;
  colorTo: string;
}

const templates: Template[] = [
  {
    id: "modern",
    name: "Modern Professional",
    category: "Modern",
    description: "Clean and contemporary design with focus on readability",
    colorFrom: "from-blue-500",
    colorTo: "to-blue-600"
  },
  {
    id: "creative",
    name: "Creative Designer",
    category: "Creative",
    description: "Bold and eye-catching layout for creative professionals",
    colorFrom: "from-purple-500",
    colorTo: "to-pink-500"
  },
  {
    id: "technical",
    name: "Technical Expert",
    category: "Technical",
    description: "Structured format ideal for engineers and developers",
    colorFrom: "from-green-500",
    colorTo: "to-teal-500"
  },
  {
    id: "simple",
    name: "Simple Classic",
    category: "Simple",
    description: "Timeless design that works for any industry",
    colorFrom: "from-gray-600",
    colorTo: "to-gray-800"
  }
];

export default function TemplateGallery() {
  const handleUseTemplate = (templateId: string) => {
    console.log("Selected template:", templateId);
    // TODO: Implement template selection logic
  };

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
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {templates.map((template) => (
          <div
            key={template.id}
            className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-105"
          >
            {/* Category Label */}
            <div className="px-6 pt-5 pb-3">
              <h3 className="text-xl font-semibold text-gray-800">
                {template.category}
              </h3>
            </div>

            {/* Template Preview Placeholder */}
            <div className="relative mx-6 mb-4 aspect-[3/4] rounded-lg overflow-hidden bg-gradient-to-br shadow-inner">
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${template.colorFrom} ${template.colorTo} opacity-10`}
              />
              
              {/* Mock Resume Content */}
              <div className="absolute inset-0 p-6 flex flex-col gap-3">
                {/* Header Lines */}
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                
                {/* Section 1 */}
                <div className="mt-4 space-y-1">
                  <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                </div>
                
                {/* Section 2 */}
                <div className="mt-3 space-y-1">
                  <div className="h-3 bg-gray-300 rounded w-2/5"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 rounded w-4/5"></div>
                  <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                </div>

                {/* Section 3 */}
                <div className="mt-3 space-y-1">
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                  <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg
                    className="w-12 h-12 text-white drop-shadow-lg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Template Info */}
            <div className="px-6 pb-5">
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {template.description}
              </p>

              {/* Use Template Button */}
              <button
                onClick={() => handleUseTemplate(template.id)}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
