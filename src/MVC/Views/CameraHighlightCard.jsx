import React, { useEffect, useState } from 'react';
import { RefreshCw, Camera, Maximize2, X, Aperture, ImageOff } from 'lucide-react';

const AUTO_SHUFFLE_INTERVAL_MS = 6000;

/**
 * Sample-shot highlight card. `photos` is the live array from
 * settings/highlightPhotos (see RentalController.js's highlightPhotos),
 * editable from the MAUI staff app — this component no longer owns any
 * hardcoded gallery data itself.
 */
export default function CameraHighlightCard({ photos = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(null);

  // If the live photo list shrinks (an entry gets deleted via the MAUI
  // app) and the current index no longer points at a real photo, snap
  // back to the first one instead of rendering undefined.
  useEffect(() => {
    if (currentIndex >= photos.length) {
      setCurrentIndex(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length]);

  // Shuffle to another sample photo (used by both the button and the
  // automatic timer below, so they behave identically)
  const handleNextPhoto = () => {
    if (photos.length <= 1) return;

    setIsRefreshing(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => {
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * photos.length);
        } while (nextIndex === prevIndex);
        return nextIndex;
      });
      setIsRefreshing(false);
    }, 180);
  };

  // Auto-shuffle on a timer. Paused while the fullscreen preview is open
  // so the photo doesn't change out from under someone looking at it.
  useEffect(() => {
    if (isPreviewOpen || photos.length <= 1) return;

    const interval = setInterval(() => {
      handleNextPhoto();
    }, AUTO_SHUFFLE_INTERVAL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreviewOpen, photos.length]);

  // Nothing to show yet — either Firebase hasn't sent its first snapshot,
  // or the gallery is genuinely empty (no photos added via the MAUI app).
  if (photos.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col min-h-[240px]">
        <div className="relative overflow-hidden bg-white/95 backdrop-blur-sm p-3.5 rounded-xl border border-[#E3DCCE] shadow-sm w-full flex-1 flex flex-col items-center justify-center gap-2 text-center">
          <ImageOff className="w-6 h-6 text-[#8B7355]" />
          <p className="text-xs text-[#6B5E4C]">No highlight photos yet.</p>
        </div>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col min-h-0">
      {/* Sample Highlight Card */}
      <div className="relative overflow-hidden bg-white/95 backdrop-blur-sm p-3.5 rounded-xl border border-[#E3DCCE] shadow-sm transition-all duration-300 w-full flex flex-col">
        
        {/* Aesthetic Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C5A059] via-[#8B7355] to-[#3B4A3F]" />

        {/* Header */}
        <div className="flex items-center justify-between gap-2 pt-1 mb-2.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-[#3B4A3F]" />
            <span className="text-[10px] font-bold tracking-wider uppercase bg-[#F0EAE1] text-[#6B5E4C] px-2 py-0.5 rounded-full">
              {currentPhoto.tag}
            </span>
          </div>

          {photos.length > 1 && (
            <button 
              type="button"
              onClick={handleNextPhoto}
              className="flex items-center gap-1 text-[11px] font-medium text-[#6B5E4C] hover:text-[#3B4A3F] hover:bg-[#FAF7F0] px-2 py-1 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#3B4A3F]' : ''}`} />
              <span>Shuffle Shot</span>
            </button>
          )}
        </div>

        {/* Captured Image Preview Area */}
        <div className="relative aspect-[4/3] min-h-[120px] w-full rounded-lg overflow-hidden border border-[#E8E2D5] group">
          <img 
            src={currentPhoto.imageUrl} 
            alt={currentPhoto.title} 
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />

          {/* Expand Fullscreen Button */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/75 text-white rounded-lg backdrop-blur-xs transition-opacity opacity-80 group-hover:opacity-100 cursor-pointer z-10"
            title="Expand Photo"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Overlay Photo Details */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-white">
            <div className="flex justify-between items-end">
              <div>
                <h4 className="text-xs font-bold leading-snug drop-shadow-xs">
                  {currentPhoto.title}
                </h4>
                <p className="text-[10px] text-gray-300 font-mono mt-0.5 flex items-center gap-1">
                  <Aperture className="w-3 h-3 text-[#C5A059]" />
                  {currentPhoto.settings}
                </p>
              </div>
              <span className="text-[10px] text-gray-300 font-mono">
                {currentPhoto.photographer}
              </span>
            </div>
          </div>
        </div>

        {/* Lens Details Footer */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#5C5C5E] shrink-0">
          <span className="font-medium text-[#2C2C2E] truncate">
            📷 {currentPhoto.cameraModel} • {currentPhoto.lens}
          </span>
        </div>

      </div>

      {/* Fullscreen Modal Preview */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className="relative max-w-[90vw] bg-[#1C1C1E] rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            style={previewWidth ? { width: `${previewWidth}px` } : undefined}
          >
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={currentPhoto.imageUrl} 
              alt={currentPhoto.title} 
              onLoad={(event) => {
                const image = event.currentTarget;
                const maxWidth = window.innerWidth * 0.9;
                const maxHeight = window.innerHeight * 0.75;
                const scale = Math.min(
                  maxWidth / image.naturalWidth,
                  maxHeight / image.naturalHeight,
                  1
                );
                setPreviewWidth(Math.round(image.naturalWidth * scale));
              }}
              className="block w-full h-auto"
            />
            <div className="p-4 text-white bg-[#1C1C1E]">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-bold">{currentPhoto.title}</h3>
                <span className="text-xs text-[#C5A059] font-mono">{currentPhoto.photographer}</span>
              </div>
              <p className="text-xs text-gray-400 font-mono">
                {currentPhoto.cameraModel} | {currentPhoto.lens} | {currentPhoto.settings}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
