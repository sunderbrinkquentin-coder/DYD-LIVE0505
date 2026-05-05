import { ButtonHTMLAttributes, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: LucideIcon;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'medium',
  icon: Icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-300 flex items-center gap-2 justify-center';

  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-hover button-shadow hover-glow',
    secondary: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:bg-opacity-10',
    ghost: 'bg-transparent text-text-secondary hover:bg-white hover:bg-opacity-5',
  };

  const sizeStyles = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'large' ? 24 : size === 'small' ? 16 : 20} />}
      {children}
    </button>
  );
}
