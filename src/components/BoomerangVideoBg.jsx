'use client';

import React, { useEffect, useRef } from 'react';

export default function BoomerangVideoBg({ src, className }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animId = 0;
    let fadeOutTimeout = null;

    const checkFade = () => {
      if (!video) return;
      const duration = video.duration || 0;
      const currentTime = video.currentTime || 0;

      if (duration > 0) {
        // Fade in over 0.5s at the start
        if (currentTime < 0.5) {
          video.style.opacity = (currentTime / 0.5).toFixed(3);
        }
        // Fade out over 0.5s before the end
        else if (duration - currentTime < 0.5) {
          video.style.opacity = Math.max(0, (duration - currentTime) / 0.5).toFixed(3);
        }
        else {
          video.style.opacity = '1';
        }
      }
      animId = requestAnimationFrame(checkFade);
    };

    const handleEnded = () => {
      video.style.opacity = '0';
      fadeOutTimeout = setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => {});
      }, 100);
    };

    video.addEventListener('ended', handleEnded);
    video.play().catch(() => {});
    animId = requestAnimationFrame(checkFade);

    return () => {
      cancelAnimationFrame(animId);
      if (fadeOutTimeout) clearTimeout(fadeOutTimeout);
      if (video) {
        video.removeEventListener('ended', handleEnded);
      }
    };
  }, [src]);

  return (
    <div className={className ?? "absolute inset-0 w-full h-full"}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        style={{ opacity: 0 }}
        muted
        autoPlay
        playsInline
        preload="auto"
      />
    </div>
  );
}
