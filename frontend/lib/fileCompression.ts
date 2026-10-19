/** Preserve document text; never rasterize a CV to claim a smaller file. */
export interface CompressionProgress { stage: 'reading' | 'compressing' | 'complete'; progress: number; message: string }
export interface CompressionResult { originalSize: number; compressedSize: number; compressionRatio: number; wasCompressed: boolean; compressedFile: File }
export const formatFileSize = (size: number): string => size < 1024 ? `${size} B` : size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;
export const isCompressionSupported = (_file: File): boolean => false;
export const needsCompression = (file: File): boolean => file.size > 15 * 1024 * 1024;
export async function compressFile(file: File, onProgress?: (progress: CompressionProgress) => void): Promise<CompressionResult> {
  onProgress?.({stage: 'complete', progress: 100, message: 'Original document preserved'});
  return {originalSize: file.size, compressedSize: file.size, compressionRatio: 0, wasCompressed: false, compressedFile: file};
}
