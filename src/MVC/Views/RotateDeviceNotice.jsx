// Views/components/RotateDeviceNotice.jsx
// One-time popup nudging mobile visitors to rotate to landscape for a
// better layout. Shows on first load only when the viewport looks like a
// phone in portrait orientation, auto-dismisses the moment they rotate,
// and won't reappear for the rest of the browser session once dismissed
// (via sessionStorage — clears when the tab/browser is closed).

import React, { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { COLORS } from "../Models/RentalModel";

const DISMISS_KEY = "rotateNoticeDismissed";
const MOBILE_BREAKPOINT = 768; // px — narrower viewports are treated as "mobile"

export default function RotateDeviceNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alreadyDismissed = sessionStorage.getItem(DISMISS_KEY) === "true";
    if (alreadyDismissed) return;

    function checkOrientation() {
      const isMobileWidth = window.innerWidth < MOBILE_BREAKPOINT;
      const isPortrait = window.innerHeight > window.innerWidth;

      // Auto-show on mobile+portrait, auto-hide the moment they rotate
      // to landscape or resize to a wider viewport — no need to dismiss
      // manually if they just turn the phone.
      setVisible(isMobileWidth && isPortrait);
    }

    checkOrientation();

    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  function handleDismiss() {
    setVisible(false);
    sessionStorage.setItem(DISMISS_KEY, "true");
  }

  if (!visible) return null;

  return (
    <div
      onClick={handleDismiss}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        background: "rgba(22, 20, 18, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 16,
          padding: 28,
          maxWidth: 320,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          fontFamily:
            "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            margin: "0 auto 16px",
            borderRadius: "50%",
            background: COLORS.sage,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "rotate-hint 1.6s ease-in-out infinite",
          }}
        >
          <Smartphone size={26} color={COLORS.sageText} strokeWidth={1.8} />
        </div>

        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: COLORS.ink,
            marginBottom: 8,
          }}
        >
          Rotate your phone for the best view
        </div>

        <p
          style={{
            fontSize: 13.5,
            color: COLORS.inkMuted,
            lineHeight: 1.6,
            marginBottom: 20,
            fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
          }}
        >
          The calendar and booking form fit better in landscape mode on
          smaller screens. Turn your device sideways for a smoother
          experience.
        </p>

        <button
          onClick={handleDismiss}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 10,
            background: COLORS.olive,
            color: "#F3EFD8",
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
            cursor: "pointer",
          }}
        >
          Got it
        </button>
      </div>

      <style>{`
        @keyframes rotate-hint {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-90deg); }
        }
      `}</style>
    </div>
  );
}