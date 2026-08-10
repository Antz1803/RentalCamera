// Views/RentalCalendarView.jsx
// Top-level View. Pulls all state/behavior from the Controller hook and
// composes the smaller view components. This file has no business logic.

import React from "react";
import { Aperture } from "lucide-react";
import { useRentalController } from "../Controller/RentalController";
import { COLORS } from "../Models/RentalModel";
import CalendarPanel from "./CalendarPanel";
import BookingFormPanel from "./BookingFormPanel";
import PaymentPanel from "./PaymentPanel";
import PaymentProcessingView from "./PaymentProcessingView";
import ReceiptModal from "./ReceiptModal";
import RotateDeviceNotice from "./RotateDeviceNotice";
import logo from "/src/Images/Logo.svg";

/**
 * Root view for the rental flow. Switches between the payment screen and
 * the booking screen based on `c.step`, and overlays the receipt modal
 * once a reservation has been submitted.
 */
export default function RentalCalendarView() {
  const c = useRentalController();

  // InstaPay QR / reference-number / photo-upload screen replaces the
  // booking screen entirely while the customer is paying
  if (c.step === "payment") {
    return (
      <>
        <RotateDeviceNotice />
        <PaymentProcessingView c={c} />
      </>
    );
  }

  // "booking" and "reserved" both render the booking screen underneath;
  // "reserved" additionally overlays the receipt as a modal
  return (
    <>
      <RotateDeviceNotice />

      <div
        style={{
          background: COLORS.bg,
          color: COLORS.ink,
          minHeight: "100%",
          overflowX: "hidden",
          fontFamily:
            "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
        }}
        className="w-full flex justify-center px-4 py-8"
      >
        <div className="w-full max-w-4xl">
          <Header />

          {/* Breakout wrapper: lets just the calendar be wider than the rest
              of the form below it, regardless of the max-w-4xl container. */}
          <div
            className="flex justify-center"
            style={{ width: "100vw", marginLeft: "50%", transform: "translateX(-50%)" }}
          >
            <div className="w-full max-w-8xl px-25">
              <CalendarPanel c={c} />
            </div>
          </div>

          <BookingFormPanel c={c} />
          <PaymentPanel c={c} />
        </div>

        {c.step === "reserved" && <ReceiptModal c={c} />}
      </div>
    </>
  );
}

/** Brand header (logo + shop name) shown at the top of the booking screen. */
function Header() {
  return (
    <div className="flex items-center gap-4 mb-8 ">
    <img
           src={logo}
           alt="J & M Rentals Hub"
           style={{ width: 95, height: 95, flexShrink: 0 }}
         />
      <div>
        <div style={{ fontSize: 46, letterSpacing: "0.08em", fontWeight: 700, lineHeight: 1.1 }}>
          J&M
        </div>
        <div
          style={{
            fontSize: 13,
            letterSpacing: "0.35em",
            color: COLORS.inkMuted,
            fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
            marginTop: 2,
          }}
        >
          RENTALS HUB
        </div>
      </div>
    </div>
  );
}