import api from "./apiClient"

export const getAllMicroGrand = async () => {
    const res = await api.get("microgrant/applications");
    console.log(res.data.data);
    return res;
};

export const getMicroGrantByUserId = async (userId: string) => {
    const res = await api.get(`microgrant/application/${userId}`);
    console.log(res.data.data);
    return res.data.data;
};

export const getMicroGrantForm = async () => {
    return api.get("microgrant/form");
};

export const updateMicroGrantStatus = async (
    applicationId: string,
    status: "new" | "pending" | "accepted" | "rejected"
) => {
    return api.patch(`microgrant/application/${applicationId}/status`, {
        status,
    });
};