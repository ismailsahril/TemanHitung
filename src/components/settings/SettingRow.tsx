import React from 'react';

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  danger?: boolean;
}

/**
 * SettingRow component representing a single row in the settings screen.
 * Displays a label, optional description, and action controls (e.g. toggles, steppers).
 */
export const SettingRow: React.FC<SettingRowProps> = ({
  label,
  description,
  children,
  danger = false,
}) => {
  return (
    <div className="flex items-center justify-between p-4 min-h-[58px] transition-colors">
      <div className="flex flex-col pr-4 flex-1">
        <span className={`text-[15px] font-semibold leading-tight ${danger ? 'text-[#dc2626] dark:text-red-400' : 'text-[#1d1d1f] dark:text-white'}`}>
          {label}
        </span>
        {description && (
          <span className="text-xs text-ink-muted mt-0.5 leading-relaxed">
            {description}
          </span>
        )}
      </div>
      <div className="flex-shrink-0 flex items-center justify-end">
        {children}
      </div>
    </div>
  );
};
export default SettingRow;
