// Roadmap types matching CCC-Backend roadmaps module DTOs

export type RoadmapStatus = 'in progress' | 'not started' | 'completed';

export type ExtraType =
  | 'TEXT_FIELD'
  | 'TEXT_AREA'
  | 'TEXT_DISPLAY'
  | 'CHECKBOX'
  | 'UPLOAD'
  | 'DATE_PICKER'
  | 'SECTION'
  | 'ASSESSMENT'
  | 'SIGNATURE';

export interface TextFieldExtra {
  type: 'TEXT_FIELD';
  name: string;
  placeHolder?: string;
  buttonName?: string;
}

export interface TextAreaExtra {
  type: 'TEXT_AREA';
  name: string;
  placeHolder?: string;
  buttonName?: string;
}

export interface TextDisplayExtra {
  type: 'TEXT_DISPLAY';
  name: string;
}

export interface CheckboxExtra {
  type: 'CHECKBOX';
  name: string;
  haveButton: boolean;
  buttonName?: string;
}

export interface UploadExtra {
  type: 'UPLOAD';
  name: string;
}

export interface DatePickerExtra {
  type: 'DATE_PICKER';
  name: string;
  date?: string;
  checkboxes?: CheckboxExtra[];
  buttonName?: string;
}

export interface AssessmentExtra {
  type: 'ASSESSMENT';
  name: string;
  assessmentId: string;
  buttonName?: string;
  checkboxes?: CheckboxExtra[];
}

export interface SignatureExtra {
  type: 'SIGNATURE';
  name: string;
  buttonName?: string;
  signatureData?: string;
  signedAt?: string;
}

export interface SectionExtra {
  type: 'SECTION';
  name: string;
  checkboxes?: CheckboxExtra[];
  sections?: ExtraItem[];
}

export type ExtraItem =
  | TextFieldExtra
  | TextAreaExtra
  | TextDisplayExtra
  | CheckboxExtra
  | UploadExtra
  | DatePickerExtra
  | AssessmentExtra
  | SignatureExtra
  | SectionExtra;

// ─── Nested RoadMap Item ──────────────────────────────────────────────────────

export interface NestedRoadMapItem {
  _id?: string;
  name: string;
  roadMapDetails?: string;
  description?: string;
  status?: RoadmapStatus;
  duration: string;
  startDate?: string;
  endDate?: string;
  completedOn?: string;
  imageUrl?: string;
  meetings?: string[];
  phase?: string;
  totalSteps?: number;
  extras?: ExtraItem[];
}

// ─── RoadMap ──────────────────────────────────────────────────────────────────

export interface RoadMapResponse {
  _id: string;
  type: string;
  name: string;
  roadMapDetails?: string;
  description?: string;
  /** 'in progress' | 'not started' | 'completed' */
  status: string;
  duration?: string;
  startDate?: string;
  endDate?: string;
  completedOn?: string;
  imageUrl?: string;
  meetings?: string[];
  extras?: ExtraItem[];
  divisions?: string[];
  haveNextedRoadMaps: boolean;
  phase?: string;
  assesmentId?: string;
  totalSteps?: number;
  roadmaps: NestedRoadMapItem[];
  createdAt?: string;
  updatedAt?: string;
  /** Populated creator or raw id — backend may use `created_by` before normalization. */
  createdBy?: PopulatedUser | string | Record<string, unknown>;
}

export interface CreateRoadMapPayload {
  type: string;
  name: string;
  roadMapDetails?: string;
  description?: string;
  status?: RoadmapStatus;
  duration: string;
  startDate?: string;
  endDate?: string;
  completedOn?: string;
  imageUrl?: string;
  meetings?: string[];
  extras?: ExtraItem[];
  divisions?: string[];
  phase?: string;
  assesmentId?: string;
  totalSteps?: number;
  roadmaps?: NestedRoadMapItem[];
}

export interface UpdateRoadMapPayload extends Partial<CreateRoadMapPayload> {}

export interface UpdateNestedRoadMapItemPayload {
  name?: string;
  roadMapDetails?: string;
  description?: string;
  status?: RoadmapStatus;
  duration?: string;
  startDate?: string;
  endDate?: string;
  completedOn?: string;
  imageUrl?: string;
  meetings?: string[];
  phase?: string;
  totalSteps?: number;
  extras?: ExtraItem[];
}

// ─── Comments ────────────────────────────────────────────────────────────────

export interface PopulatedUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
  role: string;
}

export interface AddCommentPayload {
  text: string;
  userId: string;
  mentorId: string;
}

export interface CommentItem {
  _id: string;
  mentorId: PopulatedUser;
  text: string;
  addedDate: string;
}

export interface CommentsThread {
  _id: string;
  userId: string;
  roadMapId: string;
  comments: CommentItem[];
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export interface CreateQueryPayload {
  actualQueryText: string;
  userId: string;
  nestedRoadMapItemId?: string;
}

export interface ReplyQueryPayload {
  repliedAnswer: string;
  repliedMentorId: string;
}

/** PATCH pastor-owned query text while still pending — backend parity with mobile/API. */
export interface UpdatePastorQueryPayload {
  userId: string;
  actualQueryText: string;
  nestedRoadMapItemId?: string;
}

export interface QueryItem {
  _id: string;
  actualQueryText: string;
  createdDate: string;
  repliedAnswer?: string;
  repliedDate?: string;
  repliedMentorId?: PopulatedUser;
  status: 'pending' | 'answered';
  nestedRoadMapItemId?: string;
  nestedItemId?: string;
  taskId?: string;
  roadmapItemId?: string;
}

export interface QueriesThread {
  _id: string;
  userId: string;
  roadMapId: string;
  queries: QueryItem[];
}

// ─── Extras ──────────────────────────────────────────────────────────────────

export interface CreateExtrasPayload {
  userId: string;
  /** Some backend deployments still require roadMapId in body (mobile parity). */
  roadMapId?: string;
  nestedRoadMapItemId?: string;
  extras?: Record<string, any>[];
}

export interface UpdateExtrasPayload {
  extras?: Record<string, any>[];
}

export interface FileData {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface ExtrasDocument {
  uploadBatchId: string;
  uploadedAt: string;
  name?: string;
  files: FileData[];
}

export interface ExtrasResponse {
  id: string;
  userId: string;
  roadMapId: string;
  nestedRoadMapItemId?: string;
  extras: Record<string, any>[];
  uploadedDocuments?: ExtrasDocument[];
  createdAt: string;
  updatedAt: string;
}
