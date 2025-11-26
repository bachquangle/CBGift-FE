import axios from "axios";

// 1. Đọc biến môi trường (từ .env.local hoặc DigitalOcean)
//const apiURL = process.env.NEXT_PUBLIC_API_URL;
//const apiURL = "https://cb-gift-app-xsgw5.ondigitalocean.app";
const apiURL = "https://localhost:7015";
// 2. Tạo một instance (thể hiện) axios đã được cấu hình sẵn
const apiClient = axios.create({
  // baseURL chính là "biến chung" mà bạn muốn
  baseURL: apiURL,

  // Quan trọng: Tự động gửi cookie (cho JWT) lên server
  // (Backend .NET của bạn đọc JWT từ cookie)
  withCredentials: true,
});

/*
  (Tùy chọn) Xử lý lỗi tập trung:
  axios cho phép bạn "can thiệp" (intercept) vào các phản hồi (response)
  để xử lý lỗi một cách tập trung.
*/
apiClient.interceptors.response.use(
  (response) => {
    // Nếu request thành công (status 2xx), trả về response
    return response;
  },
  (error) => {
    // Nếu request thất bại (status 4xx, 5xx)
    console.error(
      "Lỗi API từ interceptor:",
      error.response?.data || error.message
    );

    // Ném (throw) lỗi để component có thể bắt (catch)
    return Promise.reject(error);
  }
);

export default apiClient;
