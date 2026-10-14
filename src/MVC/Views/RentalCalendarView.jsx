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
import logo from "/src/Images/Logo.png";

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
        className="app-shell w-full flex justify-center px-4 py-6 sm:py-10"
      >
        <div className="w-full max-w-5xl">
          <Header />

          <div className="mb-7">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.28em] text-[#8b7355]">
                  Your next adventure starts here
                </p>
                <h1 className="m-0 font-serif text-2xl font-bold tracking-tight text-[#303722] sm:text-3xl">
                  Reserve your camera
                </h1>
              </div>
              <span className="hidden text-right text-xs leading-5 text-[#7a7461] sm:block">
                Choose your dates<br />and gear below
              </span>
            </div>
            <CalendarPanel c={c} />
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
    <div className="brand-header">
      <div className="brand-header__identity">
        <img className="brand-header__logo" src={logo} alt="J & M Rentals Hub" />
        <div>
          <h1 className="brand-header__name">J&amp;M</h1>
          <p className="brand-header__subline">Camera rentals hub</p>
        </div>
      </div>
      <div className="brand-header__badge">
        <span className="brand-header__badge-dot" />
        Online booking
      </div>
    </div>
  );
}
