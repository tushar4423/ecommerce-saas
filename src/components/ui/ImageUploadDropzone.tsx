import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, Image as ImageIcon, CheckCircle2, AlertCircle, RefreshCw, X, Sparkles } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export interface ImageUploadDropzoneProps {
  onImagesSelected: (dataUrls: string[]) => void;
  multiple?: boolean;
  label?: string;
  helperText?: string;
  maxFiles?: number;
  className?: string;
  compact?: boolean;
  showProcessingToast?: boolean;
  accept?: string;
}

/**
 * Optimizes an image File into a web-ready Base64 data URL via HTML Canvas.
 * Caps dimension at 1600px max and compresses to ~85% quality JPEG/PNG
 * so it saves smoothly in Firestore documents and renders ultra-fast.
 */
export const compressImageFile = (file: File, maxDimension = 1600, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If it's an SVG, read directly as text/dataURL
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Keep PNG transparency for logos; JPEG needs an opaque background.
        if (file.type !== 'image/png') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  onImagesSelected,
  multiple = false,
  label = 'Upload Images from Device',
  helperText = 'Supports JPG, PNG, WEBP, or SVG (Up to 10MB)',
  maxFiles = 10,
  className = '',
  compact = false,
  showProcessingToast = true,
  accept = 'image/png, image/jpeg, image/jpg, image/webp, image/svg+xml',
}) => {
  const toast = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));

    if (fileArray.length === 0) {
      toast.error('Please upload valid image files (JPG, PNG, WEBP, etc.)');
      return;
    }

    const filesToProcess = multiple ? fileArray.slice(0, maxFiles) : [fileArray[0]];

    setIsProcessing(true);
    try {
      const convertedUrls = await Promise.all(
        filesToProcess.map((file) => compressImageFile(file))
      );

      onImagesSelected(convertedUrls);
      if (showProcessingToast) {
        toast.success(
          convertedUrls.length === 1
            ? 'Image uploaded and processed successfully!'
            : `${convertedUrls.length} images uploaded and added!`
        );
      }
    } catch (err) {
      console.error('Error processing uploaded image:', err);
      toast.error('Failed to process uploaded image file');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleClickContainer = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-[#7B2435]" />
            {label}
          </label>
          {multiple && (
            <span className="text-[10px] text-neutral-400 font-medium">
              Multi-file upload supported
            </span>
          )}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Drop Zone Box */}
      <div
        id="image-upload-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickContainer}
        className={`relative border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-center ${
          compact ? 'p-4' : 'p-6 sm:p-7'
        } ${
          isDragging
            ? 'border-[#7B2435] bg-[#7B2435]/5 scale-[0.99] ring-4 ring-[#7B2435]/10'
            : 'border-neutral-300 hover:border-[#7B2435] bg-[#FAF6F0]/60 hover:bg-[#FAF6F0]'
        }`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2 py-2 text-[#7B2435]">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <p className="text-xs font-semibold">Processing & optimizing images...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-11 h-11 rounded-full bg-white shadow-xs border border-[#EADBDA] flex items-center justify-center text-[#7B2435] group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>

            <div>
              <p className="text-xs font-bold text-neutral-800">
                <span className="text-[#7B2435] underline underline-offset-2">Click to upload</span> or drag and drop
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">{helperText}</p>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full border border-neutral-200 text-[10px] text-neutral-600 font-medium">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Auto-optimized for instant store display</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
