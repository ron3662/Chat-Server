let socket: WebSocket | null = null;

export function SocketConnectionService() {
  const createConnection = (userId: string, onMessage: Function) => {
    if (socket) {
      socket.close();
      socket = null;
    }

    socket = new WebSocket("wss://chat-server-jznv.onrender.com");
    socket.onopen = () => {
      socket?.send(JSON.stringify({ type: "auth", userId }));
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
  };

  const sendSocketMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "message", ...message }));
    }
  };

  const typing = (userId: string, selectedUserId: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({ type: "typing", from: userId, to: selectedUserId }),
      );
    }
  };

  const closeConnection = () => {
    if (socket) {
      socket.close();
      socket = null;
    }
  };

  const getSocket = () => socket;
  return {
    createConnection,
    sendSocketMessage,
    typing,
    closeConnection,
    getSocket,
  };
}
