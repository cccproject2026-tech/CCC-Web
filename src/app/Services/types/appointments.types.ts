// Appointment types matching CCC-Backend appointments module DTOs

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
export type AppointmentPlatform = 'zoom' | 'google-meet' | 'teams' | 'in-person' | 'phone';

export interface PersonInfo {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
  role?: string;
  roleId?: string;
  status?: string;
}

export interface AppointmentResponse {
  _id: string;
  /** some endpoints populate this into `id` */
  id?: string;
  userId: string | PersonInfo;
  mentorId: string | PersonInfo;
  /** populated mentor object (some endpoints) */
  mentor?: PersonInfo;
  /** populated user object (some endpoints) */
  user?: PersonInfo;
  meetingDate: string;
  endTime?: string;
  /** backend also returns 'gmeet' in some responses */
  platform: string;
  meetingLink?: string;
  status: string;
  notes?: string;
  zoomMeetingId?: string;
  zoomJoinUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAppointmentPayload {
  /** userId is accepted by the backend even if not in the DTO */
  userId?: string;
  mentorId: string;
  meetingDate: string;         // ISO date string
  platform: string;
  meetingLink?: string;
  notes?: string;
}

export interface UpdateAppointmentPayload {
  meetingDate?: string;
  platform?: AppointmentPlatform;
  meetingLink?: string;
  notes?: string;
  status?: AppointmentStatus;
}

export interface CancelAppointmentPayload {
  reason?: string;
}

export interface RescheduleAppointmentPayload {
  newDate: string;       // ISO datetime string
  startTime: string;     // e.g. "3:00"
  startPeriod: string;   // "AM" | "PM"
  platform?: AppointmentPlatform;
  meetingLink?: string;
}

// Availability
export interface TimeSlot {
  start: string;   // HH:mm
  end: string;     // HH:mm
}

export interface DayAvailability {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  slots: TimeSlot[];
  isAvailable: boolean;
}

export interface AvailabilityPayload {
  mentorId: string;
  weeklySlots: DayAvailability[];
  meetingDuration?: number;   // minutes
  bufferTime?: number;        // minutes between slots
  advanceNotice?: number;     // hours required before booking
  maxBookingsPerDay?: number;
}

export interface GetAppointmentsParams {
  userId?: string;
  mentorId?: string;
  status?: AppointmentStatus;
  futureOnly?: boolean;
}

// ─── Transcript Summary ─────────────────────────────────────────────────────────

export interface TranscriptSummaryDto {
  sessionOverview: string;
  keyDiscussionPoints: string[];
  mentorGuidance: string[];
  actionItems: string[];
  followUp: string;
}

export interface TranscriptSummaryResponseDto {
  appointmentId: string;
  transcript?: string;
  transcriptSavedAt?: Date;
  summary: TranscriptSummaryDto;
  generatedAt: Date;
  model: string;
  cached: boolean;
}

// ─── Legacy alias ─────────────────────────────────────────────────────────────
/** @deprecated use AppointmentResponse */
export type Appointment = AppointmentResponse;
