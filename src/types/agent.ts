export interface AgentAnswer {
  [key: string]: any;
}

export interface AgentState {
  currentSection: number;
  currentQuestion: number;
  completedSections: CompletedSection[];
  answers: AgentAnswer;
  entries: { [sectionId: string]: any[] };
  currentEntryIndex: number;
}

export interface CompletedSection {
  id: string;
  name: string;
  summary?: string;
  skipped?: boolean;
}

export interface StepField {
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  type?: string;
  icon?: string;
  disabledIf?: string;
  placeholderIfDisabled?: string;
  default?: any;
  options?: string[];
  description?: string;
  value?: string;
  rows?: number;
}

export interface Question {
  id: string;
  number: number;
  question: string;
  hint?: string;
  type: string;
  required?: boolean;
  fields?: StepField[];
  options?: any[];
  placeholder?: string;
  rows?: number;
  minItems?: number;
  maxItems?: number;
  addButtonText?: string;
  source?: string;
  duration?: number;
  progressMessages?: string[];
  messageInterval?: number;
  afterComplete?: {
    action: string;
    route?: string;
  };
  tokenCost?: number;
  showTokenInfo?: boolean;
}

export interface QuestionButton {
  text: string;
  action: string;
  style?: string;
}

export interface IntroQuestion {
  question: string;
  hint?: string;
  buttons: QuestionButton[];
}

export interface AddAnotherQuestion {
  question: string;
  hint?: string;
  showEntriesBefore?: boolean;
  entryPreviewFormat?: string;
  maxEntries?: number;
  buttons: QuestionButton[];
}

export interface Section {
  id: string;
  number: number;
  name: string;
  totalQuestions?: number;
  repeatable?: boolean;
  questionsPerEntry?: number;
  optional?: boolean;
  questions: Question[];
  introQuestion?: IntroQuestion;
  addAnotherQuestion?: AddAnotherQuestion;
  completionMessage: string;
  skipMessage?: string;
  completionSummary?: string;
  nextSection?: string;
}

export interface Step {
  id: string;
  question: string;
  hint?: string;
  type: string;
  required?: boolean;
  skippable?: boolean;
  fields?: StepField[];
  options?: any[];
  placeholder?: string;
  rows?: number;
  min_items?: number;
  max_items?: number;
  grid_columns?: number;
  add_button_text?: string;
  skip_button?: { text: string; action: string };
  buttons?: Array<{ text: string; value?: boolean; action: string }>;
  after_entry?: any;
  suggestions_based_on?: string;
  searchable?: boolean;
  repeatable?: boolean;
  max_entries?: number;
  conditional?: string;
  auto_advance?: boolean;
  duration?: number;
  animation?: string;
  progress_messages?: string[];
  after_complete?: any;
  default_entries?: any[];
  ai_hint?: boolean;
  examples?: Record<string, string[]>;
  custom_input?: boolean;
  source?: string;
}
