// Models/RentalModel.js
// Pure data + pure functions only. No React, no state, no side effects.

export const CAMERAS = [
  {
    name: "Sony A7IV w/ 24-70 GM",
    price: 550,
  },
  {
    name: "Canon R5 w/ 50mm f/1.2",
    price: 650,
  },
  {
    name: "Canon R6 w/ 24-105mm",
    price: 500,
  },
  {
    name: "Sony A7IV kit",
    price: 450,
  },
];

export const DELIVERY_CHOICES = ["Pick-Up", "Meet-Up", "Maxim"];

// fixed address used to fill the field when "Pick-Up" is chosen
export const STORE_LOCATION =
  "Lens & Shutter Rentals Studio, Cebu IT Park, Cebu City, 6000 Cebu";

export const MEETUPS = [
  "City Mall, 7VXV+7QR, Natalio B. Bacalso Ave, Cebu City, 6000 Cebu",
  "Emall, Natalio B. Bacalso Ave, Cebu City, 6000 Cebu",
  "Ayala Center Cebu, Cebu City, 6000 Cebu",
  "Ayala Central Bloc, 8WJ4+8VM, W Geonzon St, Cebu City, 6000 Cebu",
  "Robinsons Galleria Cebu, Gen. Maxilom Avenue Extension, Sergio Osmeña Jr Blvd, Cebu City, 6000 Cebu",
  "ParkMall, CSSEAZ, 168 Ouano Ave, Mandaue, 6014 Cebu",
  "Fuente Osmeña Cir, Cebu City, 6000 Cebu",
  "Plaza Independencia, 7WV4+73C, CSCR Tunl, Cebu City, 6000 Cebu",
];

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
  olive: "#3D4A2A",
  oliveDark: "#2E3620",
};

/** Format y/m/d (m is 0-indexed) into "YYYY-MM-DD" */
export function toKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )}`;
}

/** Parse "YYYY-MM-DD" into a local Date */
export function fromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Human readable date, e.g. "15 Aug 2024" */
export function formatDisplayDate(key) {
  if (!key) return "—";
  return fromKey(key).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Build the 6x7 (or fewer trailing rows) calendar grid for a given month.
 *  Returns an array of day numbers or null for empty leading/trailing cells. */
export function buildMonthGrid(year, month) {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Inclusive day count between two "YYYY-MM-DD" keys */
export function countDays(startKey, endKey) {
  if (!startKey || !endKey) return 0;
  const diff = (fromKey(endKey) - fromKey(startKey)) / (1000 * 60 * 60 * 24);
  return diff >= 0 ? diff + 1 : 0;
}
export function getCameraPrice(cameraName) {
  const camera = CAMERAS.find((c) => c.name === cameraName);
  return camera ? camera.price : 0;
}

export function calculateRentalPrice(cameraName, days) {
  const basePrice = getCameraPrice(cameraName);

  if (!days || days <= 0) return 0;

  const additionalDayPrice = basePrice - 100;

  return basePrice + (days - 1) * additionalDayPrice;
}

export function getAdditionalDayPrice(cameraName) {
  const basePrice = getCameraPrice(cameraName);
  return Math.max(basePrice - 100, 0);
}

/** Validate a booking form. Returns an array of missing-field labels. */
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

/** Validate the InstaPay proof-of-payment step. */
export function validatePaymentProof({ referenceNo, uploadedPhotoUrl }) {
  const missing = [];
  if (!referenceNo || !referenceNo.trim()) missing.push("Reference No.");
  if (!uploadedPhotoUrl) missing.push("Proof-of-payment photo");
  return missing;
}