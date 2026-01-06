import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
export const generateCustomSlug = (title, mongoId) => {
  const part1 = title.replace(/\s+/g, '').substring(0, 4).toLowerCase();
  const part2 = String(mongoId).substring(String(mongoId).length - 4);
  const part3 = Math.random().toString(36).replace(/[^a-z]+/g, '').substring(0, 4);
  return `${part1}${part2}${part3}`;
};

export const isAllowedUser = (email) => {
  const allowedEmails = process.env.ALLOWED_EMAILS?.split(",") || [];
  return allowedEmails.includes(email);
};