import axios from "axios";

const SERVER_URL = "https://chat-server-jznv.onrender.com";

const getResourceType = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "raw"; // 🔥 pdf, doc, zip etc.
};

export const uploadToCloudinary = async (fileUri: string): Promise<string> => {
  try {
    const filename = fileUri.split("/").pop() || "file";

    let mimeType = "application/octet-stream";

    if (filename.endsWith(".gif")) mimeType = "image/gif";
    else if (filename.endsWith(".png")) mimeType = "image/png";
    else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg"))
      mimeType = "image/jpeg";
    else if (filename.endsWith(".mp4")) mimeType = "video/mp4";
    else if (filename.endsWith(".webp")) mimeType = "image/webp";
    else if (filename.endsWith(".pdf")) mimeType = "application/pdf"; // 🔥 ADD THIS

    const resourceType = getResourceType(mimeType);

    const formData = new FormData();

    formData.append("file", {
      uri: fileUri,
      name: filename,
      type: mimeType,
    } as any);

    // 🔥 IMPORTANT FIX
    formData.append("resource_type", resourceType);

    const response = await axios.post(`${SERVER_URL}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data.url;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};
