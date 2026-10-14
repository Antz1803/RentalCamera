import "dotenv/config";
import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const requiredEnvironment = [
  "FIREBASE_DATABASE_URL",
  "TEXTBEE_DEVICE_ID",
  "TEXTBEE_API_KEY",
];

for (const name of requiredEnvironment) {
  if (!process.env[name] || process.env[name].startsWith("replace_with_")) {
    throw new Error(`Missing ${name}. Copy .env.example to .env and fill it in.`);
  }
}

const databaseUrl = process.env.FIREBASE_DATABASE_URL.replace(/\/$/, "");
const stateFile = path.join(process.cwd(), "sent-bookings.json");

const SMS_MESSAGE =
  "J & M Rental Hub: Thank you for renting our camera! Reservation received. " +
  "Please wait for confirmation. Download your website receipt as proof.";

async function curlRequest(url, options = {}) {
  const args = [
    "--silent",
    "--show-error",
    "-4",
    "--max-time",
    "15",
    "-X",
    options.method || "GET",
  ];

  for (const [name, value] of Object.entries(options.headers || {})) {
    args.push("-H", `${name}: ${value}`);
  }
  if (options.body) args.push("--data-raw", options.body);

  args.push("-w", "\n__HTTP_STATUS__:%{http_code}", url);

  let stdout;
  try {
    ({ stdout } = await execFileAsync("curl.exe", args, {
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    }));
  } catch (error) {
    const reason = error.stderr?.trim() || error.code || "unknown curl error";
    throw new Error(`curl transport failed: ${reason}`);
  }
  const marker = "\n__HTTP_STATUS__:";
  const markerIndex = stdout.lastIndexOf(marker);
  if (markerIndex < 0) throw new Error("curl returned no HTTP status");

  return {
    statusCode: Number(stdout.slice(markerIndex + marker.length).trim()),
    body: stdout.slice(0, markerIndex),
  };
}

function loadSentBookings() {
  if (!fs.existsSync(stateFile)) return null;

  try {
    return new Set(JSON.parse(fs.readFileSync(stateFile, "utf8")));
  } catch {
    console.warn("Could not read sent-bookings.json; starting with an empty state.");
    return new Set();
  }
}

function saveSentBookings(sentBookings) {
  fs.writeFileSync(stateFile, JSON.stringify([...sentBookings], null, 2));
}

function normalizePhilippineNumber(value) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (/^09\d{9}$/.test(digits)) return `+63${digits.slice(1)}`;
  if (/^639\d{9}$/.test(digits)) return `+${digits}`;
  return null;
}

async function sendSms(number) {
  const requestBody = JSON.stringify({
    recipients: [number],
    message: SMS_MESSAGE,
  });
  const response = await curlRequest(
    `https://api.textbee.dev/api/v1/gateway/devices/${process.env.TEXTBEE_DEVICE_ID}/send-sms`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
        "x-api-key": process.env.TEXTBEE_API_KEY,
      },
      body: requestBody,
    }
  );

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`TextBee returned ${response.statusCode}: ${response.body}`);
  }

  return response.body;
}

let sentBookings = loadSentBookings();
let initialized = false;
let checking = false;

if (!sentBookings) {
  console.log("First run: existing bookings will be skipped.");
}

async function checkForBookings() {
  if (checking) return;
  checking = true;

  try {
    const response = await curlRequest(`${databaseUrl}/bookings.json`);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`Firebase returned HTTP ${response.statusCode}: ${response.body}`);
    }

    const data = JSON.parse(response.body || "{}") || {};
    const bookings = Object.entries(data);

    // Prevent old bookings from sending SMS when the worker starts for the first time.
    if (!initialized) {
      if (!sentBookings) {
        sentBookings = new Set(bookings.map(([bookingId]) => bookingId));
        saveSentBookings(sentBookings);
      }
      initialized = true;
      console.log("SMS worker is watching for new reservations.");
      return;
    }

    for (const [bookingId, booking] of bookings) {
      if (sentBookings.has(bookingId)) continue;

      const number = normalizePhilippineNumber(booking?.contact);
      if (!number) {
        console.warn(`Skipping ${bookingId}: invalid Philippine contact number.`);
        sentBookings.add(bookingId);
        saveSentBookings(sentBookings);
        continue;
      }

      try {
        const result = await sendSms(number);
        console.log(`SMS queued for ${number} (${bookingId}).`, result);
        sentBookings.add(bookingId);
        saveSentBookings(sentBookings);
      } catch (error) {
        console.error(`SMS failed for booking ${bookingId}:`, error.message);
      }
    }
  } catch (error) {
    console.error("Worker could not read Firebase bookings:", error.message);
  } finally {
    checking = false;
  }
}

console.log("Starting local SMS worker...");
checkForBookings();
setInterval(checkForBookings, 5000);
