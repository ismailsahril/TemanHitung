import React from 'react';
import { m } from 'framer-motion';

interface NumberStepperProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatDisplay?: (value: number) => string;
}

/**
 * NumberStepper component for settings adjustments (e.g. question counts).
 * Displays decrement and increment controls with animations.
 */
export const NumberStepper: React.FC<NumberStepperProps> = React.memo(({
  value,
  min,
  max,
  step,
  onChange,
  formatDisplay
}) => {
  const handleDecrement = (): void => {
    if (value > min) {
      onChange(value - step);
    }
  };

  const handleIncrement = (): void => {
    if (value < max) {
      onChange(value + step);
    }
  };

  const displayVal = formatDisplay ? formatDisplay(value) : String(value);

  return (
    <div className="flex items-center space-x-2 bg-[#f5f5f7] dark:bg-[#1d1d1f] border border-[#e0e0e0] dark:border-[#2a2a2c] p-0.5 rounded-full">
      {/* Decrement Button */}
      <m.button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        whileTap={value <= min ? undefined : { scale: 0.95 }}
        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-white dark:bg-[#272729] text-[#1d1d1f] dark:text-white disabled:opacity-40 disabled:pointer-events-none text-lg font-normal transition hover:bg-[#e8e8ed] dark:hover:bg-[#323236] focus:outline-none"
        aria-label="Kurangi nilai"
      >
        −
      </m.button>

      {/* Value Indicator */}
      <span className="w-16 text-center text-[15px] font-semibold text-[#1d1d1f] dark:text-white tabular-nums">
        {displayVal}
      </span>

      {/* Increment Button */}
      <m.button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        whileTap={value >= max ? undefined : { scale: 0.95 }}
        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-white dark:bg-[#272729] text-[#1d1d1f] dark:text-white disabled:opacity-40 disabled:pointer-events-none text-lg font-normal transition hover:bg-[#e8e8ed] dark:hover:bg-[#323236] focus:outline-none"
        aria-label="Tambah nilai"
      >
        +
      </m.button>
    </div>
  );
});

NumberStepper.displayName = 'NumberStepper';
export default NumberStepper;
