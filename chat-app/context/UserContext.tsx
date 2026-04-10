import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type UserContextType = {
  userId: string;
  setUserId: (id: string) => void;
  username: string;
  setUsername: (name: string) => void;
  password: string;
  setPassword: (pwd: string) => void;
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
  password: "",
  setPassword: () => {},
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
  const [password, setPassword] = useState("");

  // ✅ LOAD USER ON APP START
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      // Add timeout to prevent hanging on SecureStore
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve(null), 2000); // 2 second timeout
      });

      const loadPromise = SecureStore.getItemAsync("user");
      const data = await Promise.race([loadPromise, timeoutPromise]);

      if (data) {
        const user = JSON.parse(data as string);
        setUserId(user.userId);
        setUsername(user.username);
        setAvatar(user.avatar);
        setTagline(user.tagline);
        setPassword(user.password);
      }
    } catch (error) {
      console.warn("Error loading user from SecureStore:", error);
    } finally {
      // ✅ CRITICAL: Always set loading to false, even if load fails
      setLoading(false);
    }
  };

  // ✅ SAVE USER
const saveUser = async (user: any) => {
  setUserId(user.userId);
  setUsername(user.username);
  setAvatar(user.avatar);
  setTagline(user.tagline);

  // ✅ only update password if exists
  if (user.password) {
    setPassword(user.password);
  }

  const existing = await SecureStore.getItemAsync("user");
  const existingUser = existing ? JSON.parse(existing) : {};

  const mergedUser = {
    ...existingUser,
    ...user,
  };

  await SecureStore.setItemAsync("user", JSON.stringify(mergedUser));
};

  // ✅ LOGOUT
  const logout = async () => {
    await SecureStore.deleteItemAsync("user");
    setUserId("");
    setUsername("");
    setAvatar("");
    setTagline("");
    setPassword("");
  };

  return (
    <UserContext.Provider
      value={{ userId, setUserId, username, setUsername, avatar, setAvatar, tagline, setTagline, password, setPassword, saveUser, logout, loading }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);