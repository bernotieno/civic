// import React, { createContext, useContext, useState } from "react";
// import { loginUser, registerUser, verifyOtp } from "../api/auth";

// // Define proper types
// interface User {
//   id: string;
//   email: string;
//   phoneNumber: string;
//   idNumber: string;
//   firstName: string;
//   lastName: string;
//   isVerified: boolean;
// }

// interface LoginResponse {
//   success: boolean;
//   otpRequired?: boolean;
//   token?: string;
//   user?: User;
//   message?: string;
// }

// interface RegisterResponse {
//   success: boolean;
//   message: string;
//   requiresVerification?: boolean;
// }

// interface VerifyResponse {
//   success: boolean;
//   token: string;
//   user: User;
//   message?: string;
// }

// interface AuthContextType {
//   user: User | null;
//   token: string | null;
//   login: (idNumber: string, password: string) => Promise<void>;
//   register: (data: {
//     email: string;
//     phoneNumber: string;
//     idNumber: string;
//     firstName: string;
//     lastName: string;
//     password: string;
//   }) => Promise<void>;
//   verify: (phoneNumber: string, otp: string) => Promise<void>;
//   resendOtp: (phoneNumber: string) => Promise<void>;
//   logout: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [token, setToken] = useState<string | null>(null);

//   const login = async (idNumber: string, password: string) => {
//     const data: LoginResponse = await loginUser({ idNumber, password });
//     if (data.token && data.user) {
//       setToken(data.token);
//       setUser(data.user);
//     }
//     // if otpRequired === true → navigate to OTP screen from your component
//   };

//   const register = async (formData: {
//     email: string;
//     phoneNumber: string;
//     idNumber: string;
//     name: string;
//     county: string;
//     constituency: string;
//     ward: string;
//     password: string;
//   }) => {
//     const data: RegisterResponse = await registerUser(formData);
//     // handle data.requiresVerification === true → navigate to OTP screen
//   };

//   const verify = async (phoneNumber: string, otp: string) => {
//     const data: VerifyResponse = await verifyOtp({ phoneNumber, otp });
//     if (data.token && data.user) {
//       setToken(data.token);
//       setUser(data.user);
//     }
//   };

//   const logout = () => {
//     setToken(null);
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, token, login, register, verify, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error("useAuth must be used within AuthProvider");
//   return context;
// };
