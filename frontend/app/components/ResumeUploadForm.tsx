"use client";

import { useState, useRef } from "react";
import { ParseAndScoreResponse } from "@/lib/types";
import { parseAndScoreResume } from "@/lib/apiClient";
import { 
  compressFile, 
  formatFileSize, 
  isCompressionSupported,
  CompressionProgress,
  CompressionResult
} from "@/lib/fileCompression";

interface ResumeUploadFormProps {
  onResult: (data: ParseAndScoreResponse) => void;
}

export default function ResumeUploadForm({ onResult }: ResumeUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Compression states
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<CompressionProgress | null>(null);
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = async (selectedFile: File) => {
    setError(null);
    setCompressionResult(null);
    
    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    const validExtensions = ['.pdf', '.docx', '.doc'];
    
    const hasValidExtension = validExtensions.some(ext => 
      selectedFile.name.toLowerCase().endsWith(ext)
    );
    
    if (!validTypes.includes(selectedFile.type) && !hasValidExtension) {
      setError('Please upload a PDF or DOCX file');
      return;
    }

    // Validate file size (25MB limit)
    const maxSize = 25 * 1024 * 1024;
    const targetSize = 15 * 1024 * 1024; // Target size for compression
    
    if (selectedFile.size > targetSize && isCompressionSupported(selectedFile)) {
      // Try to compress
      setIsCompressing(true);
      setCompressionProgress({ stage: 'reading', progress: 0, message: 'Preparing compression...' });
      
      try {
        const result = await compressFile(selectedFile, setCompressionProgress);
        setCompressionResult(result);
        
        if (result.wasCompressed && result.compressedFile.size <= maxSize) {
          setFile(result.compressedFile);
        } else if (result.compressedFile.size > maxSize) {
          setError(`File is still too large after compression (${formatFileSize(result.compressedFile.size)}). Maximum is 25MB.`);
          setFile(null);
        } else {
          setFile(result.compressedFile);
        }
      } catch (err) {
        setError('Failed to compress file. Please try a smaller file.');
        setFile(null);
      } finally {
        setIsCompressing(false);
        setCompressionProgress(null);
      }
    } else if (selectedFile.size > maxSize) {
      setError(`File size must be less than 25MB. Your file is ${formatFileSize(selectedFile.size)}`);
      return;
    } else {
      setFile(selectedFile);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to scan');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await parseAndScoreResume(file);
      onResult(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to scan resume';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setError(null);
    setCompressionResult(null);
    setCompressionProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isCompressing
            ? 'border-purple-500 bg-purple-50'
            : dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : file 
                ? 'border-green-400 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400 bg-white'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={loading || isCompressing}
        />
        
        <div className="space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            {isCompressing ? (
              <svg className="w-12 h-12 text-purple-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3zM9 12h6M12 9v6" />
              </svg>
            ) : file ? (
              <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>

          {/* Text */}
          {isCompressing ? (
            <div>
              <p className="text-lg font-medium text-purple-700">Compressing file...</p>
              <p className="text-sm text-purple-500">{compressionProgress?.message || 'Please wait...'}</p>
              <div className="mt-3 w-48 mx-auto bg-purple-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300 rounded-full"
                  style={{ width: `${compressionProgress?.progress || 0}%` }}
                />
              </div>
            </div>
          ) : file ? (
            <div>
              <p className="text-lg font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">
                {formatFileSize(file.size)}
              </p>
              {compressionResult?.wasCompressed && (
                <p className="text-xs text-purple-600 mt-1">
                  ✓ Compressed {compressionResult.compressionRatio.toFixed(0)}% 
                  (from {formatFileSize(compressionResult.originalSize)})
                </p>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Choose a different file
              </button>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-700">
                Drop your resume here, or{' '}
                <span className="text-blue-600">browse</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: PDF, DOCX
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Large files will be automatically compressed
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!file || loading}
        className={`
          mt-6 w-full py-3 px-6 rounded-lg font-semibold text-white transition-all
          flex items-center justify-center gap-2
          ${!file || loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }
        `}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Scanning Resume...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Scan Resume</span>
          </>
        )}
      </button>
    </form>
  );
}
