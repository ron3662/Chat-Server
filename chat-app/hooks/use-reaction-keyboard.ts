import { useState } from "react";

export function useReactionKeyboard() {
  const [visible, setVisible] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const open = (messageId: string, pos: { x: number; y: number }) => {
    setActiveMessageId(messageId);
    setPosition(pos);
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
    setActiveMessageId(null);
  };

  return {
    visible,
    activeMessageId,
    position,
    open,
    close,
  };
}