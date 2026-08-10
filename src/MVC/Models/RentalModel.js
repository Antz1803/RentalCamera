// Models/RentalModel.js
// Pure data + pure functions only. No React, no state, no side effects.
//
// IMPORTANT: cameras, delivery choices, and meet-up locations are
// controlled live from Firebase (editable from the MAUI staff app) and
// flow in from RentalController.js as plain data. There are no local
// defaults/fallbacks — the UI simply renders empty until Firebase's
// first snapshot arrives.
// Every function that used to reach into a static CAMERAS array now
// takes a `cameras` array as its first argument instead.

import SamplePhoto1 from "../../Images/Devfest2022.jpg";

// Every known delivery choice, in the order they should display when
// enabled. Whether each one is actually offered right now is controlled
// live via Firebase's settings/deliveryChoices node (see
// RentalController.js) — this array is just the fixed set of choices the
// UI knows how to render, not the live enabled/disabled state.
export const ALL_DELIVERY_CHOICES = ["Pick-Up", "Meet-Up", "Maxim"];

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

// Gallery of sample photos captured using camera equipment
export const CAPTURED_PHOTOS = [
  {
    id: 1,
    title: "Portrait Narrow Hallway",
    cameraModel: "Sony A7IV",
    lens: "24-70mm f/2.8 GM II",
    settings: "f/2.8 • 1/500s • ISO 100",
    photographer: "@ Minervs",
    imageUrl: SamplePhoto1,
    tag: "Captured with Canon R5",
  },
  {
    id: 2,
    title: "Golden Hour Street Frame",
    cameraModel: "Canon EOS R5",
    lens: "RF 50mm f/1.2 L USM",
    settings: "f/1.2 • 1/1250s • ISO 200",
    photographer: "@lens_and_light",
    imageUrl:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80",
    tag: "Captured with Canon R5",
  },
  {
    id: 3,
    title: "Low-Light Night Scene",
    cameraModel: "Sony A7IV",
    lens: "35mm f/1.4 GM",
    settings: "f/1.4 • 1/160s • ISO 1600",
    photographer: "@night_frames",
    imageUrl:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
    tag: "Low Light Highlight",
  },
  {
    id: 4,
    title: "Film Simulation Profile",
    cameraModel: "Fujifilm X-T5",
    lens: "XF 16-55mm f/2.8",
    settings: "f/4.0 • 1/800s • ISO 400",
    photographer: "@fuji_vibes",
    imageUrl:
      "https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?auto=format&fit=crop&w=800&q=80",
    tag: "Fujifilm Color Test",
  },
];


export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Maximum number of active (Pending/Approved) reservations allowed per
// camera per day — a flat daily cap, independent of how many physical
// units of that camera you actually own.
export const MAX_BOOKINGS_PER_DAY = 15;

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
 * Count the inclusive number of days between two "YYYY-MM-DD" keys.
 * Returns 0 if either key is missing or the range is invalid (end before start).
 */
export function countDays(startKey, endKey) {
  if (!startKey || !endKey) return 0;
  const diff = (fromKey(endKey) - fromKey(startKey)) / (1000 * 60 * 60 * 24);
  return diff >= 0 ? diff + 1 : 0;
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
 * cameras array), used for every rental day once a booking reaches 3+
 * days. Scales with that camera's own base price (base price - 100,
 * floored at 0) rather than a flat rate shared across every camera.
 */
export function getDiscountedDayPrice(cameras, cameraName) {
  const basePrice = getCameraPrice(cameras, cameraName);
  return Math.max(basePrice - 100, 0);
}

/**
 * Calculate the total rental cost for a camera (from a given live
 * cameras array) over a number of days.
 *
 * This is an all-or-nothing threshold, not a tiered/additive discount:
 *   - 1–2 days: every day is billed at the camera's full base price.
 *   - 3+ days: every day (including days 1 and 2) is billed at that
 *     camera's discounted rate instead — reaching the 3-day threshold
 *     drops the rate for the whole booking, not just the extra days.
 *
 * e.g. Sony A7IV (base ₱550, discounted ₱450):
 *   2 days → ₱550 + ₱550 = ₱1,100
 *   3 days → ₱450 × 3   = ₱1,350
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
}) {
  const missing = [];
  if (!fullName || !fullName.trim()) missing.push("Full name");
  if (!contact || !contact.trim()) missing.push("Contact number");
  if (!rangeStart || !rangeEnd) missing.push("Rental date range");
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