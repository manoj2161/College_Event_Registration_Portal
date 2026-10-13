import axios from "axios";
import { API_URL } from "../config.js";

const client = axios.create({ baseURL: API_URL, withCredentials: true, timeout: 20000 });
let accessToken = "";
let refreshPromise = null;

export function setAccessToken(token) {
  accessToken = token || "";
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true, timeout: 20000 })
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

client.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

function errorMessage(error) {
  return error.response?.data?.message || error.response?.data?.error || error.message || "Request failed. Please try again.";
}

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
    if (status === 401 && canRefresh && !path.startsWith("/auth/")) {
      try {
        await refreshAccessToken();
        return apiRequest(path, options, false);
      } catch {
        setAccessToken("");
      }
    }
    throw new Error(errorMessage(error));
  }
}

export async function refreshSession() {
  try {
    const response = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true, timeout: 20000 });
    setAccessToken(response.data.accessToken);
    return response.data;
  } catch {
    setAccessToken("");
    return null;
  }
}

