import axios from "axios";
import { API_URL } from "../config.js";

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 20000,
});

let accessToken = "";
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token || "";
}

function errorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Request failed. Please try again."
  );
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${API_URL}/auth/refresh`,
        {},
        {
          withCredentials: true,
          timeout: 20000,
        },
      )
      .then(({ data }) => {
        if (!data?.accessToken) {
          throw new Error("The server did not return an access token.");
        }

        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .catch((error) => {
        setAccessToken("");
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export async function apiRequest(path, options = {}, canRefresh = true) {
  const { body, headers = {}, ...rest } = options;

  try {
    const response = await client.request({
      url: path,
      method: rest.method || "GET",
      data: body,
      headers,
      ...rest,
    });

    return response.data;
  } catch (error) {
    const status = error.response?.status;

    // Retry a protected request once after refreshing the access token.
    if (status === 401 && canRefresh && !path.startsWith("/auth/")) {
      try {
        await refreshAccessToken();

        return await apiRequest(path, options, false);
      } catch (refreshError) {
        setAccessToken("");
        throw new Error(errorMessage(refreshError));
      }
    }

    throw new Error(errorMessage(error));
  }
}

export async function refreshSession() {
  try {
    const data = await refreshAccessToken();
    return data ? await getCurrentSession() : null;
  } catch {
    setAccessToken("");
    return null;
  }
}

async function getCurrentSession() {
  try {
    return await apiRequest("/auth/me", {}, false);
  } catch {
    setAccessToken("");
    return null;
  }
}
