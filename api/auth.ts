import apiClient from "./apiClient";

// Register

export const registerUser = async (data: { email: string; password: string; name:string; phoneNumber: string; county: string; constituency: string; ward: string  }) => {
  const res = await apiClient.post("/auth/register", data);
  return res.data;
};

// Login
export const loginUser = async (data: { idNumber: string; password: string }) => {
  const res = await apiClient.post("/auth/login", data);
  return res.data; // expect token or OTP step
};

// Verify OTP
export const verifyOtp = async (data: { phoneNumber: string; otp: string }) => {
  const res = await apiClient.post("/auth/verify-otp", data);
  return res.data;
};
