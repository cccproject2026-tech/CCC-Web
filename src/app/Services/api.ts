import axiosInstance from "./config/axios-instance";

export const apiGetMentors = () => {
    return axiosInstance.get(`/home/mentors`);
};