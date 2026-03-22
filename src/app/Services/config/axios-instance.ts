// import axios from "axios";

// const axiosInstance = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, 
//   timeout: 10000,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // Request interceptor
// axiosInstance.interceptors.request.use(
//   (config) => {
//     if (typeof window !== 'undefined') {
//       const token = localStorage.getItem('authToken');
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // 🚨 Response Interceptor — handle errors
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // console.error("API Error:", error.response?.data || error.message);
//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;


import axios from "axios";
import { getCookie } from "@/app/utils/cookies";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,   // ✅ Use this as per your requirement
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// --------------------------------------------------
// REQUEST INTERCEPTOR (Attach Token)
// --------------------------------------------------
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getCookie("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --------------------------------------------------
// RESPONSE INTERCEPTOR (Handle API Errors)
// --------------------------------------------------
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // optional log:
    // console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;
