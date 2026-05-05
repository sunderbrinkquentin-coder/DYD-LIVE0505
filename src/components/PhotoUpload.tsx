import { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import { usePhotoUpload } from '../hooks/usePhotoUpload';

interface PhotoUploadProps {
  currentPhoto?: string | null;
  onPhotoChange?: (base64: string | null) => void;
  className?: string;
}

export default function PhotoUpload({ currentPhoto: propPhoto, onPhotoChange, className = '' }: PhotoUploadProps) {
  const photoUploadHook = usePhotoUpload();
  const [localIsUploading, setLocalIsUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayPhoto = propPhoto !== undefined ? propPhoto : photoUploadHook.photoBase64;
  const isUploading = localIsUploading || photoUploadHook.isUploading;
  const error = localError || photoUploadHook.error;

  const handleFileSelect = async (file: File) => {
    setLocalError(null);

    if (!file.type.startsWith('image/')) {
      setLocalError('Nur Bilder (JPG/PNG) erlaubt');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLocalError('Datei zu groß (max 5MB)');
      return;
    }

    setLocalIsUploading(true);

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: 'image/jpeg',
      };

      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64 = reader.result as string;

        if (onPhotoChange) {
          onPhotoChange(base64);
        } else {
          await photoUploadHook.uploadPhoto(base64);
        }

        setLocalIsUploading(false);
      };

      reader.onerror = () => {
        setLocalError('Fehler beim Hochladen');
        setLocalIsUploading(false);
      };

      reader.readAsDataURL(compressedFile);
    } catch (err) {
      setLocalError('Fehler beim Verarbeiten');
      setLocalIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (onPhotoChange) {
      onPhotoChange(null);
    } else {
      await photoUploadHook.removePhoto();
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />

      <motion.div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative group cursor-pointer"
      >
        {!displayPhoto && !isUploading && (
          <div
            className="w-[120px] h-[120px] rounded-full flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-all"
            style={{
              borderColor: '#4ECDC4',
              background: 'rgba(78, 205, 196, 0.05)',
            }}
          >
            <Camera className="text-primary" size={32} />
            <span className="text-xs text-text-secondary text-center px-2">
              Foto hochladen
              <br />
              (optional)
            </span>
          </div>
        )}

        {isUploading && (
          <div
            className="w-[120px] h-[120px] rounded-full flex flex-col items-center justify-center gap-2"
            style={{ background: 'rgba(78, 205, 196, 0.1)' }}
          >
            <Loader2 className="text-primary animate-spin" size={32} />
            <span className="text-xs text-primary">Lädt...</span>
          </div>
        )}

        {displayPhoto && !isUploading && (
          <div className="relative">
            <img
              src={displayPhoto}
              alt="Profilfoto"
              className="w-[120px] h-[120px] rounded-full object-cover border-4 border-primary"
            />
            <AnimatePresence>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0, scale: 0.8 }}
                whileHover={{ opacity: 1, scale: 1 }}
                onClick={handleRemove}
                className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-error text-white flex items-center justify-center shadow-lg group-hover:opacity-100 transition-opacity"
                style={{ opacity: 0 }}
              >
                <X size={16} />
              </motion.button>
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-error mt-2"
        >
          {error}
        </motion.p>
      )}

      <p className="text-xs text-text-secondary mt-2">Max 5MB, JPG/PNG</p>
    </div>
  );
}
