import axiosInstance from "./config/axios-instance";
import { Comment, Query } from "./types";

export const apiGetRoadmaps = (queryParams = '') => {
  return axiosInstance.get(`/roadmaps${queryParams}`);
};

export const apiGetRoadmapsByUser = (userId: string) => {
  return axiosInstance.get(`/roadmaps/user/${userId}`);
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

export const apiAddComment = (roadmapId: string, data: { text: string; userId: string; mentorId: string }) => {
  return axiosInstance.post(`/roadmaps/${roadmapId}/comments`, data);
};

export const apiGetComments = (roadmapId: string, userId: string) => {
  return axiosInstance.get(`/roadmaps/${roadmapId}/comments?userId=${userId}`);
};

export const apiAddQuery = (roadmapId: string, data: { actualQueryText: string; userId: string }) => {
  return axiosInstance.post(`/roadmaps/${roadmapId}/queries`, data);
};

export const apiGetQueries = (roadmapId: string, userId: string) => {
  return axiosInstance.get(`/roadmaps/${roadmapId}/queries?userId=${userId}`);
};

export const apiReplyToQuery = (roadmapId: string, queryId: string, data: { repliedAnswer: string; repliedMentorId: string }) => {
  return axiosInstance.patch(`/roadmaps/${roadmapId}/queries/${queryId}/reply`, data);
};
