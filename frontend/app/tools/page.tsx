"use client";

import { useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { 
  FiUpload, FiFile, FiCheck, FiAlertCircle, FiChevronDown, FiChevronUp, 
  FiZap, FiTarget, FiAward, FiInfo, FiX, FiRefreshCw, FiTrendingUp,
  FiStar, FiShield, FiLayers, FiGrid, FiCpu, FiActivity, FiEye,
  FiMinimize2
} from "react-icons/fi";
import { parseAndScoreResume } from "@/lib/apiClient";
import { ParseAndScoreResponse, ScanMode as ScanModeType } from "@/lib/types";
import { 
  compressFile, 
  needsCompression, 
  formatFileSize, 
  isCompressionSupported,
  CompressionProgress,
  CompressionResult
} from "@/lib/fileCompression";

type ScanMode = ScanModeType;
type Industry = "default" | "engineering" | "it-software" | "finance" | "healthcare";

export default function ToolsPage() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");

  if (view === "scanner") {
    return <ATSScannerView />;
  }

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900">Tools</h1>
        <p className="text-gray-600 mt-2">Select a tool from the navigation</p>
      </div>
    </div>
  );
}

function ATSScannerView() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [showJobDesc, setShowJobDesc] = useState(false);
  const [industry, setIndustry] = useState<Industry>("default");
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ParseAndScoreResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Compression states
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<CompressionProgress | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);

  // Process and optionally compress file
  const processFile = useCallback(async (selectedFile: File) => {
    const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase();
    if (fileExtension !== "pdf" && fileExtension !== "docx") {
      setError("Please upload a PDF or DOCX file");
      setFile(null);
      return;
    }

    setError(null);
    setResult(null);
    setCompressionResult(null);

    const maxSize = 25 * 1024 * 1024; // 25MB (backend limit)
    const targetSize = 15 * 1024 * 1024; // 15MB target for compression
    
    // Check if file needs compression
    if (selectedFile.size > targetSize && isCompressionSupported(selectedFile)) {
      setIsCompressing(true);
      setCompressionProgress({ stage: 'reading', progress: 0, message: 'Preparing compression...' });
      
      try {
        const result = await compressFile(selectedFile, setCompressionProgress);
        setCompressionResult(result);
        
        if (result.wasCompressed && result.compressedFile.size <= maxSize) {
          setFile(result.compressedFile);
        } else if (result.compressedFile.size > maxSize) {
          setError(`File is still too large after compression (${formatFileSize(result.compressedFile.size)}). Maximum size is 25MB. Please use a smaller file.`);
          setFile(null);
        } else {
          setFile(result.compressedFile);
        }
      } catch (err) {
        setError("Failed to compress file. Please try a smaller file.");
        setFile(null);
      } finally {
        setIsCompressing(false);
        setCompressionProgress(null);
      }
    } else if (selectedFile.size > maxSize) {
      setError(`File too large (${formatFileSize(selectedFile.size)}). Maximum size is 25MB.`);
      setFile(null);
    } else {
      setFile(selectedFile);
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  }, [processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleScan = async (mode: ScanMode) => {
    if (!file) return;

    setScanning(true);
    setScanMode(mode);
    setProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 8, 90));
    }, 150);

    try {
      const data = await parseAndScoreResume(
        file, 
        mode, 
        jobDescription || undefined,
        industry !== 'default' ? industry : undefined
      );
      clearInterval(progressInterval);
      setProgress(100);
      
      setResult(data);
      setTimeout(() => {
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Failed to scan resume");
      setProgress(0);
    } finally {
      setScanning(false);
    }
  };

  const resetScan = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setScanMode(null);
    setJobDescription("");
    setCompressionResult(null);
    setCompressionProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen pt-16 bg-[#0a0f1a]">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#2BC4A8]/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/3 rounded-full blur-[150px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Premium Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#2BC4A8]/10 to-purple-500/10 border border-[#2BC4A8]/20 mb-6">
            <FiShield className="text-[#2BC4A8]" size={16} />
            <span className="text-sm font-medium text-[#2BC4A8]">AI-Powered Analysis</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
            ATS Resume Scanner
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Beat the bots. Get instant, actionable feedback with our enterprise-grade resume analysis engine.
          </p>
          
          {/* Stats Row */}
          <div className="flex flex-wrap justify-center gap-8 mt-10">
            <StatBadge icon={<FiCpu size={18} />} label="98% ATS Accuracy" />
            <StatBadge icon={<FiActivity size={18} />} label="50+ Metrics Analyzed" />
            <StatBadge icon={<FiEye size={18} />} label="Recruiter Insights" />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-5 gap-8">
          {/* LEFT PANEL - Upload & Controls (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <div className="relative bg-gradient-to-b from-gray-900/80 to-gray-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-8 overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#2BC4A8]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2BC4A8] to-[#20a090] flex items-center justify-center shadow-lg shadow-[#2BC4A8]/25">
                    <FiUpload className="text-white" size={26} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Upload Resume</h2>
                    <p className="text-sm text-gray-400">PDF or DOCX • Max 25MB</p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="resume-upload"
                />

                {!file && !isCompressing ? (
                  <label
                    htmlFor="resume-upload"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center w-full h-52 border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer ${
                      dragActive 
                        ? "border-[#2BC4A8] bg-[#2BC4A8]/10 scale-[1.02]" 
                        : "border-gray-600 hover:border-[#2BC4A8]/60 bg-gray-800/30 hover:bg-gray-800/50"
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-2xl mb-4 flex items-center justify-center transition-all duration-300 ${
                      dragActive ? "bg-[#2BC4A8]/20" : "bg-gray-700/50"
                    }`}>
                      <FiUpload className={`transition-colors duration-300 ${dragActive ? "text-[#2BC4A8]" : "text-gray-400"}`} size={32} />
                    </div>
                    <p className="text-gray-300 font-semibold mb-1">Drop your resume here</p>
                    <p className="text-sm text-gray-500">or click to browse</p>
                    <p className="text-xs text-gray-600 mt-2">Large files will be automatically compressed</p>
                  </label>
                ) : isCompressing ? (
                  <div className="relative bg-gradient-to-r from-purple-500/10 to-[#2BC4A8]/10 rounded-2xl p-6 border border-purple-500/30">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center border border-white/10 animate-pulse">
                        <FiMinimize2 className="text-white" size={28} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white">Compressing file...</p>
                        <p className="text-sm text-gray-400">{compressionProgress?.message || 'Please wait...'}</p>
                        <div className="mt-3">
                          <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-[#2BC4A8] transition-all duration-300 rounded-full"
                              style={{ width: `${compressionProgress?.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : file ? (
                  <div className="relative bg-gradient-to-r from-[#2BC4A8]/10 to-purple-500/10 rounded-2xl p-6 border border-[#2BC4A8]/30">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border border-white/10">
                        <FiFile className="text-[#2BC4A8]" size={28} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{file.name}</p>
                        <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                            <FiCheck size={12} />
                            Ready
                          </span>
                          {compressionResult?.wasCompressed && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                              <FiMinimize2 size={12} />
                              Compressed {compressionResult.compressionRatio.toFixed(0)}%
                            </span>
                          )}
                        </div>
                        {compressionResult?.wasCompressed && (
                          <p className="text-xs text-gray-500 mt-2">
                            Original: {formatFileSize(compressionResult.originalSize)} → {formatFileSize(compressionResult.compressedSize)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={resetScan}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                      >
                        <FiX size={20} />
                      </button>
                    </div>

                    {scanning && (
                      <div className="mt-6">
                        <div className="flex justify-between text-sm mb-3">
                          <span className="text-gray-300 font-medium">Analyzing resume...</span>
                          <span className="text-[#2BC4A8] font-bold">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#2BC4A8] to-[#20a090] transition-all duration-300 rounded-full relative"
                            style={{ width: `${progress}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                {error && (
                  <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                    <FiAlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Industry & Job Description */}
            <div className="bg-gradient-to-b from-gray-900/80 to-gray-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-6 space-y-4">
              {/* Industry Selector */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
                  <FiGrid size={16} className="text-[#2BC4A8]" />
                  Industry Optimization
                </label>
                <div className="relative">
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value as Industry)}
                    className="w-full px-4 py-3.5 bg-gray-800/80 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#2BC4A8]/50 focus:border-[#2BC4A8] appearance-none cursor-pointer transition-all"
                  >
                    <option value="default">🎯 All Industries</option>
                    <option value="engineering">⚙️ Engineering</option>
                    <option value="it-software">💻 IT / Software</option>
                    <option value="finance">📊 Finance</option>
                    <option value="healthcare">🏥 Healthcare</option>
                  </select>
                  <FiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>

              {/* Job Description Toggle */}
              <div className="pt-2">
                <button
                  onClick={() => setShowJobDesc(!showJobDesc)}
                  className="flex items-center justify-between w-full text-left p-3 rounded-xl hover:bg-gray-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FiLayers size={16} className="text-purple-400" />
                    <span className="text-sm font-semibold text-gray-300">Job Description Match</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium">Optional</span>
                  </div>
                  <FiChevronDown className={`text-gray-400 transition-transform duration-300 ${showJobDesc ? "rotate-180" : ""}`} size={18} />
                </button>
                
                {showJobDesc && (
                  <div className="mt-3 animate-fadeIn">
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description to get a tailored match score..."
                      className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-none transition-all"
                      rows={5}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Scan Mode Buttons */}
            <div className="bg-gradient-to-b from-gray-900/80 to-gray-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
              <h3 className="flex items-center gap-3 text-lg font-bold text-white mb-6">
                <FiZap className="text-[#2BC4A8]" size={20} />
                Choose Scan Mode
              </h3>
              
              <div className="space-y-4">
                <ScanButton
                  mode="basic"
                  label="Quick Scan"
                  description="Format check + key sections"
                  icon={<FiCheck size={22} />}
                  onClick={() => handleScan("basic")}
                  disabled={!file || scanning}
                  scanning={scanning && scanMode === "basic"}
                  color="blue"
                />
                
                <ScanButton
                  mode="ats"
                  label="ATS Pro Scan"
                  description="Keywords + readability + ATS simulation"
                  icon={<FiTarget size={22} />}
                  onClick={() => handleScan("ats")}
                  disabled={!file || scanning}
                  scanning={scanning && scanMode === "ats"}
                  recommended
                  color="teal"
                />
                
                <ScanButton
                  mode="expert"
                  label="Expert Recruiter"
                  description="Full analysis + achievement scoring"
                  icon={<FiAward size={22} />}
                  onClick={() => handleScan("expert")}
                  disabled={!file || scanning}
                  scanning={scanning && scanMode === "expert"}
                  color="purple"
                />
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - Results Dashboard (3 cols) */}
          <div className="lg:col-span-3 lg:sticky lg:top-20 lg:self-start">
            {!result ? (
              <div className="bg-gradient-to-b from-gray-900/80 to-gray-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-16 text-center">
                <div className="relative w-32 h-32 mx-auto mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2BC4A8]/20 to-purple-500/20 rounded-full blur-xl" />
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 flex items-center justify-center">
                    <FiZap className="text-gray-500" size={48} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Ready to Analyze</h3>
                <p className="text-gray-400 max-w-sm mx-auto">
                  Upload your resume and choose a scan mode to receive detailed AI-powered feedback
                </p>
                
                {/* Feature List */}
                <div className="mt-10 grid grid-cols-2 gap-4 text-left">
                  <FeatureItem icon={<FiShield size={18} />} text="ATS Compatibility Score" />
                  <FeatureItem icon={<FiTrendingUp size={18} />} text="Keyword Optimization" />
                  <FeatureItem icon={<FiStar size={18} />} text="Achievement Analysis" />
                  <FeatureItem icon={<FiRefreshCw size={18} />} text="Actionable Suggestions" />
                </div>
              </div>
            ) : (
              <div id="results" className="space-y-6 animate-fadeIn">
                <ScoreDashboard result={result} jobDescription={jobDescription} />
                <FixSuggestions result={result} />
                <SectionAnalysis result={result} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function StatBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-white/5">
      <span className="text-[#2BC4A8]">{icon}</span>
      <span className="text-sm font-medium text-gray-300">{label}</span>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/30 border border-white/5">
      <span className="text-[#2BC4A8]">{icon}</span>
      <span className="text-sm text-gray-300">{text}</span>
    </div>
  );
}

// ============================================
// SCAN BUTTON COMPONENT
// ============================================
function ScanButton({
  mode,
  label,
  description,
  icon,
  onClick,
  disabled,
  scanning,
  recommended = false,
  color = "teal",
}: {
  mode: ScanMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  scanning: boolean;
  recommended?: boolean;
  color?: "teal" | "blue" | "purple";
}) {
  const colorClasses = {
    teal: {
      gradient: "from-[#2BC4A8] to-[#20a090]",
      shadow: "shadow-[#2BC4A8]/25",
      bg: "from-[#2BC4A8]/10 to-[#20a090]/5",
      border: "border-[#2BC4A8]/40",
      ring: "ring-[#2BC4A8]/30",
    },
    blue: {
      gradient: "from-blue-500 to-blue-600",
      shadow: "shadow-blue-500/25",
      bg: "from-blue-500/10 to-blue-600/5",
      border: "border-blue-500/40",
      ring: "ring-blue-500/30",
    },
    purple: {
      gradient: "from-purple-500 to-purple-600",
      shadow: "shadow-purple-500/25",
      bg: "from-purple-500/10 to-purple-600/5",
      border: "border-purple-500/40",
      ring: "ring-purple-500/30",
    },
  };

  const colors = colorClasses[color];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full text-left p-5 rounded-2xl border transition-all duration-300 group ${
        disabled
          ? "bg-gray-800/30 border-gray-700/50 opacity-40 cursor-not-allowed"
          : recommended
          ? `bg-gradient-to-r ${colors.bg} ${colors.border} hover:shadow-lg ${colors.shadow} hover:-translate-y-1 hover:scale-[1.02]`
          : `bg-gray-800/40 border-gray-700 hover:${colors.border} hover:shadow-lg hover:-translate-y-1`
      }`}
    >
      {recommended && (
        <span className={`absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r ${colors.gradient} text-white text-xs font-bold rounded-full shadow-lg ${colors.shadow}`}>
          ✨ Recommended
        </span>
      )}
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          recommended 
            ? `bg-gradient-to-br ${colors.gradient} text-white shadow-lg ${colors.shadow}` 
            : `bg-gray-700/60 text-gray-400 group-hover:bg-gradient-to-br group-hover:${colors.gradient} group-hover:text-white`
        }`}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-white mb-1 text-lg">{label}</h4>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
        {scanning && (
          <div className="flex-shrink-0">
            <div className={`w-7 h-7 border-3 border-t-transparent rounded-full animate-spin ${
              color === "teal" ? "border-[#2BC4A8]" : color === "blue" ? "border-blue-500" : "border-purple-500"
            }`} />
          </div>
        )}
      </div>
    </button>
  );
}

// ============================================
// SCORE DASHBOARD
// ============================================
function ScoreDashboard({ result, jobDescription }: { result: ParseAndScoreResponse; jobDescription: string }) {
  const { score } = result;
  const overallScore = Math.round(score.overall);
  
  // Use actual backend scores (convert to percentages)
  const atsCompliance = Math.round(score.ats_compliance);
  const readability = Math.round(score.readability);
  const experienceQuality = score.experience !== null ? Math.round(score.experience) : null;
  const skillsRelevance = score.skills !== null ? Math.round(score.skills) : null;
  const layoutFormatting = Math.round(score.layout);
  const jobMatch = score.job_match !== null && score.job_match !== undefined ? Math.round(score.job_match) : null;

  const getGrade = (score: number) => {
    if (score >= 90) return { letter: "A+", color: "text-green-400" };
    if (score >= 80) return { letter: "A", color: "text-green-400" };
    if (score >= 70) return { letter: "B", color: "text-yellow-400" };
    if (score >= 60) return { letter: "C", color: "text-orange-400" };
    return { letter: "D", color: "text-red-400" };
  };

  const grade = getGrade(overallScore);
  const isBasicMode = score.mode === 'basic';

  return (
    <div className="bg-gradient-to-b from-gray-900/80 to-gray-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-8 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2BC4A8]/10 rounded-full blur-[80px] pointer-events-none" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Score Dashboard</h2>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
              score.mode === 'expert' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
              score.mode === 'ats' ? 'bg-[#2BC4A8]/20 text-[#2BC4A8] border border-[#2BC4A8]/30' :
              'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
              {score.mode === 'expert' ? '✨ Expert' : score.mode === 'ats' ? '🎯 ATS Pro' : '⚡ Quick Scan'}
            </span>
          </div>
        </div>
        
        {/* Overall Score - Centered */}
        <div className="flex flex-col lg:flex-row items-center gap-8 mb-10">
          <CircularScore score={overallScore} />
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-5xl font-black ${grade.color}`}>{grade.letter}</span>
              <span className="text-gray-500 text-lg">Grade</span>
            </div>
            <p className="text-gray-400 max-w-xs">
              {overallScore >= 80 
                ? "Excellent! Your resume is highly optimized for ATS systems." 
                : overallScore >= 60 
                ? "Good foundation. A few improvements can boost your score significantly."
                : "Your resume needs optimization to pass ATS filters effectively."}
            </p>
          </div>
        </div>

        {/* Flags/Warnings for Expert Mode */}
        {score.flags && score.flags.length > 0 && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-red-400 mb-2">
              <FiAlertCircle size={16} />
              Important Flags
            </h4>
            <ul className="space-y-1">
              {score.flags.map((flag, idx) => (
                <li key={idx} className="text-sm text-red-300 flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Individual Scores Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <ScoreBar label="ATS Compliance" score={atsCompliance} icon={<FiShield size={16} />} />
          {jobMatch !== null && (
            <ScoreBar label="Job Match" score={jobMatch} icon={<FiTarget size={16} />} badge="MATCH" />
          )}
          <ScoreBar label="Readability" score={readability} icon={<FiEye size={16} />} />
          {!isBasicMode && experienceQuality !== null && (
            <ScoreBar label="Experience Quality" score={experienceQuality} icon={<FiStar size={16} />} />
          )}
          {!isBasicMode && skillsRelevance !== null && (
            <ScoreBar label="Skills Relevance" score={skillsRelevance} icon={<FiCpu size={16} />} />
          )}
          <ScoreBar label="Layout & Format" score={layoutFormatting} icon={<FiGrid size={16} />} />
        </div>
      </div>
    </div>
  );
}

function CircularScore({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 80) return { from: "#22c55e", to: "#16a34a" }; // Green
    if (score >= 60) return { from: "#eab308", to: "#ca8a04" }; // Yellow
    return { from: "#ef4444", to: "#dc2626" }; // Red
  };

  const colors = getColor(score);

  return (
    <div className="relative w-48 h-48 flex-shrink-0">
      {/* Glow effect */}
      <div 
        className="absolute inset-4 rounded-full blur-xl opacity-40"
        style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
      />
      
      <svg className="transform -rotate-90 w-48 h-48 relative">
        {/* Background circle */}
        <circle
          cx="96"
          cy="96"
          r="70"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="14"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx="96"
          cy="96"
          r="70"
          stroke={`url(#scoreGradient-${score})`}
          strokeWidth="14"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id={`scoreGradient-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black text-white">{score}</span>
        <span className="text-sm text-gray-400 font-medium">out of 100</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, score, icon, badge }: { label: string; score: number; icon: React.ReactNode; badge?: string }) {
  const getColor = (score: number) => {
    if (score >= 80) return { gradient: "from-green-500 to-green-600", bg: "bg-green-500/20" };
    if (score >= 60) return { gradient: "from-yellow-500 to-yellow-600", bg: "bg-yellow-500/20" };
    return { gradient: "from-red-500 to-red-600", bg: "bg-red-500/20" };
  };

  const colors = getColor(score);

  return (
    <div className="p-4 rounded-xl bg-gray-800/40 border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{icon}</span>
          <span className="text-sm font-semibold text-gray-300">{label}</span>
          {badge && (
            <span className="px-2 py-0.5 bg-[#2BC4A8] text-white text-[10px] font-bold rounded-full">
              {badge}
            </span>
          )}
        </div>
        <span className="text-sm font-bold text-white">{score}%</span>
      </div>
      <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-1000 ease-out rounded-full`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// FIX SUGGESTIONS
// ============================================
function FixSuggestions({ result }: { result: ParseAndScoreResponse }) {
  // Combine flags and comments, prioritize flags
  const allSuggestions = [
    ...(result.score.flags || []).map(flag => ({ text: flag, isFlag: true })),
    ...result.score.comments.map(comment => ({ text: comment, isFlag: false }))
  ].slice(0, 6);

  if (allSuggestions.length === 0) {
    return (
      <div className="bg-gradient-to-b from-gray-900/80 to-gray-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Improvement Suggestions</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <FiCheck className="text-green-400" size={32} />
          </div>
          <p className="text-gray-300 font-medium">Great job! No major issues found.</p>
          <p className="text-gray-500 text-sm mt-1">Your resume is well-optimized.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-900/80 to-gray-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Improvement Suggestions</h2>
        <span className="text-sm text-gray-400">{allSuggestions.length} items</span>
      </div>
      
      <div className="space-y-4">
        {allSuggestions.map((item, idx) => (
          <div
            key={idx}
            className={`group p-5 border rounded-2xl transition-all ${
              item.isFlag 
                ? 'bg-gradient-to-r from-red-500/10 to-orange-500/5 border-red-500/20 hover:border-red-500/40' 
                : 'bg-gradient-to-r from-orange-500/10 to-yellow-500/5 border-orange-500/20 hover:border-orange-500/40'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                item.isFlag ? 'bg-red-500/20' : 'bg-orange-500/20'
              }`}>
                <FiAlertCircle className={item.isFlag ? 'text-red-400' : 'text-orange-400'} size={20} />
              </div>
              <div className="flex-1">
                {item.isFlag && (
                  <span className="inline-block px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded mb-2">
                    ⚠️ Flag
                  </span>
                )}
                <p className="text-gray-200 font-medium leading-relaxed">{item.text}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <ActionButton label="Auto-Fix" icon={<FiZap size={14} />} primary />
                  <ActionButton label="Learn More" icon={<FiInfo size={14} />} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionButton({ label, icon, primary = false }: { label: string; icon: React.ReactNode; primary?: boolean }) {
  return (
    <button
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
        primary
          ? "bg-gradient-to-r from-[#2BC4A8] to-[#20a090] text-white hover:shadow-lg hover:shadow-[#2BC4A8]/25 hover:-translate-y-0.5"
          : "bg-gray-700/50 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ============================================
// SECTION ANALYSIS
// ============================================
function SectionAnalysis({ result }: { result: ParseAndScoreResponse }) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["contact"]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  return (
    <div className="bg-gradient-to-b from-gray-900/80 to-gray-900/60 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Detailed Analysis</h2>
      
      <div className="space-y-3">
        {/* Contact Info */}
        <SectionCard
          title="Contact Information"
          icon={<FiInfo size={18} />}
          expanded={expandedSections.includes("contact")}
          onToggle={() => toggleSection("contact")}
          validated={!!result.resume.contact.email}
        >
          <div className="space-y-3">
            <InfoRow label="Name" value={result.resume.name || "Not found"} />
            <InfoRow label="Email" value={result.resume.contact.email || "Missing"} validated={!!result.resume.contact.email} critical />
            <InfoRow label="Phone" value={result.resume.contact.phone || "Missing"} validated={!!result.resume.contact.phone} critical />
            <InfoRow label="Location" value={result.resume.contact.location || "Not specified"} />
          </div>
        </SectionCard>

        {/* Summary */}
        {result.resume.summary && (
          <SectionCard
            title="Professional Summary"
            icon={<FiFile size={18} />}
            expanded={expandedSections.includes("summary")}
            onToggle={() => toggleSection("summary")}
            validated={result.resume.summary.length > 50}
          >
            <p className="text-gray-300 leading-relaxed">{result.resume.summary}</p>
          </SectionCard>
        )}

        {/* Experience */}
        <SectionCard
          title={`Work Experience (${result.resume.experience.length} roles)`}
          icon={<FiAward size={18} />}
          expanded={expandedSections.includes("experience")}
          onToggle={() => toggleSection("experience")}
          validated={result.resume.experience.length > 0}
        >
          <div className="space-y-5">
            {result.resume.experience.slice(0, 3).map((exp, idx) => (
              <div key={idx} className="relative pl-5 border-l-2 border-[#2BC4A8]/50">
                <div className="absolute left-0 top-0 w-3 h-3 -translate-x-[7px] rounded-full bg-[#2BC4A8]" />
                <h4 className="font-semibold text-white text-lg">{exp.job_title || "Position"}</h4>
                <p className="text-gray-400">{exp.company || "Company"}</p>
                <p className="text-sm text-gray-500 mb-2">
                  {exp.start_date && exp.end_date ? `${exp.start_date} - ${exp.end_date}` : "Dates not specified"}
                </p>
                {exp.bullets.length > 0 && (
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {exp.bullets[0].substring(0, 180)}...
                  </p>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Skills */}
        <SectionCard
          title={`Skills (${result.resume.skills.length} found)`}
          icon={<FiCpu size={18} />}
          expanded={expandedSections.includes("skills")}
          onToggle={() => toggleSection("skills")}
          validated={result.resume.skills.length >= 5}
        >
          <div className="flex flex-wrap gap-2">
            {result.resume.skills.slice(0, 15).map((skill, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-gradient-to-r from-[#2BC4A8]/20 to-[#20a090]/10 text-[#2BC4A8] rounded-lg text-sm font-medium border border-[#2BC4A8]/30"
              >
                {skill.name}
              </span>
            ))}
            {result.resume.skills.length > 15 && (
              <span className="px-3 py-1.5 bg-gray-700/50 text-gray-400 rounded-lg text-sm font-medium">
                +{result.resume.skills.length - 15} more
              </span>
            )}
          </div>
        </SectionCard>

        {/* Education */}
        <SectionCard
          title={`Education (${result.resume.education.length} entries)`}
          icon={<FiStar size={18} />}
          expanded={expandedSections.includes("education")}
          onToggle={() => toggleSection("education")}
          validated={result.resume.education.length > 0}
        >
          <div className="space-y-4">
            {result.resume.education.map((edu, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-gray-800/40 border border-white/5">
                <h4 className="font-semibold text-white">{edu.degree || "Degree"}</h4>
                <p className="text-gray-400">{edu.institution || "Institution"}</p>
                <p className="text-sm text-gray-500">{edu.graduation_year || "Year not specified"}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  expanded,
  onToggle,
  validated,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  validated: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden bg-gray-800/20">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-gray-400">{icon}</span>
          <span className="font-semibold text-white">{title}</span>
          {validated ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
              <FiCheck size={12} />
              Valid
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium">
              <FiAlertCircle size={12} />
              Review
            </span>
          )}
        </div>
        <FiChevronDown className={`text-gray-400 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} size={20} />
      </button>
      {expanded && (
        <div className="p-5 pt-0 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, validated = true, critical = false }: { label: string; value: string; validated?: boolean; critical?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-gray-400 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-gray-200">{value}</span>
        {critical && (
          validated ? (
            <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
              <FiCheck className="text-green-400" size={12} />
            </span>
          ) : (
            <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
              <FiX className="text-red-400" size={12} />
            </span>
          )
        )}
      </div>
    </div>
  );
}
