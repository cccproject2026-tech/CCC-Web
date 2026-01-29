import { axiosInstance } from "./api";

export const apiCreateAssessment = (payload: any) => {
    return axiosInstance.post("/assessments", payload);
};

export const apiGetAssessments = (params?: { search?: string }) => {
    return axiosInstance.get("/assessment", { params });
};

export const apiDeleteAssessments = (ids: string[]) => {
    return axiosInstance.delete('/assessment', {
        data: { ids },
    });
};

export const apiGetAssessmentById = (id: string) => {
    if (!id) {
        throw new Error("Assessment ID is required");
    }
    return axiosInstance.get(`/assessment/${id}`);
};