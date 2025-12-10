import axios from "axios";

// Đổi lại link API thật khi deploy
const apiURL = "https://cb-gift-app-xsgw5.ondigitalocean.app";
// const apiURL = "https://localhost:7015";

const apiClient = axios.create({
  baseURL: apiURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Để Desktop nhận Cookie
});

// 1. Gắn Token vào Header (Cho Mobile)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Tự động Refresh Token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và chưa thử refresh lần nào
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Đánh dấu đã thử

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        // Gọi API Refresh
        const res = await axios.post(`${apiURL}/api/auth/refresh-token`, {
          refreshToken: refreshToken,
        });

        if (res.status === 200) {
          const { accessToken, refreshToken: newRefToken } = res.data;

          // Lưu token mới
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefToken);

          // Gắn token mới vào request cũ và gọi lại
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error("Session expired:", refreshError);
        localStorage.clear();
        window.location.href = "/"; // Redirect về trang login
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
