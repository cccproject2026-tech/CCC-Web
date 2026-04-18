// Assessment types matching CCC-Backend assessment module DTOs

export type AssessmentStatus = 'assigned' | 'in_progress' | 'submitted' | 'reviewed';
export type AssessmentType = 'CMA' | 'standard';

// ─── Choices / Layers / Sections ─────────────────────────────────────────────

export interface Choice {
  label: string;
  value: string;
  score?: number;
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
}

export interface PreSurveyQuestion {
  _id?: string;
  question: string;
  choices: Choice[];
  allowMultiple?: boolean;
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

export interface CreateAssessmentPayload {
  name: string;
  description?: string;
  instructions?: string[];
  type?: AssessmentType;
  sections: Section[];
  preSurveyQuestions?: PreSurveyQuestion[];
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
