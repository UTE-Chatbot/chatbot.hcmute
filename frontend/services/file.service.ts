import { api } from "@/lib/api";

/**
 * Upload a file to the server
 * @param {File} file - The file to upload
 * @returns {Promise} - Axios response
 */
export const uploadFile = async (file: File) => {
  if (!file) throw new Error("No file provided");

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await api.post("/files/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.public_url;
  } catch (error) {
    console.error("File upload failed:", error);
    throw error;
  }
};
