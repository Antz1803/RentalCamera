// Views/components/BookingFormPanel.jsx
// Renders the two-column form (renter info + gear/dates). All values and
// setters come from the controller passed in as `c`.

import React from "react";
import { Camera, Film, MapPin, Phone, User } from "lucide-react";
import {
  COLORS,
  formatDisplayDate,
  calculateRentalPrice,
  getCameraPrice,
  getDiscountedDayPrice,
} from "../Models/RentalModel";
import { Field, SectionLabel, inputStyle } from "./FormBits";

/** Renter details + delivery choice on the left, camera/date selection + live price breakdown on the right. */
export default function BookingFormPanel({ c }) {
  return (
    <div className="grid md:grid-cols-2 gap-5 mb-6">
      <div
        className="rounded-xl p-5 md:p-6"
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
      >
        <SectionLabel icon={<Film size={15} />} text="Renter" />

        <Field label="Full name" icon={<User size={13} />}>
          <input
            value={c.fullName}
            onChange={(e) => c.setFullName(e.target.value)}
            style={inputStyle}
            placeholder="e.g., Jeorge Rey M. Antipaso"
          />
        </Field>

        <Field label="Contact no." icon={<Phone size={13} />}>
          <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={c.contact}
              onChange={(e) => c.setContact(e.target.value.replace(/\D/g, ''))}
              style={inputStyle}
              placeholder="e.g., 09011239978"
              maxLength={11}
            />
        </Field>

        <Field label="Rental length (auto)">
          <div style={{ ...inputStyle, color: COLORS.inkMuted }}>
            {c.days > 0 ? `${c.days} day${c.days > 1 ? "s" : ""}` : "Select dates"}
          </div>
        </Field>

        <Field label="Delivery choice" icon={<MapPin size={13} />}>
          <select
            value={c.deliveryChoice}
            onChange={(e) => c.setDeliveryChoice(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            {c.deliveryChoices.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>

        {c.deliveryChoice === "Pick-Up" && (
          <Field label="Pick-up address">
            <div style={{ ...inputStyle, color: COLORS.inkMuted }}>
              {c.deliveryAddress}
            </div>
          </Field>
        )}

        {c.deliveryChoice === "Meet-Up" && (
          <Field label="Meet-up location">
            <select
              value={c.meetup}
              onChange={(e) => c.setMeetup(e.target.value)}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              {c.meetups.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
        )}

        {c.deliveryChoice === "Maxim" && (
          <Field label="Your address for Maxim">
            <input
              value={c.customLocation}
              onChange={(e) => c.setCustomLocation(e.target.value)}
              style={inputStyle}
              placeholder="Enter your full address"
            />
           <p
        style={{
          marginTop: 10,
          fontWeight: "600",
          color: "#B45309",
        }}
      >
        Note:
      </p>

      <p
        style={{
          fontSize: 13,
          color: "#6B7280",
          lineHeight: 1.5,
        }}
      >
        The customer is responsible for paying the Maxim delivery fee upon
        delivery.
      </p>
          </Field>
        )}
      </div>

      <div
        className="rounded-xl p-5 md:p-6"
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
      >
        <SectionLabel icon={<Camera size={15} />} text="Gear & Dates" />

        <Field label="Camera available">
          <select
            value={c.camera}
            onChange={(e) => c.setCamera(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            {c.cameras.map((cam) => (
              <option key={cam.name} value={cam.name}>
                {cam.name}
              </option>
            ))}
          </select>

          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 8,
              background: "#F8F6ED",
              border: `1px solid ${COLORS.border}`,
            }}
          >
            <div style={{ fontWeight: 600, color: COLORS.oliveDark }}>Base Price</div>

            <div
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: COLORS.sageDark,
                marginTop: 5,
              }}
            >
              ₱{getCameraPrice(c.cameras, c.camera).toLocaleString()}
            </div>

            <div style={{ marginTop: 6, color: COLORS.inkMuted, fontSize: 13 }}>
              First day rental
            </div>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <div style={inputStyle}>{formatDisplayDate(c.rangeStart)}</div>
          </Field>

          <Field label="End date">
            <div style={inputStyle}>{formatDisplayDate(c.rangeEnd)}</div>
          </Field>
        </div>

        <div
          style={{
            marginTop: 18,
            padding: 18,
            borderRadius: 12,
            background: "#EEF7EC",
            border: "2px solid #8DBA8A",
          }}
        >
          <div style={{ fontSize: 14, color: COLORS.inkMuted }}>Rental Cost</div>

          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              color: "#2F6A36",
              marginTop: 5,
            }}
          >
            ₱{calculateRentalPrice(c.cameras, c.camera, c.days).toLocaleString()}
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: COLORS.inkMuted,
              lineHeight: 1.6,
            }}
          >
            {c.days > 0 ? (
              <>
                {c.days <= 2 ? (
                  <>
                    Rate: <strong>₱{getCameraPrice(c.cameras, c.camera)}</strong> / day
                    <br />
                    <span style={{ fontSize: 12 }}>
                      Book 3+ days to unlock the discounted rate for the whole rental.
                    </span>
                  </>
                ) : (
                  <>
                    Discounted rate: <strong>₱{getDiscountedDayPrice(c.cameras, c.camera)}</strong> / day
                    <br />
                    <span style={{ fontSize: 12 }}>
                      Applies to all {c.days} days — 3+ day bookings get this rate the whole way through.
                    </span>
                  </>
                )}
                <br />
                <hr style={{ margin: "10px 0", borderColor: COLORS.border }} />
                Total:{" "}
                <strong>₱{calculateRentalPrice(c.cameras, c.camera, c.days).toLocaleString()}</strong>
              </>
            ) : (
              "Select your rental dates."
            )}
          </div>
        </div>

        <p
          style={{
            fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
            fontSize: 12,
            color: COLORS.inkMuted,
            marginTop: 4,
            lineHeight: 1.5,
          }}
        >
          Tap a start day on the calendar, then an end day. Tap the start day
          again to clear.
        </p>

        <button
          onClick={c.handleClearDates}
          style={{
            fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
            fontSize: 12.5,
            color: COLORS.oliveDark,
            textDecoration: "underline",
            marginTop: 10,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Clear selected dates
        </button>
      </div>
    </div>
  );
}
