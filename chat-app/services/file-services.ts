import * as DocumentPicker from "expo-document-picker";
import * as VideoThumbnails from "expo-video-thumbnails";

export function fileServices() {
  const generateThumbnail = async (uri) => {
    try {
      const { uri: thumb } = await VideoThumbnails.getThumbnailAsync(uri, {
        time: 1000,
      });

      return thumb; // ✅ return instead of state
    } catch (e) {
      console.warn("Thumbnail error:", e);
      return null;
    }
  };

  const pickUniversalMedia = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled) return;
      let resultItems = [];
      for (const file of result.assets) {
        const uri = file.uri;
        const name = file.name;
        const mimeType = file.mimeType;
        let mediaPreviewUrl = "";
        // 🔥 Detect file type
        let type = "file";

        if (mimeType?.startsWith("image/")) {
          type = "image";
          if (mimeType === "image/gif") {
            type = "gif";
          }
        } else if (mimeType?.startsWith("video/")) {
          type = "video";
          mediaPreviewUrl = await generateThumbnail(uri);
        }

        resultItems.push({
          mediaType: type,
          mediaName: name,
          mediaPreviewUrl: mediaPreviewUrl || "",
          mediaUrl: uri || "",
        });
      }
      return resultItems; // ✅ return array of media items
    } catch (error) {
      console.error("Media pick failed:", error);
    }
  };
  return { generateThumbnail, pickUniversalMedia };
}
