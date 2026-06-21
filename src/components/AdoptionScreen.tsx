import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { PetType } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import MathPet from './MathPet';

interface AdoptionScreenProps {
  onAdopt: (type: PetType, name: string, userName: string) => Promise<void>;
}

/**
 * AdoptionScreen component letting players adopt a learning companion pet.
 * Users can first input their user name (Step 1), then scroll through available
 * pet types and assign them a custom name (Step 2).
 */
export const AdoptionScreen: React.FC<AdoptionScreenProps> = ({ onAdopt }) => {
  const { t } = useTranslation();

  const petsList: { type: PetType; defaultName: string; descKey: string }[] = [
    { type: 'cat', defaultName: 'Kiko', descKey: 'pet.catDesc' },
    { type: 'hamster', defaultName: 'Hami', descKey: 'pet.hamsterDesc' },
    { type: 'bird', defaultName: 'Piko', descKey: 'pet.birdDesc' },
    { type: 'rabbit', defaultName: 'Cici', descKey: 'pet.rabbitDesc' },
    { type: 'fox', defaultName: 'Foxy', descKey: 'pet.foxDesc' },
    { type: 'monkey', defaultName: 'Moko', descKey: 'pet.monkeyDesc' },
  ];

  // Onboarding wizard steps (1: User Name setup, 2: Pet carousel selection)
  const [step, setStep] = useState<1 | 2>(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const activePet = petsList[currentIndex];

  // Local state for the pet's custom name
  const [petName, setPetName] = useState(activePet.defaultName);
  // Local state for the user's name
  const [userName, setUserName] = useState('');

  // Gacha Summoning states
  const [isSummoning, setIsSummoning] = useState(false);
  const [summonRevealed, setSummonRevealed] = useState(false);

  // Auto-sync custom name placeholder when slide changes
  useEffect(() => {
    setPetName(petsList[currentIndex].defaultName);
  }, [currentIndex]);

  const handleNext = (): void => {
    setCurrentIndex((prev) => (prev + 1) % petsList.length);
  };

  const handlePrev = (): void => {
    setCurrentIndex((prev) => (prev - 1 + petsList.length) % petsList.length);
  };

  const handleAdopt = (): void => {
    setIsSummoning(true);
  };

  if (isSummoning) {
    return (
      <div className="flex-1 flex flex-col bg-[#0b0c16] text-white p-6 justify-between items-center select-none overflow-hidden relative">
        {/* Magic circle background overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15)_0%,transparent_70%)] pointer-events-none" />

        <div className="flex-1 flex flex-col items-center justify-center w-full relative">
          <AnimatePresence mode="wait">
            {!summonRevealed ? (
              /* Spinning Card Back */
              <m.div
                key="back"
                animate={{
                  rotateY: [0, 360, 720, 1080],
                  scale: [0.8, 1.1, 1],
                }}
                transition={{ duration: 1.8, ease: "easeInOut" }}
                onAnimationComplete={() => setSummonRevealed(true)}
                className="w-56 h-80 rounded-[20px] bg-[#161623] border-4 border-[#d4af37] flex flex-col items-center justify-center relative shadow-[0_0_40px_rgba(212,175,55,0.3)] preserve-3d"
              >
                {/* Mystic Symbol */}
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#d4af37]/60 flex items-center justify-center text-[#d4af37] text-2xl animate-spin-slow">
                  ✨
                </div>
                <div className="absolute inset-4 border border-[#d4af37]/30 rounded-[14px]" />
              </m.div>
            ) : (
              /* Revealed Card Front */
              <m.div
                key="front"
                initial={{ opacity: 0, scale: 0.8, rotateY: 180 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                className="w-56 h-80 rounded-[20px] bg-gradient-to-b from-[#2d1b4e] to-[#12072b] border-4 border-[#d4af37] flex flex-col justify-between p-4 items-center relative shadow-[0_0_50px_rgba(245,158,11,0.5)] overflow-hidden"
              >
                {/* Sparkle particles */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.25)_0%,transparent_80%)] pointer-events-none" />
                
                {/* 5-Star Indicator */}
                <div className="flex gap-0.5 justify-center mt-2 z-10">
                  {[...Array(5)].map((_, i) => (
                    <m.span 
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="text-amber-400 text-sm select-none"
                    >
                      ⭐
                    </m.span>
                  ))}
                </div>

                {/* Pet Math Mascot */}
                <div className="flex-1 flex items-center justify-center z-10">
                  <MathPet type={activePet.type} level={1} animationState="eating" className="w-36 h-36" />
                </div>

                {/* Pet Name Card Plate */}
                <div className="w-full bg-[#d4af37] text-[#12072b] py-1 rounded-[10px] text-center font-bold text-sm tracking-wide z-10 shadow-md">
                  {petName.trim() || activePet.defaultName}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>

        {/* Continue Button */}
        <div className="w-full max-w-[340px] z-10">
          <m.button
            type="button"
            disabled={!summonRevealed}
            onClick={async () => {
              const finalName = petName.trim() || activePet.defaultName;
              const finalUser = userName.trim();
              await onAdopt(activePet.type, finalName, finalUser);
            }}
            whileTap={summonRevealed ? { scale: 0.95 } : undefined}
            className={`w-full py-3 rounded-full text-[17px] font-semibold text-white flex items-center justify-center gap-1.5 min-h-[44px] ${
              summonRevealed
                ? 'bg-amber-500 hover:bg-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
            }`}
          >
            <Sparkles className="w-4.5 h-4.5" />
            {summonRevealed ? t('settings.nextButton') : t('placeholder')}
          </m.button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div 
        className="flex-1 flex flex-col bg-white dark:bg-[#1d1d1f] p-6 justify-between select-none font-gacha"
        style={{ fontSize: 'calc(1rem * var(--font-scale, 1))' }}
      >
        {/* Header */}
        <header className="text-center mt-6 flex flex-col items-center">
          <div className="w-12 h-12 bg-[#f5f5f7] dark:bg-[#272729] rounded-full flex items-center justify-center text-2xl mb-4 shadow-sm border border-[#e0e0e0] dark:border-[#2a2a2c]">
            👋
          </div>
          <h1 className="text-[24px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight font-fantasy">
            {t('pet.onboardingUserTitle')}
          </h1>
          <p className="text-[14px] text-ink-muted mt-2 px-6 leading-relaxed font-normal">
            {t('pet.onboardingUserDesc')}
          </p>
        </header>

        {/* Input Section */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-[340px] mx-auto w-full">
          <div className="flex flex-col space-y-2.5 w-full">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted pl-2">
              {t('settings.userName')}
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              maxLength={15}
              className="w-full px-5 py-3 text-[16px] bg-[#fafafc] dark:bg-[#272729] border border-[#e0e0e0] dark:border-[#2a2a2c] rounded-full focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-[#0071e3] font-normal text-[#1d1d1f] dark:text-white text-center shadow-inner"
              placeholder={t('pet.onboardingUserPlaceholder')}
              autoFocus
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full pt-4 border-t border-[#f0f0f0] dark:border-[#2a2a2c]">
          <m.button
            type="button"
            onClick={() => setStep(2)}
            disabled={!userName.trim()}
            whileTap={userName.trim() ? { scale: 0.95 } : undefined}
            className={`w-full py-3 rounded-full text-[17px] font-normal text-white flex items-center justify-center gap-1.5 min-h-[44px] max-w-[340px] mx-auto ${
              userName.trim()
                ? 'bg-[#0066cc] hover:bg-[#0066cc]/95 shadow-[0_0_15px_rgba(0,102,204,0.15)]'
                : 'bg-[#fafafc] dark:bg-[#272729] text-ink-muted border border-[#e0e0e0] dark:border-[#2a2a2c] cursor-not-allowed'
            }`}
          >
            {t('pet.onboardingNext')}
            <ChevronRight className="w-4.5 h-4.5 stroke-[2.5]" />
          </m.button>
        </div>
      </div>
    );
  }

  // Step 2: Choose Study Companion Pet
  return (
    <div 
      className="flex-1 flex flex-col bg-white dark:bg-[#1d1d1f] p-6 justify-between select-none font-gacha"
      style={{ fontSize: 'calc(1rem * var(--font-scale, 1))' }}
    >
      {/* Header */}
      <header className="relative text-center mt-2 flex flex-col items-center">
        {/* Back to Step 1 Button */}
        <m.button
          type="button"
          onClick={() => setStep(1)}
          whileTap={{ scale: 0.95 }}
          className="absolute left-0 top-0.5 min-h-[40px] min-w-[40px] p-2 bg-[#f5f5f7] dark:bg-[#272729] text-[#1d1d1f] dark:text-white rounded-full flex items-center justify-center hover:bg-[#e8e8ed] dark:hover:bg-[#323236] border border-[#e0e0e0] dark:border-[#2a2a2c]"
          aria-label={t('settings.backButton')}
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </m.button>
        <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-full flex items-center justify-center text-amber-500 mb-2">
          <Sparkles className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight font-fantasy">
          {t('pet.adoptionTitle')}
        </h1>
        <p className="text-[14px] text-ink-muted mt-1 px-4 leading-relaxed font-normal">
          {t('pet.adoptionDesc')}
        </p>
      </header>

      {/* Pet Carousel Wrapper */}
      <div className="flex-1 flex flex-col items-center justify-center my-4">
        <div className="flex items-center justify-between w-full max-w-[310px] gap-2">
          {/* Left Arrow Button */}
          <m.button
            type="button"
            onClick={handlePrev}
            whileTap={{ scale: 0.95 }}
            className="min-h-[44px] min-w-[44px] p-2 bg-[#f5f5f7] dark:bg-[#272729] text-[#1d1d1f] dark:text-white rounded-full flex items-center justify-center hover:bg-[#e8e8ed] dark:hover:bg-[#323236] border border-[#e0e0e0] dark:border-[#2a2a2c]"
            aria-label={t('settings.backButton')}
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </m.button>

          {/* Gacha-themed Character Preview Card */}
          <div className="w-40 h-52 flex flex-col justify-between items-center bg-[#fafafc] dark:bg-[#1a1a24] rounded-[20px] border-2 border-[#d4af37] p-3.5 relative shadow-[0_4px_15px_rgba(212,175,55,0.15)]">
            {/* Stars */}
            <div className="flex gap-0.5 select-none text-[10px]">
              ⭐⭐⭐⭐⭐
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <m.div
                  key={activePet.type}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="flex items-center justify-center"
                >
                  <MathPet type={activePet.type} level={1} animationState="idle" className="w-24 h-24" />
                </m.div>
              </AnimatePresence>
            </div>

            <div className="w-full py-0.5 rounded-[6px] bg-[#d4af37]/20 border border-[#d4af37]/40 text-[9px] font-bold text-center text-amber-600 dark:text-amber-400 select-none uppercase tracking-wider">
              Grade SSS
            </div>
          </div>

          {/* Right Arrow Button */}
          <m.button
            type="button"
            onClick={handleNext}
            whileTap={{ scale: 0.95 }}
            className="min-h-[44px] min-w-[44px] p-2 bg-[#f5f5f7] dark:bg-[#272729] text-[#1d1d1f] dark:text-white rounded-full flex items-center justify-center hover:bg-[#e8e8ed] dark:hover:bg-[#323236] border border-[#e0e0e0] dark:border-[#2a2a2c]"
            aria-label={t('settings.nextButton')}
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </m.button>
        </div>

        {/* Character Description */}
        <div className="mt-4 text-center max-w-[280px] min-h-[44px] flex items-center justify-center">
          <p className="text-[13px] font-normal text-ink-muted leading-normal px-2">
            {t(activePet.descKey)}
          </p>
        </div>
      </div>

      {/* Footer Adoption Form */}
      <div className="w-full flex flex-col space-y-3 pt-3 border-t border-[#f0f0f0] dark:border-[#2a2a2c]">
        {/* Pet Name Input Box */}
        <div className="flex flex-col space-y-1.5 max-w-[340px] mx-auto w-full">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted pl-1 select-none">
            {t('pet.namePlaceholder')}
          </label>
          <input
            type="text"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            maxLength={15}
            className="w-full px-4 py-2.5 text-[15px] bg-[#fafafc] dark:bg-[#272729] border border-[#e0e0e0] dark:border-[#2a2a2c] rounded-full focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-[#0071e3] font-normal text-[#1d1d1f] dark:text-white text-center shadow-inner"
            placeholder={activePet.defaultName}
          />
        </div>

        {/* Adopt CTA Button */}
        <m.button
          type="button"
          onClick={handleAdopt}
          disabled={!petName.trim()}
          whileTap={petName.trim() ? { scale: 0.95 } : undefined}
          className={`w-full py-3 rounded-full text-[17px] font-semibold text-white flex items-center justify-center gap-1.5 min-h-[44px] max-w-[340px] mx-auto transition-all ${
            petName.trim()
              ? 'bg-amber-500 hover:bg-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : 'bg-[#fafafc] dark:bg-[#272729] text-ink-muted border border-[#e0e0e0] dark:border-[#2a2a2c] cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {t('pet.adoptButton', { name: petName.trim() || activePet.defaultName })}
        </m.button>
      </div>
    </div>
  );
};

export default AdoptionScreen;
