// Image Utility Functions
// Handles consistent image URL formatting and fallbacks across the application

import React from 'react';

const API_BASE_URL = 'http://localhost:5000';

/**
 * Formats image URL for display
 * Handles different image URL formats and provides fallbacks
 */
export const formatImageUrl = (imageUrl: string | undefined | null): string => {
  if (!imageUrl) {
    return '';
  }

  // If it's already a data URL, return as is
  if (imageUrl.startsWith('data:')) {
    console.log('Image URL formatting: Data URL detected, returning as is');
    return imageUrl;
  }

  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http')) {
    console.log('Image URL formatting: Full URL detected, returning as is');
    return imageUrl;
  }

  // Handle relative paths - ensure proper formatting
  let cleanPath = imageUrl;
  
  // Remove leading slash if present to avoid double slashes
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }
  
  // Remove any trailing slashes
  if (cleanPath.endsWith('/')) {
    cleanPath = cleanPath.slice(0, -1);
  }
  
  // Construct full URL with API base
  const fullUrl = `${API_BASE_URL}/${cleanPath}`;
  
  // Debug logging (can be removed in production)
  console.log('Image URL formatting:', {
    original: imageUrl,
    cleanPath: cleanPath,
    fullUrl: fullUrl
  });
  
  return fullUrl;
};

/**
 * Default fallback image SVG (base64 encoded)
 * Used when an image fails to load or is not found
 */
export const getDefaultFallbackImage = (): string => {
  return '/placeholder.png';
};

/**
 * Image validation constants
 */
export const IMAGE_VALIDATION = {
  // Allowed file types
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  // Maximum file size (500KB for optimal performance)
  maxFileSize: 500 * 1024, // 500KB
  // Maximum base64 string length (approximately 500KB when encoded)
  maxBase64Length: 700000, // ~700K characters
  // Recommended dimensions for form headers
  recommendedWidth: 800,
  recommendedHeight: 200,
  maxWidth: 1920,
  maxHeight: 600,
};

/**
 * Image type and size validation
 */
export const validateImageFile = (file: File): { isValid: boolean; error?: string; warning?: string } => {
  const { allowedTypes, maxFileSize } = IMAGE_VALIDATION;

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload an image file (JPEG, PNG, GIF, or WebP).'
    };
  }

  if (file.size > maxFileSize) {
    return {
      isValid: false,
      error: `Image too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(maxFileSize)}.`
    };
  }

  return { isValid: true };
};

/**
 * Validate base64 image data
 */
export const validateBase64Image = (base64Data: string): { isValid: boolean; error?: string; warning?: string } => {
  const { maxBase64Length } = IMAGE_VALIDATION;

  // Check if it's a valid base64 data URL
  if (!base64Data.startsWith('data:image/')) {
    return { isValid: false, error: 'Invalid image format.' };
  }

  // Extract the base64 portion (after the comma)
  const base64Content = base64Data.split(',')[1];
  if (!base64Content) {
    return { isValid: false, error: 'Invalid base64 data.' };
  }

  // Check size
  if (base64Data.length > maxBase64Length) {
    return {
      isValid: false,
      error: `Image too large. Maximum size is ${formatFileSize(maxBase64Length)}. Please compress your image or use a smaller one.`
    };
  }

  // Warn if file is large but still acceptable
  const sizeKB = Math.round(base64Data.length / 1024);
  if (sizeKB > 300) {
    return {
      isValid: true,
      warning: `Image size is ${sizeKB}KB. For best performance, aim for under 200KB.`
    };
  }

  return { isValid: true };
};

/**
 * Format file size for display
 */
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
};

/**
 * Get recommended image dimensions info
 */
export const getImageRecommendations = (): string => {
  const { recommendedWidth, recommendedHeight, maxFileSize } = IMAGE_VALIDATION;
  return `Recommended: ${recommendedWidth}×${recommendedHeight}px, max ${formatFileSize(maxFileSize)}`;
};

/**
 * Image component props interface
 */
export interface ImageProps {
  src: string | undefined | null;
  alt: string;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  fallbackSrc?: string;
}

/**
 * Enhanced image component with consistent error handling
 */
export const EnhancedImage: React.FC<ImageProps> = ({
  src,
  alt,
  className,
  onError,
  fallbackSrc
}) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    const fallback = fallbackSrc || getDefaultFallbackImage();
    
    console.log('Image load error:', {
      originalSrc: target.src,
      fallback: fallback,
      alt: alt,
      isDataUrl: target.src.startsWith('data:')
    });
    
    if (target.src !== fallback) {
      target.src = fallback;
    }
    
    onError?.(e);
  };

  // If no source provided, return a fallback image
  if (!src) {
    console.log('No image source provided, using fallback');
    return React.createElement('img', {
      src: fallbackSrc || getDefaultFallbackImage(),
      alt: alt || 'No image available',
      className: className
    });
  }

  // For data URLs, use them directly without formatting
  if (src.startsWith('data:')) {
    console.log('EnhancedImage render: Data URL detected, using directly');
    return React.createElement('img', {
      src: src,
      alt: alt,
      className: className,
      onError: handleImageError
    });
  }

  const finalSrc = formatImageUrl(src);
  
  console.log('EnhancedImage render:', {
    src: src,
    finalSrc: finalSrc,
    alt: alt
  });

  return React.createElement('img', {
    src: finalSrc,
    alt: alt,
    className: className,
    onError: handleImageError
  });
};