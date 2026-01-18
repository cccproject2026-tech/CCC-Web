import { axiosInstance } from "./api";
import api from "./apiClient";

export const getAllMedia = () => {
    return api.get("/media");
};

export const getMediaByType = (type: "video" | "image") => {
    return api.get("/media", {
        params: { type },
    });
};

export const createMedia = (payload: {
    heading: string;
    subheading?: string;
    description?: string;
    defaultType?: "video" | "image";
    files: File[];
}) => {
    const formData = new FormData();

    formData.append("heading", payload.heading);

    if (payload.subheading) {
        formData.append("subheading", payload.subheading);
    }

    if (payload.description) {
        formData.append("description", payload.description);
    }

    if (payload.defaultType) {
        formData.append("defaultType", payload.defaultType);
    }

    payload.files.forEach((file) => {
        formData.append("files", file);
    });

    return axiosInstance.post("/home/media", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const updateMedia = (mediaId: string, data: {
    heading?: string;
    subheading?: string;
    description?: string;
}) => {
    return axiosInstance.patch(`/media/${mediaId}`, data);
};

export const deleteMedia = (mediaId: string) => {
    return axiosInstance.delete(`/media/${mediaId}`);
};

export const deleteMultipleMedia = (mediaIds: string[]) => {
    return axiosInstance.post("/media/bulk-delete", {
        mediaIds,
    });
};
