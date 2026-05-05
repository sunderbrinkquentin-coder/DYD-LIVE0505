import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { sessionManager } from '../utils/sessionManager';
import { careerService } from '../services/careerService';
import { LearningPath } from '../types/learningPath';

interface CareerVisionContextType {
  currentPath: LearningPath | null;
  userPaths: LearningPath[];
  isLoading: boolean;
  error: string | null;
  loadPath: (pathId: string) => Promise<void>;
  refreshUserPaths: () => Promise<void>;
  setCurrentPath: (path: LearningPath | null) => void;
}

const CareerVisionContext = createContext<CareerVisionContextType | undefined>(undefined);

export function CareerVisionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState<LearningPath | null>(null);
  const [userPaths, setUserPaths] = useState<LearningPath[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      refreshUserPaths();
    }
  }, [user?.id]);

  const loadPath = async (pathId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const path = await careerService.getLearningPath(pathId);
      setCurrentPath(path);
    } catch (err: any) {
      setError(err.message);
      console.error('[CareerVisionContext] Failed to load path:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserPaths = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);
    try {
      const paths = await careerService.getUserLearningPaths(user.id);
      setUserPaths(paths);
    } catch (err: any) {
      setError(err.message);
      console.error('[CareerVisionContext] Failed to load user paths:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CareerVisionContext.Provider
      value={{
        currentPath,
        userPaths,
        isLoading,
        error,
        loadPath,
        refreshUserPaths,
        setCurrentPath,
      }}
    >
      {children}
    </CareerVisionContext.Provider>
  );
}

export function useCareerVision() {
  const context = useContext(CareerVisionContext);
  if (context === undefined) {
    throw new Error('useCareerVision must be used within CareerVisionProvider');
  }
  return context;
}
