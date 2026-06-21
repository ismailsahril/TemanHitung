import React from 'react';
import { m } from 'framer-motion';
import { Delete } from 'lucide-react';
import { ImpactStyle } from '@capacitor/haptics';
import { triggerHaptic } from '../utils/hapticEngine';

interface NumPadProps {
  onInput: (digit: string) => void;
  onDelete: () => void;
  onToggleSign: () => void;
  disableSign?: boolean;
  isDecimalMode?: boolean;
  hapticEnabled: boolean;
}

export const NumPad: React.FC<NumPadProps> = React.memo(({
  onInput,
  onDelete,
  onToggleSign,
  disableSign = false,
  isDecimalMode = false,
  hapticEnabled
}) => {
  const handleTap = (action: () => void): void => {
    triggerHaptic(ImpactStyle.Light, hapticEnabled);
    action();
  };

  // Keyboard layout digits helper
  const numpadKeys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3']
  ];

  return (
    <div 
      className="w-full grid grid-cols-3 gap-3 p-1 max-w-[340px] mx-auto select-none"
      role="group"
      aria-label="Tombol Angka Matematika"
    >
      {/* Rows 1-3: Numbers 1-9 */}
      {numpadKeys.map((row) =>
        row.map((digit) => (
          <m.button
            key={digit}
            type="button"
            onClick={() => handleTap(() => onInput(digit))}
            whileTap={{ scale: 0.95 }}
            className="min-h-[46px] rounded-[14px] bg-white dark:bg-[#1a1a24] border border-neutral-300/50 dark:border-[#d4af37]/20 hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:text-amber-500 text-[24px] font-bold text-[#1d1d1f] dark:text-white flex items-center justify-center transition shadow-[0_2px_4px_rgba(0,0,0,0.02)] focus:outline-none font-fantasy"
            aria-label={`Angka ${digit}`}
          >
            {digit}
          </m.button>
        ))
      )}

      {/* Row 4: Bottom Row (Sign Toggle / Decimal Point, 0, Backspace) */}
      
      {/* 1. Sign Toggle (±) or Decimal Point (.) depending on Mode */}
      {isDecimalMode ? (
        <m.button
          type="button"
          onClick={() => handleTap(() => onInput('.'))}
          whileTap={{ scale: 0.95 }}
          className="min-h-[46px] rounded-[14px] bg-white dark:bg-[#1a1a24] border border-neutral-300/50 dark:border-[#d4af37]/20 hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:text-amber-500 text-[24px] font-bold text-[#1d1d1f] dark:text-white flex items-center justify-center transition shadow-[0_2px_4px_rgba(0,0,0,0.02)] focus:outline-none font-fantasy"
          aria-label="Koma desimal"
        >
          ,
        </m.button>
      ) : (
        <m.button
          type="button"
          disabled={disableSign}
          onClick={() => handleTap(onToggleSign)}
          whileTap={disableSign ? undefined : { scale: 0.95 }}
          className="min-h-[46px] rounded-[14px] bg-white dark:bg-[#1a1a24] border border-neutral-300/50 dark:border-[#d4af37]/20 hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:text-amber-500 text-[20px] font-bold text-[#1d1d1f] dark:text-white flex items-center justify-center transition disabled:opacity-30 disabled:pointer-events-none shadow-[0_2px_4px_rgba(0,0,0,0.02)] focus:outline-none font-fantasy"
          aria-label="Ubah tanda positif negatif"
        >
          ±
        </m.button>
      )}

      {/* 2. Zero Key */}
      <m.button
        type="button"
        onClick={() => handleTap(() => onInput('0'))}
        whileTap={{ scale: 0.95 }}
        className="min-h-[46px] rounded-[14px] bg-white dark:bg-[#1a1a24] border border-neutral-300/50 dark:border-[#d4af37]/20 hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:text-amber-500 text-[24px] font-bold text-[#1d1d1f] dark:text-white flex items-center justify-center transition shadow-[0_2px_4px_rgba(0,0,0,0.02)] focus:outline-none font-fantasy"
        aria-label="Angka 0"
      >
        0
      </m.button>

      {/* 3. Delete Key */}
      <m.button
        type="button"
        onClick={() => handleTap(onDelete)}
        whileTap={{ scale: 0.95 }}
        className="min-h-[46px] rounded-[14px] bg-neutral-100 dark:bg-[#20202d] border border-neutral-300/40 dark:border-[#d4af37]/35 text-[#1d1d1f] dark:text-white flex items-center justify-center transition hover:border-red-500/50 hover:text-red-500 focus:outline-none"
        aria-label="Hapus digit terakhir"
      >
        <Delete className="w-6 h-6" />
      </m.button>
    </div>
  );
});

NumPad.displayName = 'NumPad';
export default NumPad;
