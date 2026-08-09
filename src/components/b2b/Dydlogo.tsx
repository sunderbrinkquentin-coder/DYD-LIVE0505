import { useId } from 'react';

const PATH =
  'M1001.6,427.62l-141.42,141.42c-7.33,7.33-19.87,2.14-19.87-8.23v-74.33c0-4.92-4.07-8.92-8.99-8.73-123.82,4.74-223.11,106.94-223.11,231.91v134.27c0,17.93-14.54,32.47-32.47,32.47h-71.47c-17.93,0-32.47-14.54-32.47-32.47v-134.27c0-124.97-99.28-227.17-223.11-231.91-4.92-.19-8.99,3.8-8.99,8.73v74.33c0,10.37-12.54,15.56-19.87,8.23l-141.42-141.42c-4.54-4.55-4.54-11.91,0-16.47l141.42-141.42c7.33-7.33,19.87-2.14,19.87,8.23v74.62c0,4.73,3.78,8.6,8.52,8.71,89.88,2.14,174.07,38.14,237.87,101.95,21.08,21.08,39.11,44.37,53.91,69.36,14.79-24.99,32.83-48.28,53.91-69.36,63.8-63.81,147.99-99.82,237.87-101.95,4.74-.12,8.52-3.99,8.52-8.71v-74.62c0-10.37,12.54-15.56,19.87-8.23l141.42,141.42c4.54,4.55,4.54,11.91,0,16.47Z';

type Variant = 'white' | 'brand' | 'gradient';

export function DydLogo({ className, variant = 'white' }: { className?: string; variant?: Variant }) {
  const raw = useId().replace(/:/g, '');
  const gradId = `dyd-${raw}`;

  if (variant === 'white') {
    return (
      <svg viewBox="0 0 1080 1080" className={className} role="img" aria-label="DYD Logo">
        <path fill="#FFFFFF" d={PATH} />
        <circle fill="#FFFFFF" cx="540" cy="280.13" r="76.53" />
      </svg>
    );
  }

  const stops: [string, string][] =
    variant === 'gradient'
      ? [['0', '#66c0b6'], ['1', '#DEFF9A']]
      : [['0.08', '#2d5365'], ['0.94', '#66c0b6']];
  const circleFill = variant === 'gradient' ? '#66c0b6' : '#2d5365';

  return (
    <svg viewBox="0 0 1080 1080" className={className} role="img" aria-label="DYD Logo">
      <defs>
        <linearGradient id={gradId} x1="75" y1="571.35" x2="1005" y2="571.35" gradientUnits="userSpaceOnUse">
          {stops.map(([off, col]) => (
            <stop key={off} offset={off} stopColor={col} />
          ))}
        </linearGradient>
      </defs>
      <path fill={`url(#${gradId})`} d={PATH} />
      <circle fill={circleFill} cx="540" cy="280.13" r="76.53" />
    </svg>
  );
}

export default DydLogo;