import { Platform } from 'react-native';
import { router } from 'expo-router';
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "@/utils/tokenStorage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error("EXPO_PUBLIC_API_URL is missing. Configure it in your .env files.");
}

interface FetchOptions extends RequestInit {
  timeout?: number;
  params?: Record<string, string>;
}

const GET_COOLDOWN_MS = 1200;
const pendingRequests = new Map<string, Promise<{ data: any } | null>>();
const getRequestLastCall = new Map<string, number>();
let isRedirectingToLogin = false;

const buildRequestKey = (
  endpoint: string,
  method: string,
  params?: Record<string, string>,
) => {
  const normalizedParams = params
    ? Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${value}`)
        .join("|")
    : "";

  return `${method.toUpperCase()}:${endpoint}?${normalizedParams}`;
};

const shouldAbortByCooldown = (requestKey: string, method: string) => {
  if (method.toUpperCase() !== "GET") {
    return false;
  }

  const now = Date.now();
  const previousCall = getRequestLastCall.get(requestKey) || 0;
  if (now - previousCall < GET_COOLDOWN_MS) {
    return true;
  }

  getRequestLastCall.set(requestKey, now);
  return false;
};

const shouldSkipForMissingToken = (token: string | null, endpoint: string) =>
  !token &&
  !endpoint.includes('/login') &&
  !endpoint.includes('/signup') &&
  !endpoint.includes('/register');

const PUBLIC_ENDPOINTS = new Set([
  '/login',
  '/register',
  '/activation',
  '/resend-activation',
  '/forgot-password',
  '/verify-forgot-password-otp',
  '/reset-password',
  '/refresh-token',
]);

const isPublicEndpoint = (endpoint: string) => {
  const path = endpoint.split('?')[0];
  return PUBLIC_ENDPOINTS.has(path);
};

const redirectToLogin = async () => {
  if (isRedirectingToLogin) return;
  isRedirectingToLogin = true;
  await clearAuthTokens();
  try {
    router.replace('/login');
  } catch {
    // Ignore navigation failures before the root navigator mounts.
  } finally {
    setTimeout(() => {
      isRedirectingToLogin = false;
    }, 500);
  }
};

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
    credentials: Platform.OS === 'web' ? 'include' : rest.credentials,
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
    const refreshToken = await getRefreshToken();
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
    await setAuthTokens(accessToken, newRefreshToken || refreshToken);

    const newHeaders = { ...config.headers, Authorization: `Bearer ${accessToken}` };
    return fetch(url, { ...config, headers: newHeaders });
  } catch (refreshError) {
    console.error("Token refresh failed:", refreshError);
    await clearAuthTokens();
    return null;
  }
};

const refreshAccessToken = async () => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const refreshResponse = await fetch(`${BASE_URL}/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!refreshResponse.ok) return null;

  const data = await parseResponseData(refreshResponse);
  if (!data?.success || !data?.data?.accessToken) return null;

  await setAuthTokens(data.data.accessToken, data.data.refreshToken || refreshToken);
  return data.data.accessToken as string;
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

const resolveRequestToken = async (endpoint: string, isPublic: boolean) => {
  let token = await getAccessToken();

  if (shouldSkipForMissingToken(token, endpoint)) {
    return { skip: true as const, token: null as string | null };
  }

  if (!token && !isPublic) {
    token = await refreshAccessToken();
    if (!token) {
      await redirectToLogin();
      throw createApiError('Access token required. Redirecting to login.', 401);
    }
  }

  return { skip: false as const, token };
};

const fetchWithRetryOn401 = async (
  url: string,
  config: RequestInit & { headers: HeadersInit & Record<string, string> },
  isPublic: boolean,
) => {
  let response = await fetch(url, config);
  if (response.status === 401 && !isPublic) {
    const retriedResponse = await refreshExpiredRequest(url, config);
    if (retriedResponse) {
      response = retriedResponse;
    } else {
      await redirectToLogin();
    }
  }

  return response;
};

// Custom Fetch Wrapper
const customFetch = async (endpoint: string, options: FetchOptions = {}) => {
  const { timeout = 30000, params, headers, ...rest } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const method = String(rest.method || 'GET').toUpperCase();
  const requestKey = buildRequestKey(endpoint, method, params);

  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey) ?? null;
  }

  if (shouldAbortByCooldown(requestKey, method)) {
    clearTimeout(id);
    return null;
  }

  const requestPromise = (async () => {
    try {
      const isPublic = isPublicEndpoint(endpoint);
      const { skip, token } = await resolveRequestToken(endpoint, isPublic);
      if (skip) {
        return null;
      }

      const url = appendQueryParams(endpoint, params);
      const config = buildRequestConfig(rest, headers, controller.signal, token);

      const response = await fetchWithRetryOn401(url, config, isPublic);

      const data = await parseResponseData(response);

      if (!data.success && response.ok) {
        data.success = true;
      }

      if (!response.ok) {
        throw normalizeError(data, response.status);
      }

      return { data: data };
    } catch (error: any) {
      console.error('API Request Error:', error);
      throw error;
    } finally {
      pendingRequests.delete(requestKey);
      clearTimeout(id);
    }
  })();

  pendingRequests.set(requestKey, requestPromise);
  return requestPromise;
};

const AUTH_GUARD_RESPONSE = {
  data: {
    success: false,
    message: 'Authentication required',
    skipped: true,
  },
};

const ensureResponseEnvelope = (response: { data: any } | null) => response ?? AUTH_GUARD_RESPONSE;

// Compatible API object
const api = {
    get: async (url: string, config?: any) =>
      ensureResponseEnvelope(await customFetch(url, { ...config, method: 'GET' })),
    post: async (url: string, data?: any, config?: any) =>
      ensureResponseEnvelope(
        await customFetch(url, {
          ...config,
          method: 'POST',
          body: data instanceof FormData ? data : JSON.stringify(data),
        }),
      ),
    put: async (url: string, data?: any, config?: any) =>
      ensureResponseEnvelope(
        await customFetch(url, { ...config, method: 'PUT', body: JSON.stringify(data) }),
      ),
    delete: async (url: string, config?: any) =>
      ensureResponseEnvelope(await customFetch(url, { ...config, method: 'DELETE' })),
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

  updateItem: async (id: string, item: any) => {
    try {
      const response = await api.put(`/updateitem/${id}`, item);
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
      const response = await api.put(`/updatebox`, {
        id,
        ...update,
      });
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

      const ensuredResponse = ensureResponseEnvelope(response);
      return ensuredResponse.data;
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
  },

  changePassword: async (payload: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => {
    try {
      const response = await api.post('/change-password', payload);
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
