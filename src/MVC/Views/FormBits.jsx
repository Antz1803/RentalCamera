// Views/components/FormBits.jsx
// Tiny presentational helpers shared by the booking form. Pure UI, no logic.

import React from "react";

export const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #DED4B4",
  background: "#FBF8EE",
  fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
  fontSize: 14,
  color: "#2E2B22",
  outline: "none",
  boxSizing: "border-box",
};

export function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: 4,
          background: color,
          display: "inline-block",
        }}
      />
      {label}
    </div>
  );
}

export function SectionLabel({ icon, text }) {
  return (
    <div
      className="flex items-center gap-2 mb-4"
      style={{
        fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        fontSize: 11,
        letterSpacing: "0.25em",
        color: "#7A7461",
      }}
    >
      {icon}
      {text.toUpperCase()}
    </div>
  );
}

export function Field({ label, icon, children }) {
  return (
    <div className="mb-3.5">
      <div
        className="flex items-center gap-1.5 mb-1.5"
        style={{
          fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
          fontSize: 11.5,
          color: "#7A7461",
          fontWeight: 600,
        }}
      >
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}