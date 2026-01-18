/**
 * Centralized date and time utilities
 *
 * This module provides consistent date formatting across the application.
 * Uses native Date API to keep the bundle minimal (no date-fns dependency).
 */

/**
 * Converts various date types to Date object
 */
const toDate = (date: Date | string): Date => {
  return date instanceof Date ? date : new Date(date);
};

/**
 * Format date as full date (e.g., "Jan 15, 2025")
 */
export const formatFullDate = (date: Date | string): string => {
  return toDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Format date as short date (e.g., "Jan 15")
 */
export const formatShortDate = (date: Date | string): string => {
  return toDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

/**
 * Format date with time (e.g., "Jan 15, 02:30 PM")
 */
export const formatDateTime = (date: Date | string): string => {
  return toDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Format time only (e.g., "02:30 PM")
 */
export const formatTime = (date: Date | string): string => {
  return toDate(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Calculate days since a date (always positive)
 * This function uses the current date at function call time,
 * making it safe to use in server components.
 */
export const getDaysSince = (date: Date | string): number => {
  const d = toDate(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calculate days until a date
 * Positive = future, Negative = past
 */
export const getDaysUntil = (date: Date | string): number => {
  const d = toDate(date);
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if a date is in the past
 */
export const isPast = (date: Date | string): boolean => {
  return toDate(date) < new Date();
};

/**
 * Format date for HTML date input (YYYY-MM-DD)
 */
export const formatForDateInput = (date: Date | string): string => {
  const d = toDate(date);
  return d.toISOString().split("T")[0];
};
