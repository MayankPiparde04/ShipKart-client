import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  lastLogin?: string;
  company?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    deviceInfo?: string,
  ) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuthToken: () => Promise<boolean>;
  updateUserContext: (updateData: {
    name?: string;
    phone?: string;
    company?: string;
    address?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Add this constant before AuthProvider
const DAILY_DATA_STORAGE_KEY = "daily_data";
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://10.23.27.130:5000/api";

// Helper to decode JWT and check expiry
const isTokenExpired = (token: string | null) => {
  if (!token) return true;
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));
    if (!decoded.exp) return true;
    // exp is in seconds
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // const { fetchItems } = useInventory();
  // const { fetchBoxes } = useBoxes();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedAccessToken = await AsyncStorage.getItem("accessToken");
      const storedRefreshToken = await AsyncStorage.getItem("refreshToken");
      const storedUser = await AsyncStorage.getItem("user");

      if (storedAccessToken && storedRefreshToken && storedUser) {
        // Check if access token is expired
        if (isTokenExpired(storedAccessToken)) {
          // Try to refresh
          const refreshed = await refreshAuthToken(storedRefreshToken);
          if (!refreshed) {
            await logout();
            return;
          }
        } else {
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
          setUser(JSON.parse(storedUser));
        }
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const storeAuth = async (
    accessToken: string,
    refreshToken: string,
    user: User,
  ) => {
    try {
      await AsyncStorage.setItem("accessToken", accessToken);
      await AsyncStorage.setItem("refreshToken", refreshToken);
      await AsyncStorage.setItem("user", JSON.stringify(user));
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setUser(user);
    } catch (error) {
      console.error("Error storing auth:", error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const deviceInfo = {
        brand: Device.brand,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        deviceType: Device.deviceType,
        manufacturer: Device.manufacturer,
        designName: Device.designName,
        productName: Device.productName,
        totalMemory: Device.totalMemory,
        // add more fields as needed
      };

      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, deviceInfo }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      await storeAuth(
        data.data.accessToken,
        data.data.refreshToken,
        data.data.user,
      );

      router.replace("/(tabs)");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone: string,
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  // Accept refreshToken as param for startup refresh
  const refreshAuthToken = async (tokenOverride?: string): Promise<boolean> => {
    try {
      const tokenToUse = tokenOverride || refreshToken;
      if (!tokenToUse) return false;

      const response = await fetch(`${API_BASE_URL}/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: tokenToUse }),
      });

      const data = await response.json();

      if (!response.ok) {
        await logout();
        return false;
      }

      setAccessToken(data.data.accessToken);
      setRefreshToken(data.data.refreshToken);
      await AsyncStorage.setItem("accessToken", data.data.accessToken);
      await AsyncStorage.setItem("refreshToken", data.data.refreshToken);
      return true;
    } catch (error) {
      console.error("Token refresh error:", error);
      await logout();
      return false;
    }
  };

  // Wrap authenticated requests to always refresh token if needed
  const authenticatedFetch = async (
    input: RequestInfo,
    init: RequestInit = {},
  ) => {
    if (isTokenExpired(accessToken)) {
      const refreshed = await refreshAuthToken();
      if (!refreshed) throw new Error("Session expired. Please log in again.");
    }
    const token = await AsyncStorage.getItem("accessToken");
    const headers = {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
    };
    return fetch(input, { ...init, headers });
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        "accessToken",
        "refreshToken",
        "user",
        "inventory_items",
        "inventory_items_timestamp",
        "inventory_boxes",
        "inventory_boxes_timestamp",
        DAILY_DATA_STORAGE_KEY,
      ]);
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);

      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateUserContext = async (updateData: {
    name?: string;
    phone?: string;
    company?: string;
    address?: string;
  }) => {
    try {
      // Use authenticatedFetch to ensure fresh token
      const response = await authenticatedFetch(`${API_BASE_URL}/user/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }
      setUser(data.data);
      await AsyncStorage.setItem("user", JSON.stringify(data.data));
      return data;
    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isLoading,
        login,
        register,
        logout,
        refreshAuthToken,
        updateUserContext, // add to context
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
