import React from 'react';
import { m } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import splashImage from '../assets/splash.png';

/**
 * SplashScreen component displayed when the application loads.
 * Features a modern 3D artwork, dynamic entry animations, and a smooth iOS-style loading progress bar.
 */
export const SplashScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div 
      className="flex-1 flex flex-col items-center justify-between p-8 bg-white dark:bg-[#1d1d1f] select-none animate-fade-in"
      style={{ fontSize: 'calc(1rem * var(--font-scale, 1))' }}
    >
      {/* Top spacing / decoration */}
      <div className="h-10" />

      {/* Center Logo & Title */}
      <div className="flex flex-col items-center text-center">
        {/* Animated Artwork (iOS Squircle Icon shape) */}
        <m.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
          className="w-44 h-44 rounded-[32px] overflow-hidden border border-[#e0e0e0] dark:border-[#2a2a2c] relative"
          style={{ boxShadow: 'rgba(0, 0, 0, 0.08) 0px 8px 24px' }}
        >
          <img 
            src={splashImage} 
            alt="TemanHitung Logo" 
            className="w-full h-full object-cover"
          />
        </m.div>

        {/* Title */}
        <m.h1
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, type: 'spring', damping: 15 }}
          className="text-3xl font-bold text-[#1d1d1f] dark:text-white tracking-tight mt-6"
        >
          TemanHitung
        </m.h1>

        {/* Subtitle */}
        <m.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', damping: 15 }}
          className="text-sm font-medium text-ink-muted mt-2 px-4 leading-normal"
        >
          {t('pet.splashSubtitle')}
        </m.p>

        {/* iOS-Style Loading Progress Bar */}
        <div className="w-40 h-1 bg-[#e0e0e0] dark:bg-[#333333] rounded-full overflow-hidden mt-8">
          <m.div 
            className="bg-[#0066cc] dark:bg-[#2997ff] h-full rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Bottom Version / Brand Info */}
      <footer className="text-center">
        <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-widest">
          v1.1.0
        </span>
      </footer>
    </div>
  );
};

export default SplashScreen;
