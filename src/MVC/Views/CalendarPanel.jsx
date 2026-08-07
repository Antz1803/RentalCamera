// Views/components/CalendarPanel.jsx
// Renders the month calendar. All state and click handling comes from the
// controller passed in as `c` — this component only reads and displays.

import React from "react";
import { Aperture, ChevronLeft, ChevronRight } from "lucide-react";
import {
  COLORS,
  WEEKDAYS,
  toKey,
  getCameraShortName,
  isPastDate,
} from "../Models/RentalModel";
import { LegendDot } from "./FormBits";

/** Month calendar grid: header/nav, day cells (colored by booking status/selection), and a legend. */
export default function CalendarPanel({ c }) {
  const cellMinHeight = "clamp(52px, 8vw, 78px)";

  return (
    <div
      className="rounded-xl p-5 md:p-7 lg:p-8 mb-6"
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        boxShadow: "0 1px 2px rgba(46,43,34,0.06)",
      }}
    >
      <div
        style={{
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
          fontSize: 11,
          letterSpacing: "0.25em",
          color: COLORS.inkMuted,
          textAlign: "center",
          marginBottom: 4,
        }}
      >
        RENTAL SCHEDULE
      </div>

    <div className="mb-5 text-center">
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.03em" }}>
        {c.monthLabel}
      </div>
    </div>

      <div
        className="grid grid-cols-7 mb-2"
        style={{
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
          fontSize: 12,
          letterSpacing: "0.05em",
          color: COLORS.inkMuted,
          fontWeight: 600,
        }}
      >
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 items-stretch">
        {c.grid.map((d, i) => {
          if (d === null) return <div key={i} />;

          const key = toKey(c.viewYear, c.viewMonth, d);
          const past = isPastDate(key);
          const full = c.isDateBooked(key);
          const bookingEntries = c.getBookingEntries(key);
          const hasBookings = bookingEntries.length > 0;
          const bookedTooltip = hasBookings ? c.getBookingLabel(key) : undefined;
          const mine = c.isInSelectedRange(key);
          const isEdge = key === c.rangeStart || key === c.rangeEnd;

          let bg, textColor, border;
          if (full) {
            bg = COLORS.orange;
            textColor = COLORS.orangeText;
            border = `1px solid ${COLORS.orangeDark}`;
          } else if (mine) {
            bg = isEdge ? COLORS.mustardDark : COLORS.mustard;
            textColor = COLORS.mustardText;
            border = `1px solid ${COLORS.mustardDark}`;
          } else {
            bg = COLORS.sage;
            textColor = COLORS.sageText;
            border = `1px solid ${COLORS.sageDark}`;
          }

          return (
            <button
              key={i}
              disabled={full || past}
              onClick={() => {
                if (!past && !full) {
                  c.handleDayClick(key);
                }
              }}
              onMouseEnter={() => c.setHoverKey(key)}
              onMouseLeave={() => c.setHoverKey(null)}
              title={
                hasBookings
                  ? full
                    ? `Fully booked — ${bookedTooltip}`
                    : `Reserved by ${bookedTooltip} — still available`
                  : undefined
              }
              style={{
                minHeight: cellMinHeight,
                background: bg,
                color: textColor,
                border,
                borderRadius: 8,
                cursor: past || full ? "not-allowed" : "pointer",
                fontWeight: isEdge ? 800 : 500,
                fontSize: 14,
                position: "relative",
                transition: "transform 120ms ease, filter 120ms ease",
                opacity: past ? 0.45 : full ? 0.9 : 1,
                padding: "4px 3px 5px",
              }}
              className="flex flex-col items-center justify-start"
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <span className="flex items-center justify-center w-full" style={{ gap: 3 }}>
                {d}
                {isEdge && <Aperture size={9} strokeWidth={2} />}
              </span>

              {hasBookings && (
                <span
                  className="flex flex-col items-center w-full"
                  style={{ marginTop: 2, gap: 2 }}
                >
                  {bookingEntries.map((entry, entryIndex) => {
                    const isPending = entry.status === "Pending";
                    // Pending → light-blue highlight; Approved/booked → lavender highlight
                    const chipBg = isPending ? "#bde0fe" : COLORS.lavender;
                    const chipText = isPending ? "#1c4e73" : COLORS.lavenderText;

                    return (
                      <span
                        key={entryIndex}
                        title={`${entry.fullName} — ${isPending ? "Waiting for confirmation" : "Booked"}`}
                        style={{
                          fontSize: 9,
                          lineHeight: 1.25,
                          letterSpacing: "0.01em",
                          fontWeight: 700,
                          maxWidth: "100%",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          textAlign: "center",
                          background: chipBg,
                          color: chipText,
                          borderRadius: 4,
                          padding: "2px 5px",
                        }}
                      >
                      {entry.fullName} ({getCameraShortName(entry.camera)})
                      </span>
                    );
                  })}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="flex flex-wrap gap-5 mt-5 pt-4"
        style={{
          borderTop: `1px solid ${COLORS.borderSoft}`,
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
          fontSize: 12.5,
          color: COLORS.inkMuted,
        }}
      >
        <LegendDot color={COLORS.sage} label="Available slots" />
        <LegendDot color={COLORS.mustard} label="My reservation" />
        <LegendDot color="#bde0fe" label="Name: waiting for confirmation" />
        <LegendDot color={COLORS.lavender} label="Name: booked" />
        <LegendDot color={COLORS.orange} label="This day is fully reserved or booked" />
        <p>Sony A7IV (10 Availables) & Canon R5 (5 Availables) Please note that this are the available camera and just double check the day if its available.</p>
      </div>
    </div>
  );
}

/** Small circular icon button used for the previous/next month controls. */
function NavButton({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="rounded-full flex items-center justify-center transition-colors"
      style={{
        width: 34,
        height: 34,
        background: "transparent",
        border: "1px solid #DED4B4",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#E9E0C6")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </button>
  );
}