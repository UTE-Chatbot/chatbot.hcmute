import { api } from "@/lib/api";

export const signInWithGoogle = () => {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google/login`;
};

export const getUserProfile = async () => {
  const res = await api.get("/auth/me");
  return res.data;
};

export const logout = async () => {
  await api.post("/auth/logout");
};
