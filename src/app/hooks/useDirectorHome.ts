import { useState, useEffect, useCallback } from 'react';
import { setCookie } from '@/app/utils/cookies';
import {
  apiGetTodaysAppointments,
  apiGetUserAppointments,
  apiGetAllInterests,
  apiGetMentors,
  apiGetPastors,
  apiCreateUser,
  apiGetUserById,
  Appointment,
  Interest,
  MentorPastor,
  CreateUserDto,
  User,
} from '../Services/api';

// ===========================
// APPOINTMENTS HOOK
// ===========================

interface UseAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAppointments = (userId?: string): UseAppointmentsReturn => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = userId
        ? await apiGetUserAppointments(userId, true)
        : await apiGetTodaysAppointments();
      setAppointments(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    refetch: fetchAppointments,
  };
};

// ===========================
// INTERESTS HOOK
// ===========================

interface UseInterestsReturn {
  interests: Interest[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useInterests = (params?: { search?: string; status?: string }): UseInterestsReturn => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInterests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGetAllInterests(params);
      setInterests(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch interests');
      console.error('Error fetching interests:', err);
    } finally {
      setLoading(false);
    }
  }, [params?.search, params?.status]);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  return {
    interests,
    loading,
    error,
    refetch: fetchInterests,
  };
};

// ===========================
// MENTORS HOOK
// ===========================

interface UseMentorsReturn {
  mentors: MentorPastor[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useMentors = (params?: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}): UseMentorsReturn => {
  const [mentors, setMentors] = useState<MentorPastor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMentors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGetMentors(params);
      setMentors(response.data.mentors || []);
      setTotal(response.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch mentors');
      console.error('Error fetching mentors:', err);
    } finally {
      setLoading(false);
    }
  }, [params?.page, params?.limit, params?.role, params?.search]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  return {
    mentors,
    total,
    loading,
    error,
    refetch: fetchMentors,
  };
};

// ===========================
// PASTORS HOOK
// ===========================

interface UsePastorsReturn {
  pastors: MentorPastor[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePastors = (params?: {
  page?: number;
  limit?: number;
}): UsePastorsReturn => {
  const [pastors, setPastors] = useState<MentorPastor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPastors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiGetPastors(params);
      setPastors(response.data.data.users || []);
      setTotal(response.data.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch pastors');
      console.error('Error fetching pastors:', err);
    } finally {
      setLoading(false);
    }
  }, [params?.page, params?.limit]);

  useEffect(() => {
    fetchPastors();
  }, [fetchPastors]);

  return {
    pastors,
    total,
    loading,
    error,
    refetch: fetchPastors,
  };
};

// ===========================
// ADD USER HOOK
// ===========================

interface UseAddUserReturn {
  addUser: (data: CreateUserDto) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export const useAddUser = (): UseAddUserReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const addUser = async (data: CreateUserDto) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      await apiCreateUser(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add user');
      console.error('Error adding user:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    addUser,
    loading,
    error,
    success,
  };
};

// ===========================
// USER DETAILS HOOK
// ===========================

interface UseUserDetailsReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUserDetails = (userId: string): UseUserDetailsReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiGetUserById(userId);
      setUser(response.data.data || null);

      // Store userId in localStorage
      setCookie('userId', userId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user details');
      console.error('Error fetching user details:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    refetch: fetchUser,
  };
};
