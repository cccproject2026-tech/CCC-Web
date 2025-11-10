import axiosInstance from "./config/axios-instance";

export const apiGetMentors = () => {
    return axiosInstance.get(`/home/mentors`);
};

// ✅ Fetch all Roadmaps
export const apiGetRoadmaps = (queryParams = '') => {
  return axiosInstance.get(`/roadmaps${queryParams}`);
};
