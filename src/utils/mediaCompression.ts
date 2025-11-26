/**
 * Media Compression Utility
 * Compresses images and videos before upload to reduce bandwidth and storage costs
 */

import * as ImageManipulator from 'expo-image-manipulator'

// Image compression settings
export interface ImageCompressionOptions {
  maxWidth?: number // Max width in pixels (default: 1200)
  maxHeight?: number // Max height in pixels (default: 1200)
  quality?: number // JPEG quality 0-1 (default: 0.7)
  format?: 'jpeg' | 'png' | 'webp' // Output format (default: jpeg)
}

// Video compression settings (for future use with ffmpeg or cloud processing)
export interface VideoCompressionOptions {
  maxSizeMB?: number // Target max size in MB (default: 5)
  maxDuration?: number // Max duration in seconds (default: 30)
}

// Compression result
export interface CompressionResult {
  uri: string
  width: number
  height: number
  fileSize?: number // Estimated file size in bytes
  originalSize?: number
  compressionRatio?: number
}

// Default settings optimized for mobile upload
const DEFAULT_IMAGE_OPTIONS: ImageCompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.7,
  format: 'jpeg',
}

const DEFAULT_VIDEO_OPTIONS: VideoCompressionOptions = {
  maxSizeMB: 5,
  maxDuration: 30,
}

/**
 * Compress an image for upload
 * Reduces file size by ~70% while maintaining good visual quality
 */
export const compressImage = async (
  uri: string,
  options: ImageCompressionOptions = {}
): Promise<CompressionResult> => {
  try {
    const opts = { ...DEFAULT_IMAGE_OPTIONS, ...options }

    // Get original file size estimate
    const originalResponse = await fetch(uri)
    const originalBlob = await originalResponse.blob()
    const originalSize = originalBlob.size

    console.log(`[MediaCompression] Original image size: ${(originalSize / 1024).toFixed(1)}KB`)

    // Build manipulation actions
    const actions: ImageManipulator.Action[] = []

    // Resize if needed (maintains aspect ratio)
    if (opts.maxWidth || opts.maxHeight) {
      actions.push({
        resize: {
          width: opts.maxWidth,
          height: opts.maxHeight,
        },
      })
    }

    // Perform compression
    const result = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      {
        compress: opts.quality,
        format: opts.format === 'png'
          ? ImageManipulator.SaveFormat.PNG
          : opts.format === 'webp'
            ? ImageManipulator.SaveFormat.WEBP
            : ImageManipulator.SaveFormat.JPEG,
      }
    )

    // Get compressed file size
    const compressedResponse = await fetch(result.uri)
    const compressedBlob = await compressedResponse.blob()
    const compressedSize = compressedBlob.size

    const compressionRatio = originalSize > 0
      ? ((originalSize - compressedSize) / originalSize * 100)
      : 0

    console.log(`[MediaCompression] Compressed image size: ${(compressedSize / 1024).toFixed(1)}KB`)
    console.log(`[MediaCompression] Compression ratio: ${compressionRatio.toFixed(1)}% reduction`)

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      fileSize: compressedSize,
      originalSize,
      compressionRatio,
    }
  } catch (error) {
    console.error('[MediaCompression] Error compressing image:', error)
    // Return original URI if compression fails
    return {
      uri,
      width: 0,
      height: 0,
    }
  }
}

/**
 * Compress image for product listing (optimized preset)
 * - 1200px max dimension
 * - 70% JPEG quality
 * - ~100-200KB output
 */
export const compressProductImage = async (uri: string): Promise<CompressionResult> => {
  return compressImage(uri, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.7,
    format: 'jpeg',
  })
}

/**
 * Compress image for thumbnail (small preview)
 * - 400px max dimension
 * - 60% JPEG quality
 * - ~20-50KB output
 */
export const compressThumbnail = async (uri: string): Promise<CompressionResult> => {
  return compressImage(uri, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.6,
    format: 'jpeg',
  })
}

/**
 * Validate video file before upload
 * Returns validation result and recommendations
 */
export const validateVideo = async (
  uri: string,
  options: VideoCompressionOptions = {}
): Promise<{
  isValid: boolean
  fileSize: number
  error?: string
  recommendation?: string
}> => {
  try {
    const opts = { ...DEFAULT_VIDEO_OPTIONS, ...options }

    // Get file size
    const response = await fetch(uri)
    const blob = await response.blob()
    const fileSize = blob.size
    const fileSizeMB = fileSize / (1024 * 1024)

    console.log(`[MediaCompression] Video size: ${fileSizeMB.toFixed(2)}MB`)

    // Check if within limits
    if (fileSizeMB > (opts.maxSizeMB || 10)) {
      return {
        isValid: false,
        fileSize,
        error: `Video is too large (${fileSizeMB.toFixed(1)}MB). Maximum allowed is ${opts.maxSizeMB}MB.`,
        recommendation: 'Try recording a shorter video or use a lower resolution.',
      }
    }

    return {
      isValid: true,
      fileSize,
    }
  } catch (error) {
    console.error('[MediaCompression] Error validating video:', error)
    return {
      isValid: false,
      fileSize: 0,
      error: 'Failed to validate video file.',
    }
  }
}

/**
 * Get optimized upload settings based on connection type
 * (Can be extended to check network conditions)
 */
export const getOptimalCompressionSettings = (): ImageCompressionOptions => {
  // Default to balanced settings
  // In future, can detect network type and adjust
  return {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.7,
    format: 'jpeg',
  }
}

/**
 * Estimate upload time based on file size
 * Assumes average mobile connection speed
 */
export const estimateUploadTime = (fileSizeBytes: number): string => {
  // Assume 1 Mbps average upload speed
  const uploadSpeedBps = 1 * 1024 * 1024 / 8 // 1 Mbps in bytes per second
  const seconds = fileSizeBytes / uploadSpeedBps

  if (seconds < 5) return 'A few seconds'
  if (seconds < 30) return `~${Math.ceil(seconds / 5) * 5} seconds`
  if (seconds < 60) return '< 1 minute'
  return `~${Math.ceil(seconds / 60)} minutes`
}
