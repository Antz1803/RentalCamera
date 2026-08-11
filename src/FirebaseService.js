// FirebaseService.js

import { db } from "./firebase";
import { ref, onValue } from "firebase/database";

/**
 * =========================
 * BOOKINGS
 * =========================
 */
export function subscribeBookings(callback) {
  const bookingsRef = ref(db, "bookings");

  return onValue(
    bookingsRef,
    (snapshot) => {
      const data = snapshot.val() || {};

      const bookings = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));

      callback(bookings);
    },
    (error) => {
      console.error("Failed to subscribe to bookings:", error);
      callback([]);
    }
  );
}

/**
 * =========================
 * CAMERAS
 * =========================
 *
 * Firebase:
 *
 * settings
 *   └── cameras
 *       ├── cameraId1
 *       │   ├── name
 *       │   ├── shortName
 *       │   └── price
 */
export function subscribeCameras(callback) {
  const camerasRef = ref(db, "settings/cameras");

  return onValue(
    camerasRef,
    (snapshot) => {
      const data = snapshot.val() || {};

      const cameras = Object.keys(data).map((key) => ({
        id: key,
        name: data[key]?.name || "",
        shortName: data[key]?.shortName || data[key]?.name || "",
        price: Number(data[key]?.price || 0),
        deposit: Number(data[key]?.deposit || 0),
      }));

      callback(cameras);
    },
    (error) => {
      console.error("Failed to subscribe to cameras:", error);
      callback([]);
    }
  );
}

/**
 * =========================
 * DELIVERY CHOICES
 * =========================
 *
 * Firebase:
 *
 * settings
 *   └── deliveryChoices
 *       ├── Pick-Up: true
 *       ├── Meet-Up: true
 *       └── Maxim: true
 */
export function subscribeDeliveryChoices(callback) {
  const deliveryRef = ref(db, "settings/deliveryChoices");

  return onValue(
    deliveryRef,
    (snapshot) => {
      const data = snapshot.val() || {};

      callback(data);
    },
    (error) => {
      console.error(
        "Failed to subscribe to delivery choices:",
        error
      );

      callback({});
    }
  );
}

/**
 * =========================
 * MEET-UP LOCATIONS
 * =========================
 *
 * Firebase:
 *
 * settings
 *   └── meetupLocations
 *       ├── locationId1: "Ayala Center Cebu..."
 *       └── locationId2: "SM City Cebu..."
 */
export function subscribeMeetupLocations(callback) {
  const meetupRef = ref(db, "settings/meetupLocations");

  return onValue(
    meetupRef,
    (snapshot) => {
      const data = snapshot.val() || {};

      const locations = Object.keys(data).map((key) => ({
        id: key,
        address: data[key] || "",
      }));

      callback(locations);
    },
    (error) => {
      console.error(
        "Failed to subscribe to meetup locations:",
        error
      );

      callback([]);
    }
  );
}

/**
 * =========================
 * STORE / PICK-UP LOCATION
 * =========================
 *
 * Firebase:
 *
 * settings
 *   └── storeLocation: "J & M Rentals Hub, Cebu IT Park, Cebu City, 6000 Cebu"
 */
export function subscribeStoreLocation(callback) {
  const storeLocationRef = ref(db, "settings/storeLocation");

  return onValue(
    storeLocationRef,
    (snapshot) => {
      callback(snapshot.val() || "");
    },
    (error) => {
      console.error("Failed to subscribe to store location:", error);
      callback("");
    }
  );
}


/**
 * =========================
 * MAX BOOKINGS PER DAY
 * =========================
 *
 * Firebase:
 *
 * settings
 *   └── maxBookingsPerDay: 15
 */
export function subscribeMaxBookingsPerDay(callback) {
  const maxBookingsRef = ref(db, "settings/maxBookingsPerDay");

  return onValue(
    maxBookingsRef,
    (snapshot) => {
      const value = snapshot.val();
      callback(typeof value === "number" && value > 0 ? value : 15);
    },
    (error) => {
      console.error("Failed to subscribe to max bookings per day:", error);
      callback(15);
    }
  );
}