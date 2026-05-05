import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  email: string;
  name?: string;
  onboardingData?: {
    reason: string;
    industry: string;
    experienceLevel: string;
  };
}

interface CVData {
  contact?: any;
  education?: any[];
  experience?: any[];
  skills?: any[];
  projects?: any[];
  languages?: any[];
  certificates?: any[];
  additional?: string;
}

interface CompletedSection {
  id: string;
  name: string;
  summary?: string;
  skipped?: boolean;
}

interface AgentState {
  currentSection: number;
  currentQuestion: number;
  completedSections: CompletedSection[];
  answers: Record<string, any>;
  entries: { [sectionId: string]: any[] };
  currentEntryIndex: number;
  previousFlowPosition?: { section: number; question: number };
  lastCompletedSectionIndex: number;
}

interface Store {
  user: User | null;
  cvData: CVData;
  isAuthenticated: boolean;
  photoBase64: string | null;
  showPhotoInCV: boolean;
  selectedTemplate: 'modern' | 'azubi' | 'uni' | 'beratung' | 'finance';
  email: string;
  editDraft: CVData | null;
  hasUnsavedChanges: boolean;
  agentState: AgentState;
  currentCVId: string | null;
  userFlow: 'create' | 'check' | null;
  uploadedCVForCheck: string | null;
  cvScoreData: any | null;
  setUser: (user: User) => void;
  setCVData: (data: CVData) => void;
  updateCVSection: (section: keyof CVData, data: any) => void;
  setPhoto: (base64: string | null) => void;
  togglePhotoDisplay: (show: boolean) => void;
  switchTemplate: (templateId: 'modern' | 'azubi' | 'uni' | 'beratung' | 'finance') => void;
  setEmail: (email: string) => void;
  startEditing: () => void;
  updateEditDraft: (data: Partial<CVData>) => void;
  saveAndReturn: () => void;
  cancelEdit: () => void;
  setCurrentCVId: (id: string | null) => void;
  loadCVData: (data: CVData, cvId: string) => void;
  updateAgentAnswer: (key: string, value: any) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  nextSection: () => void;
  previousSection: () => void;
  canGoToPreviousSection: () => boolean;
  completeSection: (id: string, name: string, summary?: string) => void;
  skipSection: (id: string, name: string) => void;
  addEntry: (sectionId: string, entry: any) => void;
  updateCurrentEntry: (sectionId: string, index: number) => void;
  resetToFirstQuestion: () => void;
  resetAgent: () => void;
  logout: () => void;
  setUserFlow: (flow: 'create' | 'check') => void;
  setUploadedCVForCheck: (fileName: string) => void;
  setCVScoreData: (data: any) => void;
  removeEntry: (sectionId: string, entryIndex: number) => void;
  updateEntry: (sectionId: string, entryIndex: number, updatedData: any) => void;
  jumpToSection: (sectionId: string) => void;
  setPreviousFlowPosition: (section: number, question: number) => void;
  restorePreviousFlowPosition: () => void;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      user: null,
      cvData: {},
      isAuthenticated: false,
      photoBase64: null,
      showPhotoInCV: true,
      selectedTemplate: 'modern',
      email: '',
      editDraft: null,
      hasUnsavedChanges: false,
      currentCVId: null,
      userFlow: null,
      uploadedCVForCheck: null,
      cvScoreData: null,
      agentState: {
        currentSection: 0,
        currentQuestion: 0,
        completedSections: [],
        answers: {},
        entries: {},
        currentEntryIndex: 0,
        previousFlowPosition: undefined,
        lastCompletedSectionIndex: -1,
      },
      setUser: (user) => set({ user, isAuthenticated: true }),
      setCVData: (data) => set({ cvData: data }),
      updateCVSection: (section, data) =>
        set((state) => ({
          cvData: { ...state.cvData, [section]: data },
        })),
      setPhoto: (base64) => set({ photoBase64: base64 }),
      togglePhotoDisplay: (show) => set({ showPhotoInCV: show }),
      switchTemplate: (templateId) => set({ selectedTemplate: templateId }),
      setEmail: (email) => set({ email }),
      startEditing: () =>
        set((state) => ({
          editDraft: JSON.parse(JSON.stringify(state.cvData)),
          hasUnsavedChanges: false,
        })),
      updateEditDraft: (data) =>
        set((state) => ({
          editDraft: { ...state.editDraft, ...data },
          hasUnsavedChanges: true,
        })),
      saveAndReturn: () =>
        set((state) => {
          const updatedData = state.editDraft || state.cvData;
          return {
            cvData: updatedData,
            editDraft: null,
            hasUnsavedChanges: false,
          };
        }),
      cancelEdit: () =>
        set({
          editDraft: null,
          hasUnsavedChanges: false,
        }),
      updateAgentAnswer: (key, value) =>
        set((state) => {
          console.log('[useStore:updateAgentAnswer] Updating:', key, '=', value);
          return {
            agentState: {
              ...state.agentState,
              answers: { ...state.agentState.answers, [key]: value },
            },
          };
        }),
      nextQuestion: () =>
        set((state) => ({
          agentState: {
            ...state.agentState,
            currentQuestion: state.agentState.currentQuestion + 1,
          },
        })),
      previousQuestion: () =>
        set((state) => ({
          agentState: {
            ...state.agentState,
            currentQuestion: Math.max(0, state.agentState.currentQuestion - 1),
          },
        })),
      nextSection: () =>
        set((state) => ({
          agentState: {
            ...state.agentState,
            currentSection: state.agentState.currentSection + 1,
            currentQuestion: 0,
            lastCompletedSectionIndex: state.agentState.currentSection,
          },
        })),
      previousSection: () =>
        set((state) => {
          const targetSection = state.agentState.currentSection - 1;
          if (targetSection < 0 || targetSection <= state.agentState.lastCompletedSectionIndex) {
            return {};
          }
          return {
            agentState: {
              ...state.agentState,
              currentSection: targetSection,
              currentQuestion: 0,
            },
          };
        }),
      canGoToPreviousSection: () => {
        const state = useStore.getState();
        const targetSection = state.agentState.currentSection - 1;
        return targetSection >= 0 && targetSection > state.agentState.lastCompletedSectionIndex;
      },
      completeSection: (id, name, summary) =>
        set((state) => ({
          agentState: {
            ...state.agentState,
            completedSections: [...state.agentState.completedSections, { id, name, summary, skipped: false }],
          },
        })),
      skipSection: (id, name) =>
        set((state) => ({
          agentState: {
            ...state.agentState,
            completedSections: [...state.agentState.completedSections, { id, name, skipped: true }],
          },
        })),
      addEntry: (sectionId, entry) =>
        set((state) => ({
          agentState: {
            ...state.agentState,
            entries: {
              ...state.agentState.entries,
              [sectionId]: [...(state.agentState.entries[sectionId] || []), entry],
            },
          },
        })),
      updateCurrentEntry: (sectionId, index) =>
        set((state) => ({
          agentState: {
            ...state.agentState,
            currentEntryIndex: index,
          },
        })),
      resetToFirstQuestion: () =>
        set((state) => ({
          agentState: {
            ...state.agentState,
            currentQuestion: 0,
          },
        })),
      resetAgent: () =>
        set({
          agentState: {
            currentSection: 0,
            currentQuestion: 0,
            completedSections: [],
            answers: {},
            entries: {},
            currentEntryIndex: 0,
            previousFlowPosition: undefined,
            lastCompletedSectionIndex: -1,
          },
        }),
      setCurrentCVId: (id) => set({ currentCVId: id }),
      loadCVData: (data, cvId) => set({ cvData: data, currentCVId: cvId }),
      logout: () => set({ user: null, cvData: {}, isAuthenticated: false, photoBase64: null, currentCVId: null, userFlow: null, uploadedCVForCheck: null, cvScoreData: null }),
      setUserFlow: (flow) => set({ userFlow: flow }),
      setUploadedCVForCheck: (fileName) => set({ uploadedCVForCheck: fileName }),
      setCVScoreData: (data) => set({ cvScoreData: data }),
      removeEntry: (sectionId, entryIndex) =>
        set((state) => {
          const sectionEntries = state.agentState.entries[sectionId] || [];
          const updatedEntries = sectionEntries.filter((_, index) => index !== entryIndex);
          return {
            agentState: {
              ...state.agentState,
              entries: {
                ...state.agentState.entries,
                [sectionId]: updatedEntries,
              },
            },
          };
        }),
      updateEntry: (sectionId, entryIndex, updatedData) =>
        set((state) => {
          const sectionEntries = state.agentState.entries[sectionId] || [];
          const updatedEntries = sectionEntries.map((entry, index) =>
            index === entryIndex ? { ...entry, ...updatedData } : entry
          );
          return {
            agentState: {
              ...state.agentState,
              entries: {
                ...state.agentState.entries,
                [sectionId]: updatedEntries,
              },
            },
          };
        }),
      jumpToSection: (sectionId) =>
        set((state) => {
          const sectionMap: Record<string, number> = {
            kontakt: 0,
            bildung: 1,
            berufserfahrung: 2,
            skills: 3,
            projekte: 4,
            sprachen: 5,
            zertifikate: 6,
            abschluss: 7,
          };
          const sectionIndex = sectionMap[sectionId] ?? state.agentState.currentSection;
          return {
            agentState: {
              ...state.agentState,
              previousFlowPosition: {
                section: state.agentState.currentSection,
                question: state.agentState.currentQuestion,
              },
              currentSection: sectionIndex,
              currentQuestion: 0,
            },
          };
        }),
      setPreviousFlowPosition: (section, question) =>
        set((state) => ({
          agentState: {
            ...state.agentState,
            previousFlowPosition: { section, question },
          },
        })),
      restorePreviousFlowPosition: () =>
        set((state) => {
          if (state.agentState.previousFlowPosition) {
            return {
              agentState: {
                ...state.agentState,
                currentSection: state.agentState.previousFlowPosition.section,
                currentQuestion: state.agentState.previousFlowPosition.question,
                previousFlowPosition: undefined,
              },
            };
          }
          return state;
        }),
    }),
    {
      name: 'dyd-storage-v2',
    }
  )
);
