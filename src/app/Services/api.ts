//api.ts

import axiosInstance from "./config/axios-instance";

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
        