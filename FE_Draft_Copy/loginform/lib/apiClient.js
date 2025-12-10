import axios from "axios";

// Đổi lại link API thật khi deploy
const apiURL = "https://cb-gift-app-xsgw5.ondigitalocean.app"; 
// const apiURL = "https://localhost:7015";

// 2. Tạo một instance (thể hiện) axios đã được cấu hình sẵn
const apiClient = axios.create({
  baseURL: apiURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Vẫn giữ để Web Desktop dùng Cookie nếu cần
});

// INTERCEPTOR 1: Tự động gắn AccessToken vào Header (Cho Mobile)
apiClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage (Bạn phải lưu nó khi Login thành công)
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// INTERCEPTOR 2: Tự động Refresh Token khi gặp lỗi 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và chưa từng thử lại (để tránh lặp vô tận)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Lấy refresh token từ localStorage
        const refreshToken = localStorage.getItem("refreshToken");
        
        if (!refreshToken) {
            // Không có refresh token -> Bắt đăng nhập lại
            throw new Error("No refresh token");
        }

        // Gọi API Refresh (Gửi Token qua Body)
        const res = await axios.post(`${apiURL}/api/auth/refresh-token`, {
            refreshToken: refreshToken
        });

        if (res.status === 200) {
          // 1. Lưu token mới vào localStorage
          const { accessToken, refreshToken: newRefreshToken } = res.data;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefreshToken);

          // 2. Cập nhật header cho request cũ và gọi lại
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error("Refresh token failed:", refreshError);
        // Xóa sạch token và chuyển hướng về trang login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;