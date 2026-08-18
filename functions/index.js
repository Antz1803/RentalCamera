const { onValueCreated } = require("firebase-functions/v2/database");
const { defineSecret, defineString } = require("firebase-functions/params");
const { logger } = require("firebase-functions");

const textbeeApiKey = defineSecret("TEXTBEE_API_KEY");
const textbeeDeviceId = defineString("TEXTBEE_DEVICE_ID", {
  default: "6a83c7043005599046573f02",
});

const SMS_MESSAGE =
  "J & M Rental Hub: Thank you for renting our camera! Reservation received. " +
  "Please wait for confirmation. Download your website receipt as proof.";

/**
 * Converts common Philippine mobile formats to E.164 format for TextBee.
 * Examples: 09171234567, +639171234567, and 639171234567 -> +639171234567.
 */
function normalizePhilippineNumber(value) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (/^09\d{9}$/.test(digits)) return `+63${digits.slice(1)}`;
  if (/^639\d{9}$/.test(digits)) return `+${digits}`;
  return null;
}

exports.sendBookingSms = onValueCreated(
  {
    ref: "/bookings/{bookingId}",
    instance: "rental-camera-aa424-default-rtdb",
    region: "asia-southeast1",
    secrets: [textbeeApiKey],
  },
  async (event) => {
    const booking = event.data.val();
    const number = normalizePhilippineNumber(booking?.contact);

    if (!number) {
      logger.warn("Booking has no valid Philippine mobile number", {
        bookingId: event.params.bookingId,
      });
      return;
    }

    const response = await fetch(
      `https://api.textbee.dev/api/v1/gateway/devices/${textbeeDeviceId.value()}/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": textbeeApiKey.value(),
        },
        body: JSON.stringify({
          recipients: [number],
          message: SMS_MESSAGE,
        }),
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      logger.error("TextBee rejected booking SMS", {
        bookingId: event.params.bookingId,
        status: response.status,
        response: responseText,
      });
      throw new Error(`TextBee SMS request failed with ${response.status}`);
    }

    logger.info("Booking SMS queued", {
      bookingId: event.params.bookingId,
      number,
      response: responseText,
    });
  }
);
