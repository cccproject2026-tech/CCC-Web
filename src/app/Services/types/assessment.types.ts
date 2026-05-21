// Assessment types matching CCC-Backend assessment module DTOs

export type AssessmentStatus = 'assigned' | 'in_progress' | 'submitted' | 'reviewed';
export type AssessmentType = 'CMA' | 'standard' | 'PMP';

// ─── Choices / Layers / Sections ─────────────────────────────────────────────

export interface Choice {
  label: string;
  value: string;
  score?: number;
  text?: string;
}

export interface RecommendationLevel {
  minScore: number;
  maxScore: number;
  label: string;
  description?: string;
}

export interface Layer {
  _id?: string;
  question: string;
  choices: Choice[];
  allowMultiple?: boolean;
  /** Optional per-layer recommendation lines (create / update payloads). */
  recommendations?: string[];
}

export interface PreSurveyQuestion {
  _id?: string;
  question: string;
  choices: Choice[];
  allowMultiple?: boolean;
}

/**
 * POST /assessment pre-survey entries — matches CCC-Director-Mobile `create-assessment.tsx`
 * (`preSurvey` array, not `preSurveyQuestions` with choice lists).
 */
export interface CreatePreSurveyEntryPayload {
  text: string;
  type: 'text' | 'number';
  placeholder: string;
  required: boolean;
}

export interface SectionRecommendation {
  level: string;
  message: string;
  minScore: number;
  maxScore: number;
}

export interface Section {
  _id?: string;
  name: string;
  description?: string;
  layers: Layer[];
  recommendations?: SectionRecommendation[];
  passingScore?: number;
  totalPoints?: number;
}

// ─── Assessment ───────────────────────────────────────────────────────────────

export interface AssessmentResponse {
  _id: string;
  name: string;
  description?: string;
  instructions?: string[];
  type?: AssessmentType;
  bannerImage?: string;
  sections: Section[];
  preSurveyQuestions?: PreSurveyQuestion[];
  assignments?: AssessmentAssigned[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentAssigned {
  _id: string;
  assessmentId: string;
  userId: string;
  status: AssessmentStatus;
  dueDate?: string;
  startedAt?: string;
  submittedAt?: string;
  answerId?: string;
  appointmentId?: string;
}

/**
 * Section body for POST /assessment — matches PATCH `/assessment/:id/sections`
 * (`buildSectionsPayload`) and mentor create wizard (title + choices with `text`).
 */
export interface AssessmentSectionCreateBody {
  title: string;
  description?: string;
  layers: Array<{
    title: string;
    choices: Array<{ text: string }>;
  }>;
  /** Per-section CDP levels 1–4 (distinct from choice `layers`). */
  recommendations?: Array<{ level: 1 | 2 | 3 | 4; items: string[] }>;
}

/** POST /assessment — aligned with CCC-Director-Mobile `CreateAssessmentRequest`. */
export interface CreateAssessmentPayload {
  name: string;
  description: string;
  instructions: string[];
  type: 'CMA' | 'PMP';
  sections: AssessmentSectionCreateBody[];
  /** Mobile sends `preSurvey` (not `preSurveyQuestions`). */
  preSurvey?: CreatePreSurveyEntryPayload[];
}

export interface UpdateAssessmentPayload extends Partial<CreateAssessmentPayload> {}

// ─── Answers ──────────────────────────────────────────────────────────────────

/** POST /assessment/:id/answers — backend validates `selectedChoice` (see CCC-Mobile). */
export interface LayerAnswer {
  layerId: string;
  selectedChoice: string;
  /** Some older docs used arrays; prefer selectedChoice for API compatibility. */
  selectedValues?: string[];
}

export interface SectionAnswer {
  sectionId: string;
  layers: LayerAnswer[];
}

export interface SubmitSectionAnswersPayload {
  userId: string;
  answers: SectionAnswer[];
}

/** POST /assessment/:id/submit-pre-survey — matches CCC-Mobile `SubmitPreSurveyPayload`. */
export interface SubmitPreSurveyPayload {
  userId: string;
  preSurveyAnswers: Array<{
    questionText: string;
    answer: string | number;
  }>;
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export interface SectionRecommendationRule {
  sectionId: string;
  minScore: number;
  maxScore: number;
  message: string;
}

export interface SendSectionRecommendationsPayload {
  userId: string;
  sectionId: string;
  recommendations: string[];
}

/** POST `/assessment/:assessmentId/assign` — assign from assessment module (notification path can differ from progress assign). */
export interface AssignAssessmentUsersPayload {
  userIds: string[];
  dueDate?: string;
}
