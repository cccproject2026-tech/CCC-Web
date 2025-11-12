//api.ts

import axiosInstance from "./config/axios-instance";

// Types
interface Comment {
  _id: string;
  text: string;
  addedDate: string;
  mentorId: { _id: string };
}

interface Query {
  _id: string;
  actualQueryText: string;
  createdDate: string;
  repliedAnswer?: string;
  repliedDate?: string;
  repliedMentorId?: { _id: string };
  status: 'pending' | 'answered';
}

export const apiGetMentors = () => {
    return axiosInstance.get(`/home/mentors`);
};

// ✅ Roadmap APIs
export const apiGetRoadmaps = (queryParams = '') => {
  return axiosInstance.get(`/roadmaps${queryParams}`);
};

export const apiGetRoadmapById = (id: string) => {
  return axiosInstance.get(`/roadmaps/${id}`);
};

export const apiUpdateRoadmapData = (id: string, data: any) => {
  return axiosInstance.patch(`/roadmaps/${id}`, data);
};

export const apiUploadRoadmapFile = (id: string, formData: FormData) => {
  return axiosInstance.post(`/roadmaps/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Comments APIs
export const apiAddComment = (roadmapId: string, data: { text: string; userId: string; mentorId: string }) => {
  return axiosInstance.post(`/roadmaps/${roadmapId}/comments`, data);
};

export const apiGetComments = (roadmapId: string, userId: string) => {
  return axiosInstance.get(`/roadmaps/${roadmapId}/comments?userId=${userId}`);
};

// Queries APIs
export const apiAddQuery = (roadmapId: string, data: { actualQueryText: string; userId: string }) => {
  return axiosInstance.post(`/roadmaps/${roadmapId}/queries`, data);
};

export const apiGetQueries = (roadmapId: string, userId: string) => {
  return axiosInstance.get(`/roadmaps/${roadmapId}/queries?userId=${userId}`);
};

export const apiReplyToQuery = (roadmapId: string, queryId: string, data: { repliedAnswer: string; repliedMentorId: string }) => {
  return axiosInstance.patch(`/roadmaps/${roadmapId}/queries/${queryId}/reply`, data);
};
        