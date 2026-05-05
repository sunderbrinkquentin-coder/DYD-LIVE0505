/**
 * Design System für konsistente UI
 * Mobile First - alle Styles optimiert für kleine Bildschirme
 */

export const designSystem = {
  // Überschriften - Mobile First mit hohem Kontrast
  headings: {
    h1: 'text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight',
    h2: 'text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight',
    h3: 'text-xl sm:text-2xl font-bold text-white leading-tight',
    h1Gradient: 'text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-[#66c0b6] to-white bg-clip-text text-transparent leading-tight',
  },

  // Buttons - Einheitlich und barrierefrei
  buttons: {
    primary: 'w-full sm:w-auto px-8 py-4 rounded-xl bg-[#66c0b6] text-black font-semibold text-base sm:text-lg hover:bg-[#57b0a6] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg',
    secondary: 'w-full sm:w-auto px-8 py-4 rounded-xl border-2 border-white/30 text-white font-semibold text-base sm:text-lg hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2',
    ghost: 'w-full sm:w-auto px-6 py-3 rounded-xl text-white/70 font-medium text-sm sm:text-base hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2',
  },

  // Input-Felder - Hoher Kontrast
  inputs: {
    text: 'w-full px-4 py-3.5 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-white/40 focus:border-[#66c0b6] focus:bg-white/15 transition-all text-base outline-none',
    textarea: 'w-full px-4 py-3.5 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-white/40 focus:border-[#66c0b6] focus:bg-white/15 transition-all text-base outline-none resize-none',
    select: 'w-full px-4 py-3.5 rounded-xl bg-white/10 border-2 border-white/20 text-white focus:border-[#66c0b6] focus:bg-white/15 transition-all text-base outline-none appearance-none cursor-pointer',
  },

  // Labels - Gut lesbar
  labels: {
    default: 'block text-sm sm:text-base font-semibold text-white mb-2',
    optional: 'block text-sm sm:text-base font-semibold text-white/80 mb-2',
    required: 'block text-sm sm:text-base font-semibold text-white mb-2 after:content-["*"] after:ml-1 after:text-[#66c0b6]',
  },

  // Cards und Container
  cards: {
    default: 'bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8',
    interactive: 'bg-white/5 backdrop-blur-md border-2 border-white/10 rounded-2xl p-6 sm:p-8 hover:border-[#66c0b6]/50 transition-all cursor-pointer',
    selected: 'bg-white/10 backdrop-blur-md border-2 border-[#66c0b6] rounded-2xl p-6 sm:p-8',
  },

  // Text - Kontrastreiche Abstufungen
  text: {
    primary: 'text-white',
    secondary: 'text-white/80',
    muted: 'text-white/60',
    accent: 'text-[#66c0b6]',
  },

  // Spacing - Mobile First
  spacing: {
    section: 'space-y-6 sm:space-y-8',
    sectionLarge: 'space-y-8 sm:space-y-10 md:space-y-12',
    container: 'px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10',
  },

  // Grid und Flexbox
  layout: {
    flexButtons: 'flex flex-col sm:flex-row gap-4 items-stretch sm:items-center',
    grid2: 'grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6',
    grid3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6',
  },
};

// Helper für Buttons mit Icons
export const buttonWithIcon = {
  primary: (hasIcon = true) =>
    `${designSystem.buttons.primary} ${hasIcon ? 'gap-3' : ''}`,
  secondary: (hasIcon = true) =>
    `${designSystem.buttons.secondary} ${hasIcon ? 'gap-3' : ''}`,
};
