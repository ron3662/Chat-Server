import React, { createContext, useContext, useState, ReactNode } from "react";

type UserContextType = {
  userId: string;
  setUserId: (id: string) => void;
  username: string;
  setUsername: (name: string) => void;
  avatar: string;
  setAvatar: (url: string) => void;
  tagline: string;
  setTagline: (text: string) => void;
};

const UserContext = createContext<UserContextType>({
  userId: "",
  setUserId: () => {},
  username: "",
  setUsername: () => {},
  avatar: "",
  setAvatar: () => {},
  tagline: "",
  setTagline: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [tagline, setTagline] = useState("");

  return (
    <UserContext.Provider
      value={{ userId, setUserId, username, setUsername, avatar, setAvatar, tagline, setTagline }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);