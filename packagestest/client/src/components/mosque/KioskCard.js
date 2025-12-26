import React from 'react';

/**
 * KioskCard - Touch-optimized card component for selections
 *
 * Supports both:
 * - New props: titleNl/titleEn/titleAr + image
 * - Legacy props: title/subtitle/subtitleNl/subtitleAr + icon
 */
const KioskCard = ({
  // New-style props (used in your mosque pages)
  titleNl,
  titleEn,
  titleAr,
  image,

  // Legacy props (older usage)
  title,
  subtitle,
  subtitleNl,
  subtitleAr,
  icon,

  onClick,
  selected = false,
  className = '',
  children
}) => {
  // Normalize inputs so your existing pages work without changes
  const nl = titleNl ?? title ?? '';
  const en = titleEn ?? subtitle ?? '';
  const ar = titleAr ?? subtitleAr ?? '';

  const img = image ?? (typeof icon === 'string' ? icon : null);
  const iconNode = !img ? icon : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full
        rounded-[38px]
        bg-white/95
        shadow-[0_18px_40px_rgba(0,0,0,0.22)]
        border-[3px]
        ${selected ? 'border-green-600' : 'border-white/70'}
        hover:shadow-[0_22px_50px_rgba(0,0,0,0.28)]
        active:scale-[0.99]
        transition
        px-10 py-10
        min-h-[420px]
        flex flex-col items-center justify-start
        ${className}
      `}
    >
      {/* ICON/IMAGE */}
      <div className="w-full flex items-center justify-center">
        {img ? (
          <img
            src={img}
            alt={nl || en || 'option'}
            className="
              w-[260px] h-[260px]
              object-contain
            "
          />
        ) : iconNode ? (
          <div className="text-7xl">{iconNode}</div>
        ) : null}
      </div>

      {/* TEXTS */}
      <div className="mt-8 w-full text-center">
        {nl ? (
          <div className="text-4xl font-extrabold text-black tracking-wide">
            {nl}
          </div>
        ) : null}

        {en ? (
          <div className="text-3xl font-bold text-gray-700 mt-3">
            {en}
          </div>
        ) : null}

        {ar ? (
          <div className="text-4xl font-extrabold text-gray-800 mt-4" dir="rtl">
            {ar}
          </div>
        ) : null}
      </div>

      {/* optional extra content */}
      {children ? <div className="mt-6 w-full">{children}</div> : null}
    </button>
  );
};

export default KioskCard;
