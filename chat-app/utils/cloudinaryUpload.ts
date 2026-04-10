import axios from "axios";

const SERVER_URL = "https://chat-server-jznv.onrender.com";

export const uploadToCloudinary = async (fileUri: string): Promise<string> => {
  try {
    const filename = fileUri.split("/").pop() || "file";

    // Determine MIME type
    let mimeType = "application/octet-stream";
    if (filename.endsWith(".gif")) mimeType = "image/gif";
    else if (filename.endsWith(".png")) mimeType = "image/png";
    else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg"))
      mimeType = "image/jpeg";
    else if (filename.endsWith(".mp4")) mimeType = "video/mp4";
    else if (filename.endsWith(".webp")) mimeType = "image/webp";

    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: filename,
      type: mimeType,
    } as any);

    const response = await axios.post(`${SERVER_URL}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data.url;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};
