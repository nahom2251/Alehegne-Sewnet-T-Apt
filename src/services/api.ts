import { Apartment, Bill, UserProfile } from "../types";

const API_BASE = "/api";

async function request(url: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: "include", // ✅ send cookies
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await res.text();

  if (!text) {
    throw new Error("Empty response from server");
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error("Invalid JSON response:", text);
    throw new Error("Server returned invalid response");
  }

  if (!res.ok) {
    throw new Error(data.error || "An error occurred");
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials: any) =>
      request("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),

    register: (data: any) =>
      request("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    logout: () =>
      request("/auth/logout", { method: "POST" }),

    me: () => request("/auth/me"),
  },

  users: {
    list: () => request("/users"),
    update: (id: string, data: Partial<UserProfile>) =>
      request(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  apartments: {
    list: () => request("/apartments"),
    create: (data: Partial<Apartment>) =>
      request("/apartments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Apartment>) =>
      request(`/apartments/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  bills: {
    list: () => request("/bills"),
    create: (data: Partial<Bill>) =>
      request("/bills", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Bill>) =>
      request(`/bills/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/bills/${id}`, {
        method: "DELETE",
      }),
  },
};