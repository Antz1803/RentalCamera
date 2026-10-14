// Controller/RentalController.js
// Owns state + user interaction handlers.
// Delegates date/business logic to the Model.
// The View should only read values and call handlers from here.

import { useMemo, useState, useEffect } from "react";

import {
  ALL_DELIVERY_CHOICES,
  DEFAULT_PICKUP_TIME,
  buildMonthGrid,
  countDays,
  calculateRentalPrice,
  fromKey,
  getReturnSchedule,
  normalizeKey,
  toKey,
  validateBooking,
  validatePaymentProof,
} from "../Models/RentalModel";

import { db } from "../../firebase";
import { ref, push } from "firebase/database";
import {
  subscribeBookings,
  subscribeCameras,
  subscribeDeliveryChoices,
  subscribeMeetupLocations,
  subscribeStoreLocation,
  subscribeMaxBookingsPerDay,
  subscribeHighlightPhotos,
} from "../../FirebaseService";

// Booking statuses that should count as "reserving" a date. Pending
// bookings block the date too (not just Approved), otherwise two
// customers could both reserve the same date while the first is still
// awaiting manual verification.
const BLOCKING_STATUSES = ["Pending", "Approved"];

export function useRentalController() {
  const initial = new Date();

  // "YYYY-MM-DD" key for today, used to block selecting any date before it.
  const todayKey = toKey(
    initial.getFullYear(),
    initial.getMonth(),
    initial.getDate()
  );

  // =========================
  // FIREBASE BOOKINGS
  // =========================

  const [bookings, setBookings] = useState([]);

  // Subscribe to live booking data from Firebase for the lifetime of the component.
  useEffect(() => {
    const unsubscribe = subscribeBookings(setBookings);
    return unsubscribe;
  }, []);

  // =========================
  // FIREBASE-CONTROLLED SETTINGS
  // (cameras, delivery choices, meet-up locations, store address, daily
  // booking cap, and highlight-gallery photos — all editable live from
  // the MAUI staff app; these start out empty and populate the moment
  // Firebase's first snapshot arrives.)
  // =========================

  const [cameras, setCameras] = useState([]);
  const [deliveryChoicesEnabled, setDeliveryChoicesEnabled] = useState({});
  const [meetupLocations, setMeetupLocations] = useState([]);
  const [storeLocation, setStoreLocation] = useState("");
  const [maxBookingsPerDay, setMaxBookingsPerDay] = useState(15);
  const [highlightPhotos, setHighlightPhotos] = useState([]);

  useEffect(() => {
    const unsubCameras = subscribeCameras((list) => {
      setCameras(list);
    });
    const unsubDelivery = subscribeDeliveryChoices(setDeliveryChoicesEnabled);
    const unsubMeetups = subscribeMeetupLocations((list) => {
      setMeetupLocations(list);
    });
    const unsubStoreLocation = subscribeStoreLocation(setStoreLocation);
    const unsubMaxBookings = subscribeMaxBookingsPerDay(setMaxBookingsPerDay);
    const unsubHighlightPhotos = subscribeHighlightPhotos(setHighlightPhotos);
    return () => {
      unsubCameras();
      unsubDelivery();
      unsubMeetups();
      unsubStoreLocation();
      unsubMaxBookings();
      unsubHighlightPhotos();
    };
  }, []);

  // Only the delivery choices staff have enabled (or left unconfigured
  // — missing/undefined defaults to enabled, so the site doesn't
  // silently lose delivery options before anyone's touched the
  // settings), in the app's fixed display order.
  const deliveryChoices = useMemo(
    () =>
      ALL_DELIVERY_CHOICES.filter(
        (choice) => deliveryChoicesEnabled[choice] !== false
      ),
    [deliveryChoicesEnabled]
  );

  // Plain address strings, in the shape the Meet-Up dropdown expects.
  const meetups = useMemo(
    () => meetupLocations.map((loc) => loc.address),
    [meetupLocations]
  );

  const [paymentMethod, setPaymentMethod] = useState("Cash On Delivery");

  // =========================
  // CALENDAR STATE
  // =========================

  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  // rangeStart = pick-up date, rangeEnd = return date.
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [hoverKey, setHoverKey] = useState(null);

  // Pick-up time ("HH:mm"). The camera is due back at this same time
  // on the return date (24 hrs × number of days later).
  const [pickupTime, setPickupTime] = useState(DEFAULT_PICKUP_TIME);

  // =========================
  // CUSTOMER / CAMERA STATE
  // =========================

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [camera, setCamera] = useState("");

  // If the live camera list changes (edited/removed via the MAUI app)
  // and the currently selected camera no longer exists in it, fall back
  // to the first available camera instead of leaving a stale selection.
  useEffect(() => {
    if (cameras.length === 0) return;
    const stillExists = cameras.some((cam) => cam.name === camera);
    if (!stillExists) {
      setCamera(cameras[0].name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameras]);

  // =========================
  // DELIVERY STATE
  // =========================

  const [deliveryChoice, setDeliveryChoiceRaw] = useState(ALL_DELIVERY_CHOICES[0]);
  const [meetup, setMeetup] = useState("");
  const [customLocation, setCustomLocation] = useState("");

  // If the currently selected delivery choice gets disabled remotely
  // (or was never a valid enabled option), fall back to whichever
  // choice is actually enabled first.
  useEffect(() => {
    if (deliveryChoices.length === 0) return;
    if (!deliveryChoices.includes(deliveryChoice)) {
      setDeliveryChoiceRaw(deliveryChoices[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryChoices]);

  // =========================
  // BOOKING / PAYMENT STATE
  // =========================

  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState([]);
  const [step, setStep] = useState("booking");

  const [referenceNo, setReferenceNo] = useState("");
  const [systemRefNo, setSystemRefNo] = useState("");

  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState(null);
  const [uploadedPhotoName, setUploadedPhotoName] = useState(null);

  /**
   * All active (Pending/Approved) bookings that cover the given date,
   * across every camera — not scoped to whichever camera is currently
   * selected in the booking form. The calendar shows the shop's full
   * schedule at a glance rather than one camera at a time.
   */
  function getBookingsForDate(dateKey) {
    return bookings.filter((booking) => {
      if (!BLOCKING_STATUSES.includes(booking.status)) return false;
      if (!booking.startDate || !booking.endDate) return false;

      // Normalize keys (e.g. "2026-10-3" -> "2026-10-03") and tolerate
      // start/end saved in the wrong order by other apps.
      const a = normalizeKey(booking.startDate);
      const b = normalizeKey(booking.endDate);
      const [start, end] = a <= b ? [a, b] : [b, a];

      return dateKey >= start && dateKey <= end;
    });
  }

  /**
   * Is the given date fully booked? A date becomes blocked once the
   * number of active reservations covering it (across all cameras)
   * reaches the flat daily cap.
   */
  function isDateBooked(dateKey) {
    const reservedCount = getBookingsForDate(dateKey).length;
    return reservedCount >= maxBookingsPerDay;
  }

  /**
   * Is the given date before today? Customers can book starting today
   * onward — yesterday and earlier are never selectable.
   */
  function isPastDate(dateKey) {
    return dateKey < todayKey;
  }

  /**
   * Every active booking covering the given date, reduced to just what
   * the calendar needs to render a per-renter name chip: their name and
   * that specific booking's status (Pending vs Approved).
   */
  function getBookingEntries(dateKey) {
    return getBookingsForDate(dateKey).map((booking) => ({
      fullName: booking.fullName,
      status: booking.status,
    }));
  }

  /**
   * Comma-separated renter names for the given date. Used for the
   * calendar day cell's tooltip text.
   */
  function getBookingLabel(dateKey) {
    const names = getBookingEntries(dateKey).map((entry) => entry.fullName);
    return names.length ? names.join(", ") : undefined;
  }

  /**
   * Status to display for the given date. If any of the overlapping
   * active bookings is still Pending, the date is shown as Pending
   * (awaiting confirmation); otherwise it's shown as Approved.
   */
  function getBookingStatus(dateKey) {
    const matches = getBookingsForDate(dateKey);

    if (matches.length === 0) return undefined;
    return matches.some((booking) => booking.status === "Pending")
      ? "Pending"
      : "Approved";
  }

  /** Generate a short, human-friendly system reference number for a new booking. */
  function generateSystemRef(prefix = "JRM") {
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${randomStr}`;
  }

  /**
   * Check whether any date in the (inclusive, order-agnostic) range
   * between startKey and endKey is already booked. Used to prevent a
   * user from selecting a range that jumps over an unavailable date.
   */
  function rangeCrossesBooked(startKey, endKey) {
    let startDate = fromKey(startKey);
    let endDate = fromKey(endKey);

    if (startDate > endDate) {
      [startDate, endDate] = [endDate, startDate];
    }

    const current = new Date(startDate);

    while (current <= endDate) {
      const key = toKey(
        current.getFullYear(),
        current.getMonth(),
        current.getDate()
      );

      if (isDateBooked(key)) return true;

      current.setDate(current.getDate() + 1);
    }

    return false;
  }

  // =========================
  // MONTH LABEL
  // =========================

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  // =========================
  // CALENDAR GRID
  // =========================

  const grid = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  // =========================
  // NUMBER OF RENTAL DAYS (24-hour periods)
  // =========================

  const days = useMemo(
    () => countDays(rangeStart, rangeEnd),
    [rangeStart, rangeEnd]
  );

  // =========================
  // PICK-UP / RETURN SCHEDULE
  // =========================

  const returnSchedule = useMemo(
    () => getReturnSchedule(rangeStart, rangeEnd, pickupTime),
    [rangeStart, rangeEnd, pickupTime]
  );

  // =========================
  // DELIVERY ADDRESS
  // Resolves to the right address string based on the delivery choice.
  // =========================

  const deliveryAddress = useMemo(() => {
    if (deliveryChoice === "Pick-Up") return storeLocation;
    if (deliveryChoice === "Meet-Up") return meetup;
    if (deliveryChoice === "Maxim") return customLocation;
    return "";
  }, [deliveryChoice, meetup, customLocation, storeLocation]);

  /**
   * Switch delivery method and reset any dependent state (default meetup
   * spot, cleared custom address) plus any stale confirmation/errors.
   */
  function setDeliveryChoice(choice) {
    setDeliveryChoiceRaw(choice);

    setConfirmed(false);
    setErrors([]);

    if (choice === "Meet-Up" && !meetup) {
      setMeetup(meetups[0] || "");
    }

    if (choice === "Maxim") {
      setCustomLocation("");
    }
  }

  /**
   * Is `key` part of the range currently being selected/hovered on the
   * calendar? Used purely for calendar cell highlighting.
   */
  function isInSelectedRange(key) {
    if (!rangeStart) return false;

    const end = rangeEnd || hoverKey;
    if (!end) return key === rangeStart;

    const [a, b] =
      fromKey(rangeStart) <= fromKey(end) ? [rangeStart, end] : [end, rangeStart];

    return key >= a && key <= b;
  }

  /**
   * Handle a click on a calendar day. Implements the two-click
   * pick-up/return range selection, blocks booked and past dates, and
   * restarts selection if the chosen range would cross an
   * already-booked date. A rental is at least 24 hours, so the return
   * date must be a different day from the pick-up date.
   */
  function handleDayClick(key) {
    if (isDateBooked(key) || isPastDate(key)) return;

    setConfirmed(false);
    setErrors([]);

    // Start a new selection
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(key);
      setRangeEnd(null);
      return;
    }

    // Same day clicked again: a return date must be a different day.
    // Keep the pick-up date as is.
    if (key === rangeStart) {
      return;
    }

    // Don't allow a range containing a booked date
    if (rangeCrossesBooked(rangeStart, key)) {
      setRangeStart(key);
      setRangeEnd(null);
      return;
    }

    // Earlier date selected than the current pick-up — swap
    if (fromKey(key) < fromKey(rangeStart)) {
      setRangeEnd(rangeStart);
      setRangeStart(key);
    } else {
      setRangeEnd(key);
    }
  }

  /** Move the visible calendar month forward/backward by `delta` months, rolling over the year as needed. */
  function handleMonthChange(delta) {
    let m = viewMonth + delta;
    let y = viewYear;

    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }

    setViewMonth(m);
    setViewYear(y);
  }

  /** Reset the selected date range and any related confirmation/errors. */
  function handleClearDates() {
    setRangeStart(null);
    setRangeEnd(null);
    setConfirmed(false);
    setErrors([]);
  }

  /** Validate the booking form and, if valid, generate a reference number and move to the payment step. */
  function handleProceedToPayment() {
    const missing = validateBooking({
      fullName,
      contact,
      rangeStart,
      rangeEnd,
      camera,
      deliveryAddress,
      pickupTime,
      todayKey,
    });

    if (missing.length) {
      setErrors(missing);
      return;
    }

    setErrors([]);
    setSystemRefNo(generateSystemRef("JRM"));
    setStep("payment");
  }

  /** Read the selected proof-of-payment file and store it as a data URL for preview/submission. */
  function handlePhotoUpload(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setUploadedPhotoUrl(reader.result);
      setUploadedPhotoName(file.name);
      setErrors([]);
    };

    reader.readAsDataURL(file);
  }

  /**
   * Validate payment proof (when paying digitally), then persist the
   * booking to Firebase with status "Pending" and advance to the
   * receipt/confirmation step.
   */
  async function handleReserve() {
    let missing = [];

    if (paymentMethod === "Digital Payment") {
      missing = validatePaymentProof({ referenceNo, uploadedPhotoUrl });
    }

    if (missing.length) {
      setErrors(missing);
      return;
    }
    const totalPrice = calculateRentalPrice(cameras, camera, days);

    const booking = {
      fullName,
      contact,
      camera,
      startDate: rangeStart,
      endDate: rangeEnd,
      pickupTime,              // "HH:mm"
      returnDate: rangeEnd,
      returnTime: pickupTime,  // due back 24 hrs × days later, same time
      days,                    // number of 24-hour periods
      totalPrice,
      deliveryChoice,
      deliveryAddress,
      paymentMethod,
      customerRefNo: paymentMethod === "Digital Payment" ? referenceNo : "N/A",
      systemRefNo,
      proofImage: uploadedPhotoUrl,
      status: "Pending",
      createdAt: Date.now(),
    };

    try {
      await push(ref(db, "bookings"), booking);

      setConfirmed(true);
      setStep("reserved");
    } catch (err) {
      console.error("Failed to save booking:", err);

      setErrors([
        "Unable to save your booking. Please check your Firebase connection.",
      ]);
    }
  }

  /** Return from the payment step back to the booking form, clearing any errors. */
  function handleBackToBooking() {
    setErrors([]);
    setStep("booking");
  }

  /**
   * Close the receipt modal and reset payment-proof fields, pick-up time
   * and selected dates so the booking form is ready for a fresh reservation.
   */
  function handleCloseReceipt() {
    setStep("booking");
    setConfirmed(false);
    setErrors([]);
    setReferenceNo("");
    setUploadedPhotoUrl(null);
    setUploadedPhotoName(null);
    setRangeStart(null);
    setRangeEnd(null);
    setPickupTime(DEFAULT_PICKUP_TIME);
  }

  // =========================
  // RETURN VALUES TO VIEW
  // =========================

  return {
    // Calendar
    viewYear,
    viewMonth,
    monthLabel,
    grid,
    rangeStart,
    rangeEnd,
    days,
    isInSelectedRange,
    setHoverKey,

    // Pick-up time / return schedule
    pickupTime,
    setPickupTime,
    returnSchedule,

    // Booked-date lookups (Firebase-backed)
    bookings,
    isDateBooked,
    isPastDate,
    getBookingLabel,
    getBookingEntries,
    getBookingStatus,

    // Form
    fullName,
    setFullName,

    contact,
    setContact,

    camera,
    setCamera,

    deliveryChoice,
    setDeliveryChoice,

    meetup,
    setMeetup,

    customLocation,
    setCustomLocation,

    deliveryAddress,

    // Payment
    paymentMethod,
    setPaymentMethod,

    // Submission
    confirmed,
    errors,

    step,

    referenceNo,
    setReferenceNo,
    systemRefNo,

    uploadedPhotoUrl,
    uploadedPhotoName,

    // Handlers
    handleDayClick,
    handleMonthChange,
    handleClearDates,
    handleProceedToPayment,
    handlePhotoUpload,
    handleReserve,
    handleBackToBooking,
    handleCloseReceipt,

    // Options — now live from Firebase (editable via the MAUI staff app)
    cameras,
    meetups,
    deliveryChoices,
    maxBookingsPerDay,
    highlightPhotos,

    // Utility
    toKey,
  };
}