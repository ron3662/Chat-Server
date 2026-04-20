import { useState } from "react";

export function useReactionKeyboard() {
  const [visible, setVisible] = useState(false);
  const [layout, setLayout] = useState({ x: 0, y: 0, widht: 0, height: 0, });

  const open = (layoutData) => {
    setLayout(layoutData);
    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  return {
    visible,
    layout,
    open,
    close,
  };
}