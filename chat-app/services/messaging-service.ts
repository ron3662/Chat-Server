import { SocketConnectionService } from "@/services/web-socket-connection-service";
import axios from "axios";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";
import { useEffect, useState, useRef } from "react";

export function useMessagingService() {
  const SERVER_URL = "https://chat-server-jznv.onrender.com";
  const {
    createConnection,
    sendSocketMessage,
    typing,
    closeConnection,
    getSocket,
  } = SocketConnectionService();

  const [userId, setUserId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState({
    from: "",
    to: "",
    text: "",
    media: [],
    time: new Date(),
  });
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingIndicatorRef = useRef<boolean>(false);

  const init = async (
    userId: string,
    selectedUserId: string,
    onTyping: Function,
    onTypingTimeout: Function,
  ) => {
    setUserId(userId);
    setSelectedUserId(selectedUserId);

    createConnection(userId, (data) => {
      if (data.from === selectedUserId) {
        if (data.type === "message") {
          setMessages((prev) => [...prev, data]);
        } else if (data.type === "typing") {
          onTyping();
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              onTypingTimeout();
            }, 2000);
          }
        }
      }
    });

    axios
      .get(`${SERVER_URL}/messages/${userId}/${selectedUserId}`)
      .then((res) => {
        setMessages(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.warn("Error loading messages:", err));
  };

  useEffect(() => {
    return () => {
      closeConnection();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const sendMessage = async () => {
    try {
      if (!chatMessage?.text?.trim() && (chatMessage?.media?.length ?? 0) === 0)
        setIsSending(true);

      //upload to cloudinary and get URLs for media items
      const mediaWithUrls = await Promise.all(
        (chatMessage.media || []).map(async (mediaItem) => {
          if (mediaItem.mediaUrl.startsWith("http")) {
            return mediaItem; // already has URL (e.g., GIFs)
          } else {
            const uploadedUrl = await uploadToCloudinary(mediaItem.mediaUrl);
            const mediaPreviewUrl =
              mediaItem.mediaType === "video" && mediaItem.mediaPreviewUrl
                ? await uploadToCloudinary(mediaItem.mediaPreviewUrl)
                : "";
            return {
              ...mediaItem,
              mediaUrl: uploadedUrl,
              mediaPreviewUrl: mediaPreviewUrl,
            };
          }
        }),
      );

      const finalMessage = {
        ...chatMessage,
        from: userId,
        to: selectedUserId,
        media: mediaWithUrls,
        time: new Date(),
      };

      sendSocketMessage(finalMessage);
      setMessages((prev) => [...prev, finalMessage]);

      setChatMessage({
        from: userId,
        to: selectedUserId,
        text: "",
        media: [],
        time: new Date(),
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setChatMessage((prev) => ({ ...prev, text }));

    if (!typingIndicatorRef.current && getSocket()) {
      typingIndicatorRef.current = true;
      typing(userId, selectedUserId);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingIndicatorRef.current = false;
    }, 2000);
  };

  return {
    init,
    sendMessage,
    handleTyping,
    chatMessage,
    setChatMessage,
    messages,
    isSending,
  };
}
