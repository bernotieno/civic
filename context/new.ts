// import React, { createContext, useContext, useState } from "react";
// import { loginUser, registerUser, verifyOtp } from "../api/auth";

// // Define proper types instead of using 'any'
// interface User {
//   id: string;
//   email: string;
//   phoneNumber: string;
//   idNumber: string;
//   firstName: string;   //SHould be Fullname only
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
//   loading: boolean;
//   error: string | null;
//   isAuthenticated: boolean;
//   otpRequired: boolean;
//   pendingVerificationPhone: string | null;
  
//   // Auth methods
//   login: (idNumber: string, password: string) => Promise<LoginResponse>;
//   register: (userData: {
//     email: string;
//     password: string;
//     firstName: string;
//     lastName: string;
//     phoneNumber: string;
//     idNumber: string;
//   }) => Promise<RegisterResponse>;
//   verify: (phoneNumber: string, otp: string) => Promise<boolean>;
//   logout: () => void;
//   clearError: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [otpRequired, setOtpRequired] = useState<boolean>(false);
//   const [pendingVerificationPhone, setPendingVerificationPhone] = useState<string | null>(null);

//   // Computed value for authentication status
//   const isAuthenticated = Boolean(token && user?.isVerified);

//   const clearError = () => {
//     setError(null);
//   };

//   const login = async (idNumber: string, password: string): Promise<LoginResponse> => {
//     setLoading(true);
//     setError(null);

//     try {
//       const data: LoginResponse = await loginUser({ idNumber, password });
      
//       if (data.success) {
//         if (data.otpRequired) {
//           // User exists but needs OTP verification
//           setOtpRequired(true);
//           // You might want to store phone number from response for verification
//           // setPendingVerificationPhone(data.phoneNumber);
//           return data;
//         } else if (data.token && data.user) {
//           // User is fully authenticated
//           setToken(data.token);
//           setUser(data.user);
//           setOtpRequired(false);
//           return data;
//         }
//       }
      
//       // Handle unsuccessful login
//       setError(data.message || 'Login failed');
//       return data;
      
//     } catch (err: any) {
//       const errorMessage = err.response?.data?.message || err.message || 'Login failed';
//       setError(errorMessage);
//       return {
//         success: false,
//         message: errorMessage
//       };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const register = async (userData: {
//     email: string;
//     password: string;
//     firstName: string;
//     lastName: string;
//     phoneNumber: string;
//     idNumber: string;
//   }): Promise<RegisterResponse> => {
//     setLoading(true);
//     setError(null);

//     try {
//       const data: RegisterResponse = await registerUser(userData);
      
//       if (data.success) {
//         if (data.requiresVerification) {
//           // Registration successful but needs phone verification
//           setOtpRequired(true);
//           setPendingVerificationPhone(userData.phoneNumber);
//         }
//         return data;
//       } else {
//         setError(data.message || 'Registration failed');
//         return data;
//       }
      
//     } catch (err: any) {
//       const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
//       setError(errorMessage);
//       return {
//         success: false,
//         message: errorMessage
//       };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const verify = async (phoneNumber: string, otp: string): Promise<boolean> => {
//     setLoading(true);
//     setError(null);

//     try {
//       const data: VerifyResponse = await verifyOtp({ phoneNumber, otp });
      
//       if (data.success && data.token && data.user) {
//         setToken(data.token);
//         setUser(data.user);
//         setOtpRequired(false);
//         setPendingVerificationPhone(null);
//         return true;
//       } else {
//         setError(data.message || 'Verification failed');
//         return false;
//       }
      
//     } catch (err: any) {
//       const errorMessage = err.response?.data?.message || err.message || 'Verification failed';
//       setError(errorMessage);
//       return false;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = () => {
//     setUser(null);
//     setToken(null);
//     setOtpRequired(false);
//     setPendingVerificationPhone(null);
//     setError(null);
//     // You might also want to clear stored tokens from AsyncStorage here
//   };

//   const contextValue: AuthContextType = {
//     user,
//     token,
//     loading,
//     error,
//     isAuthenticated,
//     otpRequired,
//     pendingVerificationPhone,
//     login,
//     register,
//     verify,
//     logout,
//     clearError,
//   };

//   return (
//     <AuthContext.Provider value={contextValue}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within AuthProvider");
//   }
//   return context;
// };

// // Example usage in a component:
// /*
// const LoginScreen = () => {
//   const { login, loading, error, otpRequired } = useAuth();
//   const [idNumber, setIdNumber] = useState('');
//   const [password, setPassword] = useState('');

//   const handleLogin = async () => {
//     const result = await login(idNumber, password);
//     if (result.success && result.otpRequired) {
//       // Navigate to OTP verification screen
//       // navigation.navigate('OTPVerification');
//     } else if (result.success && result.token) {
//       // Navigate to main app
//       // navigation.navigate('Home');
//     }
//   };

//   if (otpRequired) {
//     return <OTPVerificationScreen />;
//   }

//   return (
//     // Your login form JSX here
//   );
// };

// const OTPVerificationScreen = () => {
//   const { verify, pendingVerificationPhone, loading, error } = useAuth();
//   const [otp, setOtp] = useState('');

//   const handleVerify = async () => {
//     if (pendingVerificationPhone) {
//       const success = await verify(pendingVerificationPhone, otp);
//       if (success) {
//         // Navigate to main app
//         // navigation.navigate('Home');
//       }
//     }
//   };

//   return (
//     // Your OTP verification form JSX here
//   );
// };
// */