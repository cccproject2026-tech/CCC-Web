// Interest types matching CCC-Backend interests module DTOs

export type InterestStatus = 'new' | 'pending' | 'accepted' | 'rejected';

export type InterestTitle =
  | 'Pastor'
  | 'Lay Leader'
  | 'Seminarian'
  | 'Mentor'
  | 'Field Mentor'
  | 'Director';

export interface ChurchDetails {
  churchName?: string;
  churchPhone?: string;
  churchWebsite?: string;
  churchAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface InterestResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  title?: InterestTitle;
  status: InterestStatus;
  profileInfo?: string;
  profilePicture?: string;
  churchDetails?: ChurchDetails[];
  conference?: string;
  yearsInMinistry?: string;
  currentCommunityProjects?: string;
  interests?: string[];
  comments?: string;
  userId?: string;
  user?: {
    _id: string;
    role: string;
    roleId?: string;
    isEmailVerified: boolean;
  };
  createdAt: string;
  updatedAt?: string;
}

/** POST /interests — matches backend form-fields (see /interests/form-fields). */
export interface CreateInterestPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  title?: InterestTitle;
  comments?: string;
  interests?: string[];
  churchDetails?: ChurchDetails[];
  conference?: string;
  yearsInMinistry?: string;
  currentCommunityProjects?: string;
}

export interface UpdateInterestPayload {
  churchDetails?: ChurchDetails[];
  phoneNumber?: string;
  title?: InterestTitle;
  conference?: string;
  yearsInMinistry?: string;
  currentCommunityProjects?: string;
  interests?: string[];
  comments?: string;
}

export interface UpdateInterestStatusPayload {
  status: 'accepted' | 'rejected';
}

// Dynamic fields
export type DynamicFieldType = 'text' | 'number' | 'email' | 'select' | 'multiselect' | 'textarea' | 'date' | 'checkbox';

export interface DynamicFieldOption {
  label: string;
  value: string;
}

export interface DynamicField {
  _id?: string;
  label: string;
  type: DynamicFieldType;
  required?: boolean;
  options?: DynamicFieldOption[];
  placeholder?: string;
  order?: number;
}

export interface GetInterestsParams {
  search?: string;
  status?: InterestStatus | 'all';
}

// ─── Legacy alias ─────────────────────────────────────────────────────────────
/** @deprecated use InterestResponse */
export type Interest = InterestResponse;
