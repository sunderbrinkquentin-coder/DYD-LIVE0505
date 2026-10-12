/**
 * Zentrale Social-Media-Links von DYD.
 * Handle/URL nur hier ändern – Landingpage, Footer, Menüs und Follow-Pop-up lesen von hier.
 */
export const DYD_SOCIALS = {
  instagram: {
    label: 'Instagram',
    handle: '@dyd_harmony',
    url: 'https://www.instagram.com/dyd_harmony',
  },
  tiktok: {
    label: 'TikTok',
    // TODO: sobald der TikTok-Nutzername geändert ist (z. B. @decideyourdream), hier anpassen
    handle: '@user7381390238054',
    displayName: 'DYD auf TikTok',
    url: 'https://www.tiktok.com/@user7381390238054',
  },
  linkedin: {
    label: 'LinkedIn',
    handle: 'Decide your Dream',
    url: 'https://www.linkedin.com/company/decideyourdream',
  },
  founderLinkedin: {
    label: 'LinkedIn',
    handle: 'Quentin Sunderbrink',
    url: 'https://www.linkedin.com/in/quentin-sunderbrink',
  },
} as const;
