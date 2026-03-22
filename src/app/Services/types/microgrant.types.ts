// MicroGrant types matching CCC-Backend micro-grand module DTOs

export type MicroGrantStatus = 'new' | 'pending' | 'accepted' | 'rejected';
export type FormFieldType = 'text' | 'number' | 'email' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'date' | 'file';

// ─── Form ─────────────────────────────────────────────────────────────────────

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormField {
  _id?: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  options?: FormFieldOption[];
  placeholder?: string;
  order?: number;
}

export interface FormSection {
  _id?: string;
  title: string;
  fields: FormField[];
}

export interface MicroGrantForm {
  _id: string;
  title: string;
  description?: string;
  sections: FormSection[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOrUpdateFormPayload {
  title: string;
  description?: string;
  sections: FormSection[];
}

// ─── Application ─────────────────────────────────────────────────────────────

export interface MicroGrantApplicationResponse {
  _id: string;
  userId?: { _id: string; email: string; firstName?: string; lastName?: string } | null;
  formId?: { _id: string; title: string; description?: string } | null;
  answers?: Record<string, string>;
  supportingDocs?: string[];
  status: MicroGrantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApplyMicroGrantPayload {
  userId: string;
  formId: string;
  answers: Record<string, string>;
  /** supporting documents handled as FormData files */
}

export interface UpdateApplicationStatusPayload {
  status: MicroGrantStatus;
}

export interface MicroGrantWithUserResponse {
  user: {
    _id: string;
    email: string;
    role: string;
  };
  application: MicroGrantApplicationResponse;
}

// ─── Legacy aliases ───────────────────────────────────────────────────────────
/** @deprecated use MicroGrantApplicationResponse */
export type MicroGrantApplication = MicroGrantApplicationResponse;
/** @deprecated use MicroGrantWithUserResponse */
export type MicroGrantResponse = MicroGrantWithUserResponse;
