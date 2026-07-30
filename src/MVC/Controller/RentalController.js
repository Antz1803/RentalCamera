// Controller/RentalController.js
// Owns state + user interaction handlers.
// Delegates date/business logic to the Model.
// The View should only read values and call handlers from here.

import { useMemo, useState, useEffect } from "react";

import {
  CAMERAS,
  DELIVERY_CHOICES,
  MEETUPS,
  STORE_LOCATION,
  buildMonthGrid,
  countDays,
  fromKey,
  getCameraQuantity,
  toKey,
  validateBooking,
  validatePaymentProof,
} from "../Models/RentalModel";

import { db } from "../../firebase";
import { ref, push } from "firebase/database";
import { subscribeBookings } from "../../FirebaseService";

export function useRentalController() {
  const initial = new Date();

  // =========================
  // FIREBASE BOOKINGS
  // =========================

  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeBookings(setBookings);

    return unsubscribe;
  }, []);

  const [paymentMethod, setPaymentMethod] = useState("Cash On Hand");

  // =========================
  // CALENDAR STATE
  // =========================

  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [hoverKey, setHoverKey] = useState(null);

  // =========================
  // CUSTOMER / CAMERA STATE
  // =========================

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [camera, setCamera] = useState(CAMERAS[0].name);

  // =========================
  // DELIVERY STATE
  // =========================

  const [deliveryChoice, setDeliveryChoiceRaw] = useState(
    DELIVERY_CHOICES[0]
  );

  const [meetup, setMeetup] = useState(MEETUPS[0]);

  const [customLocation, setCustomLocation] = useState("");

  // =========================
  // BOOKING / PAYMENT STATE
  // =========================

  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState([]);

  const [step, setStep] = useState("booking");

  const [referenceNo, setReferenceNo] = useState("");

  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState(null);

  const [uploadedPhotoName, setUploadedPhotoName] = useState(null);

  // =========================
  // CHECK IF DATE IS BOOKED
  // (scoped to whichever camera is currently selected — a booking on
  // Camera A doesn't block Camera B on the same day)
  //
  // Pending bookings count as reserved too, not just Approved ones —
  // otherwise two customers could both "reserve" the same date while
  // the first one is still awaiting manual verification.
  // =========================

  const BLOCKING_STATUSES = ["Pending", "Approved"];

  function isDateBooked(dateKey) {
    return bookings.some((booking) => {
      if (!BLOCKING_STATUSES.includes(booking.status)) {
        return false;
      }

      return (
        booking.camera === camera &&
        dateKey >= booking.startDate &&
        dateKey <= booking.endDate
      );
    });
  }

  // =========================
  // WHO BOOKED A GIVEN DATE
  // (for the calendar's "Booked — Sarah P." style label)
  // =========================

  function getBookingLabel(dateKey) {
    const match = bookings.find((booking) => {
      if (!BLOCKING_STATUSES.includes(booking.status)) {
        return false;
      }

      return (
        booking.camera === camera &&
        dateKey >= booking.startDate &&
        dateKey <= booking.endDate
      );
    });

    return match ? match.fullName : undefined;
  }

  // =========================
  // BOOKING STATUS FOR A GIVEN DATE
  // lets the calendar visually distinguish "Pending" from "Approved"
  // =========================

  function getBookingStatus(dateKey) {
    const match = bookings.find((booking) => {
      if (!BLOCKING_STATUSES.includes(booking.status)) {
        return false;
      }

      return (
        booking.camera === camera &&
        dateKey >= booking.startDate &&
        dateKey <= booking.endDate
      );
    });

    return match ? match.status : undefined;
  }

  // =========================
  // LIVE AVAILABLE STOCK FOR A CAMERA
  // total quantity owned, minus however many units currently have an
  // active (Pending or Approved) booking against them — used for the
  // "(N available)" text in the camera dropdown
  // =========================

  function getCameraAvailableCount(cameraName) {
    const reserved = bookings.filter(
      (booking) =>
        booking.camera === cameraName &&
        BLOCKING_STATUSES.includes(booking.status)
    ).length;

    return Math.max(getCameraQuantity(cameraName) - reserved, 0);
  }

  // =========================
  // CHECK DATE RANGE
  // =========================

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

      if (isDateBooked(key)) {
        return true;
      }

      current.setDate(current.getDate() + 1);
    }

    return false;
  }

  // =========================
  // MONTH LABEL
  // =========================

  const monthLabel = new Date(
    viewYear,
    viewMonth,
    1
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // =========================
  // CALENDAR GRID
  // =========================

  const grid = useMemo(
    () => buildMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  // =========================
  // NUMBER OF RENTAL DAYS
  // =========================

  const days = useMemo(
    () => countDays(rangeStart, rangeEnd),
    [rangeStart, rangeEnd]
  );

  // =========================
  // DELIVERY ADDRESS
  // =========================

  const deliveryAddress = useMemo(() => {
    if (deliveryChoice === "Pick-Up") {
      return STORE_LOCATION;
    }

    if (deliveryChoice === "Meet-Up") {
      return meetup;
    }

    if (deliveryChoice === "Maxim") {
      return customLocation;
    }

    return "";
  }, [deliveryChoice, meetup, customLocation]);

  // =========================
  // DELIVERY CHOICE
  // =========================

  function setDeliveryChoice(choice) {
    setDeliveryChoiceRaw(choice);

    setConfirmed(false);
    setErrors([]);

    if (choice === "Meet-Up" && !meetup) {
      setMeetup(MEETUPS[0]);
    }

    if (choice === "Maxim") {
      setCustomLocation("");
    }
  }

  // =========================
  // CHECK SELECTED RANGE
  // =========================

  function isInSelectedRange(key) {
    if (!rangeStart) {
      return false;
    }

    const end = rangeEnd || hoverKey;

    if (!end) {
      return key === rangeStart;
    }

    const [a, b] =
      fromKey(rangeStart) <= fromKey(end)
        ? [rangeStart, end]
        : [end, rangeStart];

    return key >= a && key <= b;
  }

  // =========================
  // CLICK CALENDAR DATE
  // =========================

  function handleDayClick(key) {
    if (isDateBooked(key)) {
      return;
    }

    setConfirmed(false);
    setErrors([]);

    // Start a new selection
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(key);
      setRangeEnd(null);
      return;
    }

    // Click the same start date
    if (key === rangeStart) {
      setRangeStart(null);
      setRangeEnd(null);
      return;
    }

    // Don't allow a range containing a booked date
    if (rangeCrossesBooked(rangeStart, key)) {
      setRangeStart(key);
      setRangeEnd(null);
      return;
    }

    // Earlier date selected
    if (fromKey(key) < fromKey(rangeStart)) {
      setRangeEnd(rangeStart);
      setRangeStart(key);
    } else {
      setRangeEnd(key);
    }
  }

  // =========================
  // CHANGE MONTH
  // =========================

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

  // =========================
  // CLEAR DATES
  // =========================

  function handleClearDates() {
    setRangeStart(null);
    setRangeEnd(null);
    setConfirmed(false);
    setErrors([]);
  }

  // =========================
  // PROCEED TO PAYMENT
  // =========================

  function handleProceedToPayment() {
    const missing = validateBooking({
      fullName,
      contact,
      rangeStart,
      rangeEnd,
      camera,
      deliveryAddress,
    });

    if (missing.length) {
      setErrors(missing);
      return;
    }

    setErrors([]);
    setStep("payment");
  }

  // =========================
  // PHOTO UPLOAD
  // =========================

  function handlePhotoUpload(file) {
    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setUploadedPhotoUrl(reader.result);
      setUploadedPhotoName(file.name);
      setErrors([]);
    };

    reader.readAsDataURL(file);
  }

  // =========================
  // RESERVE CAMERA
  // (was missing its own function wrapper — that's why the file wouldn't
  // build at all: `await` outside an async function, and the stray closing
  // brace was ending useRentalController() early)
  // =========================

  async function handleReserve() {
    let missing = [];

    if (paymentMethod === "Digital Payment") {
      missing = validatePaymentProof({
        referenceNo,
        uploadedPhotoUrl,
      });
    }

    if (missing.length) {
      setErrors(missing);
      return;
    }

    const booking = {
      fullName,
      contact,
      camera,
      startDate: rangeStart,
      endDate: rangeEnd,
      days,
      deliveryChoice,
      deliveryAddress,
      paymentMethod,
      referenceNo,
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

  // =========================
  // BACK TO BOOKING
  // =========================

  function handleBackToBooking() {
    setErrors([]);
    setStep("booking");
  }

  // =========================
  // CLOSE RECEIPT MODAL
  // resets the payment-proof fields and selected dates so the booking
  // form is ready for a fresh reservation
  // =========================

  function handleCloseReceipt() {
    setStep("booking");
    setConfirmed(false);
    setErrors([]);
    setReferenceNo("");
    setUploadedPhotoUrl(null);
    setUploadedPhotoName(null);
    setRangeStart(null);
    setRangeEnd(null);
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

    // Booked-date lookups (Firebase-backed)
    bookings,
    isDateBooked,
    getBookingLabel,
    getBookingStatus,
    getCameraAvailableCount,

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

    // Options
    cameras: CAMERAS,
    meetups: MEETUPS,
    deliveryChoices: DELIVERY_CHOICES,

    // Utility
    toKey,
  };
}