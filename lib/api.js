import { getSession } from "next-auth/react"

export async function authFetch(url, options = {}) {
  const session = await getSession()

  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.accessToken}`,
      ...options.headers,
    },
  })
}
