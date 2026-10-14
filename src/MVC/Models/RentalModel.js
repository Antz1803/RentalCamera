// Models/RentalModel.js
// Pure data + pure functions only. No React, no state, no side effects.
//
// IMPORTANT: cameras, delivery choices, meet-up locations, and highlight
// photos are all controlled live from Firebase (editable from the MAUI
// staff app) and flow in from RentalController.js as plain data. There
// are no local defaults/fallbacks — the UI simply renders empty until
// Firebase's first snapshot arrives.
// Every function that used to reach into a static CAMERAS array now
// takes a `cameras` array as its first argument instead.

// Every known delivery choice, in the order they should display when
// enabled. Whether each one is actually offered right now is controlled
// live via Firebase's settings/deliveryChoices node (see
// RentalController.js) — this array is just the fixed set of choices the
// UI knows how to render, not the live enabled/disabled state.
export const ALL_DELIVERY_CHOICES = ["Pick-Up", "Meet-Up", "Maxim"];

// Pick-up times customers can choose from (24h "HH:mm"), hourly 8 AM – 8 PM.
export const PICKUP_TIME_OPTIONS = Array.from({ length: 13 }, (_, i) =>
  `${String(i + 8).padStart(2, "0")}:00`
);
export const DEFAULT_PICKUP_TIME = "09:00";

/**
 * Look up the security deposit for a camera by name, from a given live
 * cameras array. Shown to customers for transparency — this is separate
 * from the rental price and is not included in calculateRentalPrice.
 * Defaults to 0 if not found or not set.
 */
export function getCameraDeposit(cameras, cameraName) {
  const camera = cameras.find((c) => c.name === cameraName);
  return camera ? camera.deposit : 0;
}

/**
 * Returns true if the given YYYY-MM-DD date is before today.
 */
export function isPastDate(dateKey) {
  const selectedDate = fromKey(dateKey);

  // Reset selected date time
  selectedDate.setHours(0, 0, 0, 0);

  // Today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return selectedDate < today;
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const COLORS = {
  bg: "#F6EEDA",
  card: "#FDFBF3",
  ink: "#2E2B22",
  inkMuted: "#7A7461",
  border: "#DED4B4",
  borderSoft: "#E9E0C6",
  sage: "#A9C2A0",
  sageDark: "#7FA075",
  sageText: "#3C4E36",
  mustard: "#C9A536",
  mustardDark: "#AD8B27",
  mustardText: "#4A3B10",
  lavender: "#E5E2ED",
  lavenderText: "#4F4B63",
  orange: "#F2B15C",
  orangeDark: "#D98A2B",
  orangeText: "#5B3A12",
  olive: "#3D4A2A",
  oliveDark: "#2E3620",
};

/**
 * Format a y/m/d triple (month is 0-indexed, JS Date style) into the
 * canonical "YYYY-MM-DD" key used to identify calendar days everywhere
 * in this app (bookings, selection state, lookups).
 */
export function toKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

/**
 * Parse a "YYYY-MM-DD" key back into a local Date object.
 * Inverse of `toKey`.
 */
export function fromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Normalize a date key like "2026-10-3" into the canonical "2026-10-03".
 * Bookings written by other apps may not be zero-padded, which breaks
 * string comparisons. Returns the input unchanged if it can't be parsed.
 */
export function normalizeKey(key) {
  if (!key) return key;
  const [y, m, d] = String(key).split("-").map(Number);
  if (!y || !m || !d) return key;
  return toKey(y, m - 1, d);
}

/**
 * Turn a "YYYY-MM-DD" key into a human-readable date, e.g. "15 Aug 2024".
 * Returns an em dash placeholder when no key is provided.
 */
export function formatDisplayDate(key) {
  if (!key) return "—";
  return fromKey(key).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** "14:00" -> "2:00 PM" */
export function formatTime(time) {
  if (!time) return "—";
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/**
 * Build the calendar grid cells for a given month/year.
 * Returns an array of day numbers (1..daysInMonth), padded with `null`
 * for the leading/trailing empty cells so the grid always divides evenly
 * into rows of 7 (one per weekday).
 */
export function buildMonthGrid(year, month) {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * Number of 24-hour rental periods between pick-up date and return date.
 * Oct 14 -> Oct 15 = 1 day (24 hrs), Oct 14 -> Oct 17 = 3 days.
 * Same-day (0) or invalid ranges return 0.
 */
export function countDays(startKey, endKey) {
  if (!startKey || !endKey) return 0;
  const diff = Math.round(
    (fromKey(endKey) - fromKey(startKey)) / (1000 * 60 * 60 * 24)
  );
  return diff > 0 ? diff : 0;
}

/** Pick-up / return summary for display. Return time = pick-up time. */
export function getReturnSchedule(startKey, endKey, pickupTime) {
  if (!startKey || !endKey || !pickupTime) return null;
  return {
    pickupDate: formatDisplayDate(startKey),
    returnDate: formatDisplayDate(endKey),
    time: formatTime(pickupTime),
  };
}

/**
 * Look up the first-day rental price for a camera by name, from a given
 * live cameras array (pass `c.cameras` from the controller). Defaults
 * to 0 if not found.
 */
export function getCameraPrice(cameras, cameraName) {
  const camera = cameras.find((c) => c.name === cameraName);
  return camera ? camera.price : 0;
}

/**
 * Look up the short display name for a camera (e.g. "Sony A7IV" instead
 * of "Sony A7IV w/ 24-70 GM"), from a given live cameras array. Falls
 * back to the full name if no shortName is set.
 */
export function getCameraShortName(cameras, cameraName) {
  const camera = cameras.find((c) => c.name === cameraName);
  return camera?.shortName || cameraName;
}

/**
 * The discounted per-day rate for a specific camera (from a given live
 * cameras array), used for every 24-hour period once a booking reaches
 * 3+ days. Scales with that camera's own base price (base price - 50,
 * floored at 0) rather than a flat rate shared across every camera.
 */
export function getDiscountedDayPrice(cameras, cameraName) {
  const basePrice = getCameraPrice(cameras, cameraName);
  return Math.max(basePrice - 50, 0);
}

/**
 * Calculate the total rental cost for a camera (from a given live
 * cameras array) over a number of 24-hour days.
 *
 * This is an all-or-nothing threshold, not a tiered/additive discount:
 *   - 1–2 days: every day is billed at the camera's full base price.
 *   - 3+ days: every day (including days 1 and 2) is billed at that
 *     camera's discounted rate instead.
 *
 * e.g. Sony A7IV (base ₱550, discounted ₱500):
 *   2 days → ₱550 + ₱550 = ₱1,100
 *   3 days → ₱500 × 3   = ₱1,500
 */
export function calculateRentalPrice(cameras, cameraName, days) {
  if (!days || days <= 0) return 0;

  if (days <= 2) {
    return getCameraPrice(cameras, cameraName) * days;
  }

  return getDiscountedDayPrice(cameras, cameraName) * days;
}

/**
 * Validate the main booking form.
 * Returns an array of human-readable labels for any required field that
 * is missing/empty; an empty array means the form is valid.
 */
export function validateBooking({
  fullName,
  contact,
  rangeStart,
  rangeEnd,
  camera,
  deliveryAddress,
  pickupTime,
  todayKey,
}) {
  const missing = [];
  if (!fullName || !fullName.trim()) missing.push("Full name");
  if (!contact || !contact.trim()) missing.push("Contact number");

  if (!rangeStart || !rangeEnd) {
    missing.push("Pick-up and return dates");
  } else if (countDays(rangeStart, rangeEnd) < 1) {
    missing.push("Return date (at least 24 hrs after pick-up)");
  }

  if (!pickupTime) {
    missing.push("Pick-up time");
  } else if (rangeStart && rangeStart === todayKey) {
    const now = new Date();
    const [h, m] = pickupTime.split(":").map(Number);
    if (h * 60 + m <= now.getHours() * 60 + now.getMinutes()) {
      missing.push("Pick-up time (already passed today)");
    }
  }

  if (!camera) missing.push("Camera selection");
  if (!deliveryAddress || !deliveryAddress.trim())
    missing.push("Delivery/meet-up address");
  return missing;
}

/**
 * Validate the InstaPay proof-of-payment step (only required when the
 * customer chooses "Digital Payment").
 * Returns an array of missing-field labels, empty when valid.
 */
export function validatePaymentProof({ referenceNo, uploadedPhotoUrl }) {
  const missing = [];
  if (!referenceNo || !referenceNo.trim()) missing.push("Reference No.");
  if (!uploadedPhotoUrl) missing.push("Proof-of-payment photo");
  return missing;
}