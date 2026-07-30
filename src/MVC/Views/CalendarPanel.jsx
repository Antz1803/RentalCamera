// Views/components/CalendarPanel.jsx
// Renders the month calendar. All state and click handling comes from the
// controller passed in as `c` — this component only reads and displays.

import React from "react";
import { Aperture, ChevronLeft, ChevronRight } from "lucide-react";
import { COLORS, WEEKDAYS, toKey } from "../Models/RentalModel";
import { LegendDot } from "./FormBits";

export default function CalendarPanel({ c }) {
  const cellSize = "clamp(34px, 4.6vw, 46px)";

  return (
    <div
      className="rounded-xl p-5 md:p-7 mb-6"
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

      <div className="flex items-center justify-between mb-5">
        <NavButton onClick={() => c.handleMonthChange(-1)} label="Previous month">
          <ChevronLeft size={18} />
        </NavButton>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.03em" }}>
          {c.monthLabel}
        </div>
        <NavButton onClick={() => c.handleMonthChange(1)} label="Next month">
          <ChevronRight size={18} />
        </NavButton>
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

      <div className="grid grid-cols-7 gap-1.5">
        {c.grid.map((d, i) => {
          if (d === null) return <div key={i} />;
          const key = toKey(c.viewYear, c.viewMonth, d);
          const booked = c.isDateBooked(key);
          const bookedLabel = booked ? c.getBookingLabel(key) : undefined;
          const bookedStatus = booked ? c.getBookingStatus(key) : undefined;
          const isPending = bookedStatus === "Pending";
          const mine = c.isInSelectedRange(key);
          const isEdge = key === c.rangeStart || key === c.rangeEnd;

          let bg, textColor, border;
          if (booked) {
            bg = isPending ? "#bde0fe" : COLORS.lavender;
            textColor = COLORS.lavenderText;
            border = isPending
              ? `1px dashed ${COLORS.lavenderText}`
              : `1px solid ${COLORS.lavender}`;
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
              disabled={booked}
              onClick={() => c.handleDayClick(key)}
              onMouseEnter={() => c.setHoverKey(key)}
              onMouseLeave={() => c.setHoverKey(null)}
              title={
                booked
                  ? isPending
                    ? `Waiting for confirmation — ${bookedLabel ?? "reserved"}`
                    : `Booked — ${bookedLabel ?? "reserved"}`
                  : undefined
              }
              style={{
                height: cellSize,
                background: bg,
                color: textColor,
                border,
                borderRadius: 8,
                cursor: booked ? "not-allowed" : "pointer",
                fontWeight: isEdge ? 800 : 500,
                fontSize: 14,
                position: "relative",
                transition: "transform 120ms ease, filter 120ms ease",
                opacity: booked ? (isPending ? 0.7 : 0.85) : 1,
              }}
              className="flex flex-col items-center justify-center"
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.94)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {d}
              {booked && bookedLabel && (
                <span style={{ fontSize: 8, letterSpacing: "0.02em", marginTop: -2 }}>
                  {bookedLabel.split(" ")[0]}
                </span>
              )}
              {isEdge && (
                <Aperture
                  size={9}
                  style={{ position: "absolute", top: 3, right: 3 }}
                  strokeWidth={2}
                />
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
        <LegendDot color={COLORS.lavender} label="Booked" />
        <LegendDot
          color="#bde0fe"
          label="Waiting for confirmation"
          dashed
        />
      </div>
    </div>
  );
}

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