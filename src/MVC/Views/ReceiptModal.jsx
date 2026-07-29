// Views/ReceiptModal.jsx
// Shown as an overlay once c.step === "reserved". Purely presentational —
// reads booking details from the controller and closes via handleCloseReceipt,
// which resets the flow so BookingFormPanel is ready for a new reservation.

import React from "react";
import { Calendar, Camera, Check, MapPin, Phone, User, X } from "lucide-react";
import {
  COLORS,
  calculateRentalPrice,
  formatDisplayDate,
} from "../Models/RentalModel";

export default function ReceiptModal({ c }) {
  const total = calculateRentalPrice(c.camera, c.days);

  return (
    <div
      onClick={c.handleCloseReceipt}
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{
        background: "rgba(46, 43, 34, 0.55)",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-2xl w-full max-w-sm overflow-hidden"
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          fontFamily:
            "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* header */}
        <div
          className="flex items-center justify-between px-6 pt-6 pb-4"
          style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 30, height: 30, background: COLORS.sage }}
            >
              <Check size={16} color={COLORS.sageText} strokeWidth={2.5} />
            </div>
            <div style={{ fontSize: 19, fontWeight: 700 }}>Reservation Receipt</div>
          </div>
          <button
            onClick={c.handleCloseReceipt}
            aria-label="Close receipt"
            className="flex items-center justify-center rounded-full"
            style={{
              width: 28,
              height: 28,
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              cursor: "pointer",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* scrollable body */}
        <div className="px-6 py-5" style={{ overflowY: "auto" }}>
          <p
            style={{
              fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
              fontSize: 13,
              color: COLORS.inkMuted,
              lineHeight: 1.5,
              marginBottom: 18,
            }}
          >
            Thanks, {c.fullName.split(" ")[0]}! Your reservation is on file and
            pending verification. We'll confirm once your InstaPay reference
            has been checked.
          </p>

          <ReceiptRow icon={<User size={13} />} label="Renter" value={c.fullName} />
          <ReceiptRow icon={<Phone size={13} />} label="Contact" value={c.contact} />
          <ReceiptRow icon={<Camera size={13} />} label="Camera" value={c.camera} />
          <ReceiptRow
            icon={<Calendar size={13} />}
            label="Rental dates"
            value={`${formatDisplayDate(c.rangeStart)} – ${formatDisplayDate(
              c.rangeEnd
            )} (${c.days} day${c.days > 1 ? "s" : ""})`}
          />
          <ReceiptRow
            icon={<MapPin size={13} />}
            label={c.deliveryChoice}
            value={c.deliveryAddress}
          />
          <ReceiptRow label="Reference No." value={c.referenceNo} />
          <ReceiptRow label="Status" value="Pending verification" />

          <div
            className="flex items-center justify-between mt-4 pt-4"
            style={{ borderTop: `1px solid ${COLORS.borderSoft}` }}
          >
            <div
              style={{
                fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
                fontSize: 13,
                color: COLORS.inkMuted,
              }}
            >
              Total paid
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.sageText }}>
              ₱{total.toLocaleString()}
            </div>
          </div>

          {c.uploadedPhotoUrl && (
            <img
              src={c.uploadedPhotoUrl}
              alt="Uploaded proof of payment"
              className="rounded-lg mt-4"
              style={{
                width: "100%",
                maxHeight: 140,
                objectFit: "cover",
                border: `1px solid ${COLORS.border}`,
              }}
            />
          )}
        </div>

        {/* footer */}
        <div className="px-6 pb-6 pt-2">
          <button
            onClick={c.handleCloseReceipt}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 10,
              background: COLORS.olive,
              color: "#F3EFD8",
              fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
              fontSize: 14,
              letterSpacing: "0.06em",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            DONE — BOOK ANOTHER
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiptRow({ icon, label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-2.5">
      <div
        className="flex items-center gap-1.5"
        style={{
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
          fontSize: 12.5,
          color: "#7A7461",
          flexShrink: 0,
        }}
      >
        {icon}
        {label}
      </div>
      <div
        style={{
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
          fontSize: 13,
          color: "#2E2B22",
          textAlign: "right",
        }}
      >
        {value}
      </div>
    </div>
  );
}