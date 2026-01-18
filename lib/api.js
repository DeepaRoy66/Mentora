import { getSession } from "next-auth/react";

export async function authFetch(url, options = {}) {
  const session = await getSession();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    ...options,
    headers,
  });
}

export async function authFetchWithFormData(url, formData, options = {}) {
  const session = await getSession();

  const headers = {
    ...options.headers,
  };

  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    ...options,
    method: options.method || "POST",
    headers,
    body: formData,
  });
}
