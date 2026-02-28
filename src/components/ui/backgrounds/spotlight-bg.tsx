import { motion } from 'framer-motion';
import { sanitizeColor, clampNumber } from './types';

interface Props {
  settings: Record<string, unknown>;
}

export default function SpotlightBg({ settings }: Props) {
  const spotlightColor = sanitizeColor(settings.spotlightColor, '#818cf8');
  const spotlightSize = clampNumber(settings.spotlightSize, 100, 1000, 400);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute"
        animate={{
          x: ['-20%', '120%', '-20%'],
          y: ['-10%', '80%', '-10%'],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          width: spotlightSize,
          height: spotlightSize,
          background: `radial-gradient(circle, ${spotlightColor}40 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(60px)',
        }}
      />
      <motion.div
        className="absolute"
        animate={{
          x: ['120%', '-20%', '120%'],
          y: ['80%', '-10%', '80%'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          width: spotlightSize * 0.8,
          height: spotlightSize * 0.8,
          background: `radial-gradient(circle, ${spotlightColor}30 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(80px)',
        }}
      />
    </div>
  );
}
