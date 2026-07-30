// Views/PaymentProcessingView.jsx
// Step 2 of the flow: shown after booking details pass validation.
// Reads/writes only through the controller (`c`) passed in as a prop.

import React, { useRef } from "react";
import { ArrowLeft, ImageUp, X } from "lucide-react";
import { COLORS } from "../Models/RentalModel";
import { inputStyle } from "./FormBits";

import logo from "../../Images/timer.png";
import qrCode from "../../Images/My-Qr-Code.jpg";

function Header() {
  return (
    <div className="flex items-center gap-4 mb-8">
      <img
        src={logo}
        alt="Lens & Shutter Rentals"
        style={{ width: 56, height: 56, flexShrink: 0 }}
      />
      <div>
        <div style={{ fontSize: 26, letterSpacing: "0.08em", fontWeight: 700, lineHeight: 1.1 }}>
          LENS &amp; SHUTTER
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
          RENTALS
        </div>
      </div>
    </div>
  );
}

export default function PaymentProcessingView({ c }) {
  const fileInputRef = useRef(null);

  return (
    <div
      style={{
        background: COLORS.bg,
        color: COLORS.ink,
        minHeight: "100%",
        fontFamily:
          "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
      }}
      className="w-full flex justify-center px-4 py-8"
    >
      <div className="w-full max-w-md">
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

        <div
          style={{
            fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
            fontSize: 11,
            letterSpacing: "0.25em",
            color: COLORS.inkMuted,
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          PROCESSING PAYMENT
        </div>

        {/* QR code */}
        <div
          className="rounded-xl flex flex-col items-center justify-center mb-6"
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            aspectRatio: "1 / 1",
          }}
        >
          <img
            src={qrCode}
            alt="InstaPay QR code"
            style={{ width: 360, height: 360, objectFit: "contain" }}
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

        {/* reference number */}
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
          placeholder="Enter the reference number from your digital payment."
          style={{ ...inputStyle, marginBottom: 18 }}
        />

        {/* upload photo */}
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

        {/* uploaded preview */}
        <div
          className="rounded-xl flex flex-col items-center justify-center mb-6 overflow-hidden"
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            minHeight: 240,
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

        {/* errors */}
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

        {/* Note: the "reserved" confirmation now lives in ReceiptModal,
            shown over the booking screen once the reservation is saved. */}

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
          RESERVE
        </button>
      </div>
    </div>
  );
}

