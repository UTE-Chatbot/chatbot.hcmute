import axios from "axios";
import Visitor from "@/lib/visitor";

const baseApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

baseApi.interceptors.request.use(
  async (config) => {
    const id = Visitor.get() || (await Visitor.init());

    if (id) {
      config.headers["x-visitor-id"] = id;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const api = baseApi;
