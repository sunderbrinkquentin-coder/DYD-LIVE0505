import type * as React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { DYD_SOCIALS } from '../../config/socials';
import { InstagramIcon, LinkedinIcon, TikTokIcon } from './SocialIcons';

/**
 * Prominente "Folge DYD"-Sektion mit Instagram und TikTok.
 */
export function SocialFollowSection() {
  const cards = [
    {
      key: 'instagram',
      title: 'Instagram',
      handle: DYD_SOCIALS.instagram.handle,
      url: DYD_SOCIALS.instagram.url,
      text: 'Einblicke hinter die Kulissen, Bewerbungstipps und Updates rund um DYD.',
      Icon: InstagramIcon,
      iconBg: 'bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888]',
      iconStyle: undefined as React.CSSProperties | undefined,
      glow: 'group-hover:shadow-[0_20px_60px_rgba(220,39,67,0.25)]',
      border: 'hover:border-[#dc2743]/50',
    },
    {
      key: 'tiktok',
      title: 'TikTok',
      handle: DYD_SOCIALS.tiktok.displayName,
      url: DYD_SOCIALS.tiktok.url,
      text: 'Kurze Videos rund um Lebenslauf, Anschreiben und Karriere – direkt aufs Handy.',
      Icon: TikTokIcon,
      iconBg: 'bg-black ring-1 ring-white/15',
      iconStyle: { filter: 'drop-shadow(-1.5px -1.5px 0 #25f4ee) drop-shadow(1.5px 1.5px 0 #fe2c55)' },
      glow: 'group-hover:shadow-[0_20px_60px_rgba(37,244,238,0.18)]',
      border: 'hover:border-[#25f4ee]/40',
    },
    {
      key: 'linkedin',
      title: 'LinkedIn',
      handle: DYD_SOCIALS.linkedin.handle,
      url: DYD_SOCIALS.linkedin.url,
      text: 'News, Kooperationen und Einblicke in die Entwicklung von DYD.',
      Icon: LinkedinIcon,
      iconBg: 'bg-[#0a66c2]',
      iconStyle: undefined as React.CSSProperties | undefined,
      glow: 'group-hover:shadow-[0_20px_60px_rgba(10,102,194,0.3)]',
      border: 'hover:border-[#0a66c2]/60',
    },
  ];

  return (
    <section id="social" className="px-4 py-16 sm:px-6 lg:px-8" aria-label="DYD auf Instagram, TikTok und LinkedIn folgen">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-[#66c0b6]">Community</p>
          <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
            Folge DYD auf{' '}
            <span className="bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] bg-clip-text text-transparent">Instagram, TikTok & LinkedIn</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/60">
            Tipps für deine Bewerbung, neue Features zuerst und ein Blick hinter die Kulissen.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {cards.map((c, i) => (
            <motion.a
              key={c.key}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`group relative flex items-center gap-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.07] sm:p-7 ${c.border} ${c.glow}`}
            >
              <span className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-white ${c.iconBg}`}>
                <c.Icon className="h-8 w-8" style={c.iconStyle} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-lg font-bold text-white">
                  {c.title}
                  <ArrowUpRight className="h-4 w-4 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                </span>
                <span className="block truncate text-sm font-medium text-[#66c0b6]">{c.handle}</span>
                <span className="mt-1.5 block text-sm leading-relaxed text-white/55">{c.text}</span>
              </span>
              <span className="hidden flex-shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-bold text-black transition-transform group-hover:scale-105 sm:block lg:hidden">
                Folgen
              </span>
            </motion.a>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-white/50">
          Lieber direkt vernetzen?{' '}
          <a
            href={DYD_SOCIALS.founderLinkedin.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-[#66c0b6] hover:underline"
          >
            <LinkedinIcon className="h-3.5 w-3.5" /> Gründer Quentin Sunderbrink auf LinkedIn
          </a>
        </p>
      </div>
    </section>
  );
}
