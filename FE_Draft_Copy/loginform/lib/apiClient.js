import axios from "axios";

// 1. Config URL
const apiURL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://cb-gift-app-xsgw5.ondigitalocean.app";
//const apiURL = "https://localhost:7015";

const apiClient = axios.create({
  baseURL: apiURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Quan trọng để nhận Cookie nếu có
});

// --- BIẾN TOÀN CỤC ĐỂ QUẢN LÝ REFRESH ---
let isRefreshing = false;
let failedQueue = [];

// Hàm xử lý hàng đợi: Duyệt qua các request đang chờ và cho chúng chạy tiếp hoặc hủy bỏ
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      // Quan trọng: Cập nhật token mới vào header của request đang chờ
      prom.config.headers["Authorization"] = `Bearer ${token}`;
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ============================================================
// 1. REQUEST INTERCEPTOR (Chạy trước khi gửi request)
// ============================================================
apiClient.interceptors.request.use(
  (config) => {
    // Luôn lấy token mới nhất từ LocalStorage
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// 2. RESPONSE INTERCEPTOR (Chạy sau khi nhận response)
// ============================================================
apiClient.interceptors.response.use(
  (response) => response, // Nếu thành công (200-299), trả về luôn
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi không xác định hoặc là request login/refresh thì bỏ qua để tránh loop
    if (
      !originalRequest ||
      originalRequest.url.includes("/auth/login") ||
      originalRequest.url.includes("/auth/refresh-token")
    ) {
      return Promise.reject(error);
    }

    // NẾU LỖI LÀ 401 (UNAUTHORIZED) VÀ CHƯA TỪNG THỬ LẠI
    if (error.response?.status === 401 && !originalRequest._retry) {
      // --- TRƯỜNG HỢP A: ĐANG CÓ REQUEST KHÁC ĐI REFRESH ---
      // (Ví dụ: Bạn vào trang Dashboard, nó gọi API Profile và API Orders cùng lúc)
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({
            config: originalRequest, // Lưu lại config của request đang chờ
            resolve: (token) => {
              // Khi refresh xong, cập nhật header và gọi lại request này
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject: (err) => {
              reject(err);
            },
          });
        });
      }

      // --- TRƯỜNG HỢP B: LÀ REQUEST ĐẦU TIÊN PHÁT HIỆN HẾT HẠN ---
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        // Gọi API Refresh (Dùng axios gốc để tạo instance mới, tránh dính interceptor cũ)
        const res = await axios.post(
          `${apiURL}/api/auth/refresh-token`,
          {
            refreshToken: refreshToken, // camelCase (thường dùng)
            RefreshToken: refreshToken, // PascalCase (dự phòng cho .NET)
          },
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        );

        if (res.status === 200) {
          const { accessToken, refreshToken: newRefToken } = res.data;

          // 1. Lưu token mới
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefToken);

          // 2. Cập nhật header mặc định cho apiClient
          apiClient.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${accessToken}`;

          // 3. Xử lý hàng đợi (Giải phóng các request Profile, Notification đang chờ...)
          processQueue(null, accessToken);

          // 4. Gọi lại chính request này (Orders) với token mới
          originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh thất bại (Refresh token hết hạn hoặc lỗi server)
        processQueue(refreshError, null);
        console.error("Refresh failed, logging out:", refreshError);

        // Xóa sạch và đá về login
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false; // Mở khóa
      }
    }

    // Các lỗi khác (400, 403, 500...) trả về bình thường cho Component xử lý
    return Promise.reject(error);
  }
);

export default apiClient;
