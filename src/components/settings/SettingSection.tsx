import React from 'react';

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * SettingSection component wrapping multiple SettingRow items.
 * Uses styling matching Apple's grouped settings view.
 */
export const SettingSection: React.FC<SettingSectionProps> = ({ title, children }) => {
  return (
    <section className="mb-6 px-4">
      <h2 className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-2 pl-1">
        {title}
      </h2>
      <div className="bg-white dark:bg-[#272729] border border-[#e0e0e0] dark:border-[#2a2a2c] rounded-[18px] overflow-hidden divide-y divide-[#f0f0f0] dark:divide-[#2a2a2c]">
        {children}
      </div>
    </section>
  );
};
export default SettingSection;
