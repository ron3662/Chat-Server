import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type UserContextType = {
  userId: string;
  setUserId: (id: string) => void;
  username: string;
  setUsername: (name: string) => void;
  avatar: string;
  setAvatar: (url: string) => void;
  tagline: string;
  setTagline: (text: string) => void;

  saveUser: (user: any) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
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
  saveUser: async () => {},
  logout: async () => {},
  loading: true,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [tagline, setTagline] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ LOAD USER ON APP START
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const data = await SecureStore.getItemAsync("user");
    if (data) {
      const user = JSON.parse(data);
      setUserId(user.userId);
      setUsername(user.username);
      setAvatar(user.avatar);
      setTagline(user.tagline);
    }

    setLoading(false); // ✅ important
  };

  // ✅ SAVE USER
const saveUser = async (user: any) => {
  setUserId(user.userId);
  setUsername(user.username);
  setAvatar(user.avatar);
  setTagline(user.tagline);

  await SecureStore.setItemAsync("user", JSON.stringify(user));
};

  // ✅ LOGOUT
  const logout = async () => {
    await SecureStore.deleteItemAsync("user");
    setUserId("");
    setUsername("");
    setAvatar("");
    setTagline("");
  };

  return (
    <UserContext.Provider
      value={{ userId, setUserId, username, setUsername, avatar, setAvatar, tagline, setTagline, saveUser, logout, loading, }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);