import { api } from "@/lib/api";

export const createNewThread = async () => {
  let response = await api.post("/threads/new");
  return response.data;
};
