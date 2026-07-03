import React from 'react';

export default function Avatar({ src, name, size = 40, color = '#FF6B9D', className = '', ring = false }) {
  const fontSize = Math.max(11, Math.round(size * 0.4));
  const ringCls = ring ? 'ring-2 ring-white shadow-sm' : '';
  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover ${ringCls} ${className}`}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, background: color, fontSize }}
      className={`rounded-full flex items-center justify-center font-bold text-white shrink-0 ${ringCls} ${className}`}
    >
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}