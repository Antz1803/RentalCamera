// Views/PaymentProcessingView.jsx
// Full-screen step shown after "Proceed to Payment": lets the customer
// pick Cash-on-Hand or Digital Payment, review the booking summary, and
// (for digital payments) submit a reference number + screenshot.

import React, { useRef } from "react";
import { ArrowLeft, ImageUp, X } from "lucide-react";
import {
  COLORS,
  calculateRentalPrice,
  formatDisplayDate,
} from "../Models/RentalModel";
import { inputStyle } from "./FormBits";

import logo from "/src/Images/Logo.png";
import qrCode from "/src/Images/My-Qr-Code.jpg";

/** Brand header (logo + shop name) shown at the top of this view. */
function Header() {
  return (
    <div className="brand-header">
      <img
        src={logo}
        alt="J & M Rentals Hub"
        className="brand-header__logo"
      />
      <div>
        <h1 className="brand-header__name">J&amp;M</h1>
        <p className="brand-header__subline">Camera rentals hub</p>
      </div>
      <div className="brand-header__badge ml-auto">
        <span className="brand-header__badge-dot" />
        Secure checkout
      </div>
    </div>
  );
}

export default function PaymentProcessingView({ c }) {
  const fileInputRef = useRef(null);
  const totalPrice = calculateRentalPrice(c.cameras, c.camera, c.days);

  return (
    <div
      style={{
        background: COLORS.bg,
        color: COLORS.ink,
        minHeight: "100%",
        fontFamily:
          "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
      }}
      className="app-shell w-full flex justify-center px-4 py-6 sm:py-10"
    >
      <div className="w-full max-w-lg">
        <Header />

        <button
          onClick={c.handleBackToBooking}
          className="flex items-center gap-1.5 mb-6"
          style={{
            fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
            fontSize: 13,
            color: COLORS.inkMuted,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <ArrowLeft size={15} />
          Back to booking details
        </button>

        <div className="mb-6 rounded-2xl border border-[#ded4b4] bg-[#fdfbf3]/80 p-5 text-center shadow-sm">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.28em] text-[#8b7355]">
            Almost there
          </p>
          <h1 className="m-0 font-serif text-2xl font-bold text-[#303722]">
            Complete your reservation
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[#7a7461]">
            Select a payment method and send your details so we can confirm your camera booking.
          </p>
        </div>

        {/* Payment Method Selector Dropdown */}
        <div className="mb-6">
          <label
            style={{
              fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
              fontSize: 11.5,
              color: COLORS.inkMuted,
              fontWeight: 600,
              display: "block",
              marginBottom: 6,
            }}
          >
            Select Payment Method
          </label>
          <select
            value={c.paymentMethod}
            onChange={(e) => c.setPaymentMethod(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="Cash On Delivery">Cash On Delivery</option>
            <option value="Digital Payment">Digital Payment (InstaPay)</option>
          </select>
        </div>

        {/* Cash On Delivery Summary */}
        {c.paymentMethod === "Cash On Delivery" && (
          <div
            className="section-card"
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              padding: 20,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                textAlign: "center",
                marginBottom: 20,
                color: COLORS.oliveDark,
                fontWeight: 700,
                fontSize: 20,
              }}
            >
              Reservation summary
            </div>

            <div style={{ marginBottom: 15 }}>
              <strong>📷 Camera</strong>
              <div>{c.camera || "-"}</div>
            </div>

            <div style={{ marginBottom: 15 }}>
              <strong>📅 Rental Date</strong>
              <div>
                {formatDisplayDate(c.rangeStart)} - {formatDisplayDate(c.rangeEnd)}
              </div>
            </div>

            <div style={{ marginBottom: 15 }}>
              <strong>🗓 Rental Duration</strong>
              <div>
                {c.days} {c.days === 1 ? "Day" : "Days"}
              </div>
            </div>

            <div style={{ marginBottom: 15 }}>
              <strong>💵 Payment Method</strong>
              <div>Cash On Delivery</div>
            </div>

            <hr style={{ margin: "20px 0", borderColor: COLORS.border }} />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 22,
                fontWeight: "bold",
                color: COLORS.oliveDark,
              }}
            >
              <span>Total Payment</span>
              <span>₱{Number(totalPrice || 0).toLocaleString()}</span>
            </div>

            <div
              style={{
                marginTop: 20,
                padding: 12,
                borderRadius: 8,
                background: COLORS.borderSoft,
                color: COLORS.inkMuted,
                fontSize: 13,
              }}
            >
              Payment will be collected upon camera pick-up or meet-up.
            </div>
          </div>
        )}

        {/* Digital Payment Details */}
        {c.paymentMethod === "Digital Payment" && (
          <>
            <div
              className="rounded-xl flex flex-col items-center justify-center mb-6"
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                padding: 20,
              }}
            >
              <img
                src={qrCode}
                alt="InstaPay QR code"
                style={{ width: "100%", maxHeight: 320, objectFit: "contain" }}
              />
              <div
                style={{
                  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
                  fontSize: 13,
                  color: COLORS.inkMuted,
                  marginTop: 10,
                  letterSpacing: "0.05em",
                }}
              >
                Scan with InstaPay
              </div>
            </div>

            {/* Customer Input for Digital Payment Reference Number */}
            <label
              style={{
                fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
                fontSize: 11.5,
                color: COLORS.inkMuted,
                fontWeight: 600,
                display: "block",
                marginBottom: 6,
              }}
            >
              Reference No.
            </label>
            <input
              value={c.referenceNo}
              onChange={(e) => c.setReferenceNo(e.target.value)}
              placeholder="Enter your reference number from your digital payment"
              style={{ ...inputStyle, marginBottom: 18 }}
            />

            {/* Upload File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => c.handlePhotoUpload(e.target.files?.[0])}
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.borderSoft,
                fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
                fontSize: 14,
                color: COLORS.ink,
                cursor: "pointer",
                marginBottom: 18,
              }}
            >
              <ImageUp size={15} />
              {c.uploadedPhotoName ? "Change photo" : "Upload payment screenshot"}
            </button>

            {/* Uploaded Preview */}
            <div
              className="rounded-xl flex flex-col items-center justify-center mb-6 overflow-hidden"
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                minHeight: 200,
              }}
            >
              {c.uploadedPhotoUrl ? (
                <img
                  src={c.uploadedPhotoUrl}
                  alt="Uploaded proof of payment"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
                    fontSize: 13,
                    color: COLORS.inkMuted,
                    padding: 24,
                    textAlign: "center",
                  }}
                >
                  Uploaded photo will appear here
                </div>
              )}
            </div>
          </>
        )}

        {/* Errors Display */}
        {c.errors.length > 0 && (
          <div
            className="rounded-lg px-4 py-3 mb-4 flex items-start gap-2"
            style={{
              background: "#F6E5DE",
              border: "1px solid #D9A98F",
              color: "#7A3B22",
              fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
              fontSize: 13,
            }}
          >
            <X size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Please complete: {c.errors.join(", ")}.</span>
          </div>
        )}

        <button
          onClick={c.handleReserve}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 10,
            background: COLORS.olive,
            color: "#F3EFD8",
            fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
            fontSize: 15,
            letterSpacing: "0.06em",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            transition: "background 150ms ease, transform 100ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.oliveDark)}
          onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.olive)}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.99)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {c.step === "reserved" && <ReceiptModal c={c} />}
          Reserve
        </button>
      </div>
    </div>
  );
}
