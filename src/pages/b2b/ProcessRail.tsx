import { motion } from 'framer-motion';

type ProcessStep = { title: string; desc: string };

type ProcessRailProps = {
  steps: readonly ProcessStep[];
};

export default function ProcessRail({ steps }: ProcessRailProps) {
  return (
    <div className="w-full py-8">
      {/* Desktop horizontal */}
      <div className="hidden md:block relative">
        {/* Gradient line */}
        <div
          className="absolute top-7 left-0 right-0 h-[3px] rounded-full"
          style={{
            background: 'linear-gradient(90deg, #38BDF8, #DEFF9A)',
            boxShadow: '0 0 12px rgba(56,189,248,0.4), 0 0 24px rgba(222,255,154,0.2)',
          }}
        />
        <div className="relative flex justify-between">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="flex flex-col items-center text-center"
              style={{ width: `${100 / steps.length}%` }}
            >
              {/* Numbered node */}
              <div
                className="relative w-14 h-14 rounded-full flex items-center justify-center font-poppins font-black text-lg z-10"
                style={{
                  background: '#0A192F',
                  border: '2px solid #38BDF8',
                  boxShadow: '0 0 16px rgba(56,189,248,0.3)',
                }}
              >
                <span className="text-[#DEFF9A]">{i + 1}</span>
              </div>
              <div className="mt-4 px-2">
                <p className="font-poppins font-bold text-sm text-white mb-1">{step.title}</p>
                <p className="font-arimo text-xs text-white/50 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile vertical */}
      <div className="md:hidden relative pl-8">
        <div
          className="absolute left-3 top-2 bottom-2 w-[3px] rounded-full"
          style={{
            background: 'linear-gradient(180deg, #38BDF8, #DEFF9A)',
            boxShadow: '0 0 12px rgba(56,189,248,0.3)',
          }}
        />
        <div className="space-y-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="relative flex items-start gap-4"
            >
              <div
                className="absolute -left-8 w-10 h-10 rounded-full flex items-center justify-center font-poppins font-black text-sm z-10"
                style={{
                  background: '#0A192F',
                  border: '2px solid #38BDF8',
                  boxShadow: '0 0 12px rgba(56,189,248,0.3)',
                }}
              >
                <span className="text-[#DEFF9A]">{i + 1}</span>
              </div>
              <div className="pt-1">
                <p className="font-poppins font-bold text-sm text-white mb-0.5">{step.title}</p>
                <p className="font-arimo text-xs text-white/50">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
