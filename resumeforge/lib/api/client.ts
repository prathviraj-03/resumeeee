import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from "axios";
import Cookies from "js-cookie";
import { config, API_ENDPOINTS } from "@/lib/config";

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export function getAccessToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(config.tokenKey);
  }
  return null;
}

function getRefreshToken(): string | null {
  return Cookies.get(config.refreshTokenKey) || null;
}

export function setTokens(accessToken: string, refreshToken?: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(config.tokenKey, accessToken);
  }
  if (refreshToken) {
    Cookies.set(config.refreshTokenKey, refreshToken, {
      expires: 7,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  }
}

export function clearTokens() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(config.tokenKey);
    localStorage.removeItem(config.tokenExpiryKey);
  }
  Cookies.remove(config.refreshTokenKey);
}

const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 120000, // AI endpoints can be slow
});


// ── Request interceptor: attach JWT Bearer token ───────────────────────────
apiClient.interceptors.request.use(
  (req) => {
    const token = getAccessToken();
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 / 403 with token refresh ─────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    // 401 = token missing/malformed  |  403 = expired/invalid signature
    const status = error.response?.status;
    if ((status === 401 || status === 403) && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            if (original.headers) original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      const rt = getRefreshToken();
      if (!rt) {
        isRefreshing = false;
        clearTokens();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          `${config.apiBaseUrl}${API_ENDPOINTS.auth.refresh}`,
          { refreshToken: rt }
        );
        const { accessToken, refreshToken } = res.data;
        setTokens(accessToken, refreshToken);
        onTokenRefreshed(accessToken);
        isRefreshing = false;
        if (original.headers) original.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(original);
      } catch {
        isRefreshing = false;
        clearTokens();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    // 429 – rate limit: surface a clear message
    if (status === 429) {
      const augmented = error as AxiosError & { isRateLimit: boolean };
      augmented.isRateLimit = true;
    }

    return Promise.reject(error);
  }
);

export default apiClient;
