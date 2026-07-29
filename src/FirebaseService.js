import { db } from "./firebase";
import { ref, onValue } from "firebase/database";

export function subscribeBookings(callback) {
  const bookingsRef = ref(db, "bookings");

  return onValue(bookingsRef, (snapshot) => {
    const data = snapshot.val() || {};

    const bookings = Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
    }));

    callback(bookings);
  });
}