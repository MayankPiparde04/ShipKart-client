import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from 'react-native';

// Determine base URL dynamically or from environment
// Since you are using an Android Studio AVD (Pixel_8_Pro), 10.0.2.2 is the required loopback alias.
const fallbackUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

// CRITICAL SECURITY FIX: Never use local fallbacks if the app is bundled for production execution.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? fallbackUrl : '');

if (!BASE_URL && !__DEV__) {
  console.error("CRITICAL ERROR: EXPO_PUBLIC_API_URL is entirely missing in a production application build.");
}

interface FetchOptions extends RequestInit {
  timeout?: number;
  params?: Record<string, string>;
}

const createApiError = (message: string, status?: number, data?: any) => {
  const error = new Error(message) as Error & { status?: number; data?: any };
  error.status = status;
  error.data = data;
  return error;
};

const appendQueryParams = (endpoint: string, params?: Record<string, string>) => {
  if (!params) return `${BASE_URL}${endpoint}`;

  const searchParams = new URLSearchParams(params);
  return `${BASE_URL}${endpoint}?${searchParams.toString()}`;
};

const buildRequestConfig = (
  rest: RequestInit,
  headers: HeadersInit | undefined,
  signal: AbortSignal,
  token: string | null,
) => {
  const mergedHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (headers) {
    Object.assign(mergedHeaders, headers as Record<string, string>);
  }

  const config: RequestInit & { headers: Record<string, string> } = {
    ...rest,
    headers: mergedHeaders,
    signal: rest.signal || signal,
  };

  if (rest.body instanceof FormData) {
    // @ts-ignore
    delete config.headers["Content-Type"];
  }

  return config;
};

const parseResponseData = async (response: Response) =>
  response.json().catch(() => ({}));

const refreshExpiredRequest = async (
  url: string,
  config: RequestInit & { headers: HeadersInit & Record<string, string> },
) => {
  try {
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    if (!refreshToken) return null;

    const refreshResponse = await fetch(`${BASE_URL}/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshResponse.ok) return null;

    const data = await parseResponseData(refreshResponse);
    if (!data.success) return null;

    const { accessToken, refreshToken: newRefreshToken } = data.data;
    await AsyncStorage.setItem("accessToken", accessToken);
    if (newRefreshToken) await AsyncStorage.setItem("refreshToken", newRefreshToken);

    const newHeaders = { ...config.headers, Authorization: `Bearer ${accessToken}` };
    return fetch(url, { ...config, headers: newHeaders });
  } catch (refreshError) {
    console.error("Token refresh failed:", refreshError);
    await AsyncStorage.removeItem("accessToken");
    await AsyncStorage.removeItem("refreshToken");
    return null;
  }
};

const normalizeError = (data: any, status: number) => {
  let extractedMessage = data.message || `HTTP Error ${status}`;

  if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    extractedMessage =
      data.errors
        .map((e: any) => e.msg || e.message)
        .filter(Boolean)
        .join("\n") || extractedMessage;
  }

  return createApiError(extractedMessage, status, data);
};

// Custom Fetch Wrapper
const customFetch = async (endpoint: string, options: FetchOptions = {}) => {
  const { timeout = 30000, params, headers, ...rest } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const token = await AsyncStorage.getItem("accessToken");
    const url = appendQueryParams(endpoint, params);
    const config = buildRequestConfig(rest, headers, controller.signal, token);

    let response = await fetch(url, config);
    if (response.status === 401) {
      const retriedResponse = await refreshExpiredRequest(url, config);
      if (retriedResponse) {
        response = retriedResponse;
      }
    }

    const data = await parseResponseData(response);
    
    if (!data.success && response.ok) {
      data.success = true;
    }
    
    if (!response.ok) {
      throw normalizeError(data, response.status);
    }
    
    return { data: data };

  } catch (error: any) {
    clearTimeout(id);
    console.error('API Request Error:', error);
    throw error;
  }
};

// Compatible API object
const api = {
    get: (url: string, config?: any) => customFetch(url, { ...config, method: 'GET' }),
    post: (url: string, data?: any, config?: any) => customFetch(url, { ...config, method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }),
    put: (url: string, data?: any, config?: any) => customFetch(url, { ...config, method: 'PUT', body: JSON.stringify(data) }),
    delete: (url: string, config?: any) => customFetch(url, { ...config, method: 'DELETE' }),
};

// API Service object to match InventoryContext expectations
export const apiService = {
  getItems: async (params: any) => {
    try {
      const response = await api.get('/getitemdata', { params });
      return response.data;
    } catch (error: any) {
      console.error('getItems error:', error);
      return { success: false, message: error.message };
    }
  },

  addOrUpdateItem: async (item: any) => {
    try {
      const response = await api.post('/senditemdata', item);
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  deleteItem: async (id: string) => {
    try {
      const response = await api.delete(`/deleteitem/${id}`);
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  getBoxes: async (params: any) => {
    try {
      const response = await api.get('/getboxes', { params });
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  addBox: async (box: any) => {
    try {
      const response = await api.post('/addbox', box);
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  updateBoxQuantity: async (box_name: string, additionalQuantity: number) => {
    try {
      const response = await api.post('/updateboxquantity', { box_name, additionalQuantity });
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  deleteBox: async (id: string) => {
    try {
      const response = await api.delete(`/deletebox/${id}`);
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  updateBox: async (id: string, update: any) => {
    try {
      const response = await api.put(`/updatebox`, update);
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  removeBoxItem: async (data: any) => {
    try {
      const response = await api.post('/removeboxitem', data);
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  packInventory: async (data: {
    productId: string;
    packedQty: number;
    cartonsUsed: any[];
    packingMetadata?: Record<string, any>;
  }) => {
    try {
      const response = await api.post('/inventory/pack', data);
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  getShipmentTransactions: async (limit = 100) => {
    try {
      const response = await api.get("/analytics/transactions", {
        params: { limit: String(limit) },
      });
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.message, data: [] };
    }
  },

  deleteShipmentTransaction: async (id: string) => {
    try {
      const response = await api.delete(`/analytics/transactions/${id}`);
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  requestForgotPasswordOtp: async (email: string) => {
    try {
      const response = await api.post("/forgot-password", { email });
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  verifyForgotPasswordOtp: async (email: string, otp: string) => {
    try {
      const response = await api.post("/verify-forgot-password-otp", {
        email,
        otp,
      });
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  resetPassword: async ({
    email,
    otp,
    newPassword,
  }: {
    email: string;
    otp: string;
    newPassword: string;
  }) => {
    try {
      const response = await api.post("/reset-password", {
        email,
        otp,
        newPassword,
      });
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  optimalPacking2: async (products: any) => {
    try {
      const response = await api.post('/optimal-packing2', { products });
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  },

  predictDimensionsWithDetails: async (
    imageUri: string,
    referenceObject: string,
    unit: string,
    additionalContext: string,
    signal?: AbortSignal
  ) => {
    try {
      const formData = new FormData();
      
      // Append image
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      // @ts-ignore - React Native FormData expects specific structure
      formData.append('image', { uri: imageUri, name: filename, type });
      
      formData.append('referenceObject', referenceObject);
      formData.append('unit', unit);
      if (additionalContext) formData.append('additionalContext', additionalContext);

      // Special handling for multipart form data in fetch
      // We do NOT set Content-Type header manually for FormData, let fetch handle the boundary
      const response = await customFetch('/ai/predict-dimensions', {
        method: 'POST',
        body: formData,
        timeout: 120000, 
        signal: signal,
      });
      
      return response.data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Prediction cancelled by user');
      }
      console.error('Prediction error:', error.message);
      throw createApiError(error.message, error.status, error.data);
    }
  },
  
  // Auth methods
  login: async (credentials: any) => {
    const response = await api.post('/login', credentials);
    return response.data;
  },
  
  register: async (userData: any) => {
    const response = await api.post('/register', userData);
    return response.data;
  },

  updateUserProfile: async (updateData: any) => {
    try {
      const response = await api.put('/user/update', updateData);
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
};

export const endpoints = {
  auth: { login: '/login', register: '/register', refreshToken: '/refresh-token' },
  ai: { predictDimensions: '/ai/predict-dimensions', history: '/ai/prediction-history' },
  packing: { optimal: '/optimal-packing2', enhanced: '/enhanced-packing' },
  inventory: { items: '/items', boxes: '/boxes' }
};

export default api;
