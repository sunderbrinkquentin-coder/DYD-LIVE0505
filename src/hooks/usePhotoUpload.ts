import { useState } from 'react';
import { useStore } from '../store/useStore';
import { dbService } from '../services/databaseService';

export function usePhotoUpload() {
  const { photoBase64, setPhoto } = useStore();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPhoto = async (base64: string) => {
    setIsUploading(true);
    setError(null);

    try {
      setPhoto(base64);

      const cvs = await dbService.getOptimizedCVs();
      if (cvs.length > 0) {
        const latestCV = cvs[0];
        await dbService.updateOptimizedCV(latestCV.id, {
          photo_base64: base64,
        });
      }

      setIsUploading(false);
      return true;
    } catch (err) {
      console.error('Failed to upload photo:', err);
      setError('Fehler beim Speichern des Fotos');
      setIsUploading(false);
      return false;
    }
  };

  const removePhoto = async () => {
    setIsUploading(true);
    setError(null);

    try {
      setPhoto(null);

      const cvs = await dbService.getOptimizedCVs();
      if (cvs.length > 0) {
        const latestCV = cvs[0];
        await dbService.updateOptimizedCV(latestCV.id, {
          photo_base64: null,
        });
      }

      setIsUploading(false);
      return true;
    } catch (err) {
      console.error('Failed to remove photo:', err);
      setError('Fehler beim Entfernen des Fotos');
      setIsUploading(false);
      return false;
    }
  };

  return {
    photoBase64,
    isUploading,
    error,
    uploadPhoto,
    removePhoto,
  };
}
