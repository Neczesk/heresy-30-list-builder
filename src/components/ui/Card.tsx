import React from 'react';
import './Card.css';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'transparent';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  fullWidth?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
  interactive = false,
  fullWidth = false,
}) => {
  const baseClass = 'ui-card';
  const variantClass = `ui-card--${variant}`;
  const paddingClass = `ui-card--padding-${padding}`;
  const interactiveClass = interactive ? 'ui-card--interactive' : '';
  const widthClass = fullWidth ? 'ui-card--full-width' : '';

  const cardClass = [
    baseClass,
    variantClass,
    paddingClass,
    interactiveClass,
    widthClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClass}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
};

export default Card; 