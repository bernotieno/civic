import axios from "axios";

const apiClient = axios.create({
  baseURL: "", // change to backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
