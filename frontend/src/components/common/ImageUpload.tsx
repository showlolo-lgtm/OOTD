import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, X } from 'lucide-react';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  preview?: string;
  className?: string;
  label?: string;
}

export default function ImageUpload({
  onImageSelect,
  preview: externalPreview,
  className = '',
  label = 'Upload an image',
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setPreview(URL.createObjectURL(file));
        onImageSelect(file);
      }
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    multiple: false,
  });

  const displayPreview = externalPreview || preview;

  const clearPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
  };

  return (
    <div
      {...getRootProps()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all ${
        isDragActive
          ? 'border-primary-400 bg-primary-50'
          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
      } ${className}`}
    >
      <input {...getInputProps()} capture="environment" />

      {displayPreview ? (
        <div className="relative">
          <img
            src={displayPreview}
            alt="Preview"
            className="w-full h-64 object-cover rounded-2xl"
          />
          {!externalPreview && (
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-xs text-gray-400 text-center">
            Drag & drop or tap to select
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Camera className="w-3.5 h-3.5" />
              <span>Camera</span>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Upload className="w-3.5 h-3.5" />
              <span>Gallery</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
