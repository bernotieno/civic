import React, { createContext, useContext, useState } from "react";
import { loginUser, registerUser, verifyOtp } from "../api/auth";

interface AuthContextType {
  user: any | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  verify: (email: string, otp: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    const data = await loginUser({ email, password });
    // Example response: { otpRequired: true } OR { token: "abc123", user: {...} }
    if (data.token) {
      setToken(data.token);
      setUser(data.user);
    }
  };

  const register = async (email: string, password: string) => {
    await registerUser({ email, password });
  };

  const verify = async (email: string, otp: string) => {
    const data = await verifyOtp({ phoneNumber, otp });
    setToken(data.token);
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, verify }}>

      {children}
      
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
