// Views/ReceiptModal.jsx
// Modal shown after a successful reservation: a shareable/downloadable
// receipt card with the booking details and system reference number.

import React, { useRef, useState } from "react";
import {
  Calendar,
  Camera,
  Check,
  Copy,
  Download,
  MapPin,
  Phone,
  User,
  X,
  Sparkles,
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import {
  COLORS,
  calculateRentalPrice,
  formatDisplayDate,
} from "../Models/RentalModel";

export default function ReceiptModal({ c }) {
  const total = calculateRentalPrice(c.camera, c.days);
  const receiptCardRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  /** Copy the system reference number to the clipboard and briefly show a "Copied" confirmation. */
  const handleCopyRef = () => {
    if (!c.systemRefNo) return;
    navigator.clipboard.writeText(c.systemRefNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Render the receipt card to a PNG and trigger a direct file download.
   * Always saves a file directly — no Web Share API branch, since a
   * button labeled "Download" shouldn't sometimes open a share sheet
   * instead of actually saving the file.
   */
  const handleDownloadPNG = async () => {
    if (!receiptCardRef.current) return;

    setIsDownloading(true);

    try {
      const canvas = await html2canvas(receiptCardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: COLORS.card || "#FAF8F5",
        ignoreElements: (element) => element.hasAttribute("data-html2canvas-ignore"),
      });

      canvas.toBlob((blob) => {
        if (!blob) {
          console.error("[ReceiptModal] canvas.toBlob returned null — likely a tainted canvas.");
          alert("Failed to render image canvas.");
          setIsDownloading(false);
          return;
        }

        const fileName = `Receipt-${c.systemRefNo || Date.now()}.png`;
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        setIsDownloading(false);
      }, "image/png");
    } catch (err) {
      console.error("[ReceiptModal] Canvas download failure:", err);
      alert("Unable to generate receipt image automatically. Please take a screenshot.");
      setIsDownloading(false);
    }
  };

  return (
    <div
      onClick={c.handleCloseReceipt}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      style={{
        background: "rgba(22, 20, 18, 0.78)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm flex flex-col my-auto transition-all duration-300"
        style={{ maxHeight: "94vh" }}
      >
        {/* Top Floating Control Bar */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span
              className="text-[11px] font-semibold tracking-[0.2em] text-stone-300 uppercase"
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              Reservation Voucher
            </span>
          </div>
          <button
            onClick={c.handleCloseReceipt}
            aria-label="Close receipt"
            className="w-8 h-8 flex items-center justify-center rounded-full text-stone-300 hover:text-white bg-stone-800/80 hover:bg-stone-700/80 transition-all active:scale-95 border border-stone-700/50 shadow-sm"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable Receipt Container with Custom Sleek Scrollbar */}
        <div className="overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-stone-700/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          {/* RECEIPT CARD */}
          <div
            ref={receiptCardRef}
            className="rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-stone-200/60"
            style={{ background: COLORS.card || "#FAF8F5" }}
          >
            {/* Header / Brand Section */}
            <div className="flex flex-col items-center text-center pb-5 mb-5 border-b border-stone-300/60 relative">
              <div
                className="w-12 h-12 flex items-center justify-center rounded-2xl mb-3 shadow-sm border border-stone-300/50"
                style={{
                  background: COLORS.sage || "#E3E8DC",
                  color: COLORS.sageText || "#2A3828",
                }}
              >
                <Check size={22} strokeWidth={2.5} />
              </div>

              <h2
                className="text-2xl font-bold tracking-tight"
                style={{
                  fontFamily: "'Georgia', 'Iowan Old Style', serif",
                  color: COLORS.ink || "#1C1917",
                }}
              >
                J&M
              </h2>
              <p
                className="text-[11px] font-semibold tracking-widest uppercase mt-0.5"
                style={{
                  color: COLORS.inkMuted || "#78716C",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                 Hub &amp; Equipment Rentals
              </p>
            </div>

            {/* Personalized Confirmation Note */}
            <div
              className="mb-5 p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs"
              style={{ background: "#F3EFEA" }}
            >
              <div className="flex items-center gap-1.5 mb-1 text-amber-900/70">
                <Sparkles size={13} />
                <span className="text-[10px] font-bold tracking-widest uppercase font-sans">
                  Booking Confirmed
                </span>
              </div>
              <p className="text-xs leading-relaxed text-stone-700 font-sans">
                Thank you,{" "}
                <strong className="text-stone-900 font-semibold">
                  {c.fullName ? c.fullName.split(" ")[0] : "Renter"}
                </strong>
                ! Your camera reservation has been logged and is ready for processing.
              </p>
            </div>

            {/* Detail Rows */}
            <div className="space-y-3.5 mb-5">
              <ReceiptRow icon={<User size={14} />} label="Renter" value={c.fullName} />
              <ReceiptRow icon={<Phone size={14} />} label="Contact" value={c.contact} />
              <ReceiptRow icon={<Camera size={14} />} label="Equipment" value={c.camera} />
              <ReceiptRow
                icon={<Calendar size={14} />}
                label="Dates"
                value={`${formatDisplayDate(c.rangeStart)} – ${formatDisplayDate(c.rangeEnd)} (${c.days} day${c.days > 1 ? "s" : ""})`}
              />
              <ReceiptRow
                icon={<MapPin size={14} />}
                label={c.deliveryChoice || "Fulfillment"}
                value={c.deliveryAddress}
              />
            </div>

            {/* Reference Number Banner */}
            <div
              className="my-5 p-3.5 rounded-2xl flex items-center justify-between border relative overflow-hidden"
              style={{
                background: "#EFECE6",
                borderColor: COLORS.border || "#D6D3D1",
              }}
            >
              <div>
                <span className="block text-[9px] font-bold tracking-widest text-stone-500 uppercase font-sans">
                  SYSTEM REF NO.
                </span>
                <span
                  className="text-base font-bold tracking-widest mt-0.5 block font-mono"
                  style={{ color: COLORS.oliveDark || "#292524" }}
                >
                  {c.systemRefNo || "LSR-PENDING"}
                </span>
              </div>

              <button
                onClick={handleCopyRef}
                data-html2canvas-ignore="true"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium shadow-xs transition-all active:scale-95 hover:bg-white"
                style={{
                  background: "#FAF8F5",
                  borderColor: "#D6D3D1",
                  color: "#1C1917",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {copied ? (
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <Check size={12} strokeWidth={3} />
                    Copied
                  </span>
                ) : (
                  <>
                    <Copy size={12} className="text-stone-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Verification Status */}
            <div className="flex items-center justify-between py-2 border-t border-dashed border-stone-300">
              <span className="text-xs text-stone-500 font-sans">Status</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-amber-100 text-amber-800 border border-amber-200/70 font-sans">
                Pending Verification
              </span>
            </div>

            {/* Total Amount Footer */}
            <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-stone-800/10">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 font-sans">
                Total Amount
              </span>
              <span
                className="text-2xl font-bold tracking-tight"
                style={{
                  fontFamily: "'Georgia', 'Iowan Old Style', serif",
                  color: COLORS.oliveDark || "#1C1917",
                }}
              >
                ₱{total.toLocaleString()}
              </span>
            </div>

            {/* Attached Payment Screenshot */}
            {c.uploadedPhotoUrl && (
              <div className="mt-5 pt-4 border-t border-dashed border-stone-300">
                <span className="block text-[11px] font-medium text-stone-500 mb-2 font-sans">
                  Payment Screenshot Attachment:
                </span>

                <div className="rounded-xl overflow-hidden border border-stone-300/80 shadow-2xs">
                  <img
                    src={c.uploadedPhotoUrl}
                    data-html2canvas-ignore="true"
                    alt="Proof of payment"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="text-[10px] text-center p-2 rounded-lg bg-stone-200/50 text-stone-600 font-mono mt-2">
                  [ Payment Screenshot Attached ]
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Outer Action Buttons */}
        <div className="mt-4 flex flex-col gap-2 font-sans">
          <button
            onClick={handleDownloadPNG}
            disabled={isDownloading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl shadow-lg transition-all active:scale-98 font-semibold text-sm disabled:opacity-70 hover:brightness-110"
            style={{
              background: "#2A2723",
              color: "#F5F2EB",
              border: "none",
              cursor: isDownloading ? "not-allowed" : "pointer",
            }}
          >
            <Download size={16} />
            {isDownloading ? "Generating Receipt..." : "Download Receipt (.PNG)"}
          </button>

          <button
            onClick={c.handleCloseReceipt}
            className="w-full py-3 px-4 rounded-2xl transition-all active:scale-98 font-bold text-xs tracking-widest uppercase hover:brightness-105"
            style={{
              background: COLORS.olive || "#3F4935",
              color: "#F5F2EB",
              border: "none",
              cursor: "pointer",
            }}
          >
            Done — Book Another
          </button>
        </div>
      </div>
    </div>
  );
}

/** Single label/value row used inside the receipt card (e.g. "Renter — Jane Doe"). */
function ReceiptRow({ icon, label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs leading-snug font-sans">
      <div className="flex items-center gap-1.5 text-stone-500 shrink-0 font-medium">
        <span className="text-stone-400">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="font-semibold text-stone-800 text-right break-words max-w-[60%]">
        {value || "—"}
      </div>
    </div>
  );
}