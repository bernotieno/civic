import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";

// Create axios instance
const apiClient = axios.create({
  baseURL: 'https://your-api-endpoint.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      // Redirect to login screen
      router.push("/Loginscreen")
    }
    return Promise.reject(error);
  }
);

export default apiClient;