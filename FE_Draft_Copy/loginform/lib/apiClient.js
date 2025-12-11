import axios from "axios";

// Đổi lại link API thật khi deploy
const apiURL = "https://cb-gift-app-xsgw5.ondigitalocean.app";
// const apiURL = "https://localhost:7015";

const apiClient = axios.create({
  baseURL: apiURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Biến cờ để kiểm tra xem có đang refresh token hay không
let isRefreshing = false;
// Hàng đợi lưu các request bị lỗi 401 để chạy lại sau khi refresh xong
let failedQueue = [];

// Hàm thêm request vào hàng đợi
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// 1. Gắn Token vào Header
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

// 2. Xử lý lỗi trả về (Tự động Refresh Token)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Loại bỏ các request Login hoặc Refresh để tránh vòng lặp vô hạn
    const isLoginEndpoint = originalRequest.url.includes("/api/auth/login");
    const isRefreshEndpoint = originalRequest.url.includes("/api/auth/refresh-token");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isLoginEndpoint &&
      !isRefreshEndpoint
    ) {
      // === LOGIC XỬ LÝ HÀNG ĐỢI (RACE CONDITION FIX) ===
      
      if (isRefreshing) {
        // Nếu đang có request khác refresh rồi, thì request này phải chờ
        return new Promise(function (resolve, reject) {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject: (err) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        // Gọi API Refresh
        // Lưu ý: Thêm withCredentials: true để đảm bảo cookie được gửi/nhận đúng nếu backend cần
        const res = await axios.post(
          `${apiURL}/api/auth/refresh-token`,
          { refreshToken: refreshToken },
          { withCredentials: true } 
        );

        if (res.status === 200) {
          const { accessToken, refreshToken: newRefToken } = res.data;
          
          // Lưu token mới
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefToken);

          // Gắn token mới vào header cho request mặc định
          apiClient.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Xử lý xong -> Giải phóng hàng đợi đang chờ
          processQueue(null, accessToken);
          
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh thất bại -> Từ chối tất cả hàng đợi -> Logout
        processQueue(refreshError, null);
        console.error("Session expired:", refreshError);
        
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/";
        
        return Promise.reject(refreshError);
      } finally {
        // Luôn tắt cờ refresh dù thành công hay thất bại
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
