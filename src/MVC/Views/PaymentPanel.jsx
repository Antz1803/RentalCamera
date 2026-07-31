// Views/components/PaymentPanel.jsx
// Renders validation errors, the sample-photo highlight card, and the
// "proceed to payment" submit button.

import React from "react";
import { AlignCenter, X } from "lucide-react";
import { COLORS } from "../Models/RentalModel";
import CameraHighlightCard from "./CameraHighlightCard";

export default function PaymentPanel({ c }) {
  return (
    <>
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
        onClick={c.handleProceedToPayment}
        style={{
          width: "40%",
          margin: "0 auto", 
          display: "block",  
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
        PROCEED TO SECURE PAYMENT
      </button>

      {/* Feature Highlight Card */}
      <div className="mt-3">
        <CameraHighlightCard />
      </div>
    </>
  );
}