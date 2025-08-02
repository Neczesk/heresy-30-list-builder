import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'transparent' | 'dark';
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
  const baseClass = styles['ui-card'];
  const variantClass = styles[`ui-card--${variant}`];
  const paddingClass = styles[`ui-card--padding-${padding}`];
  const interactiveClass = interactive ? styles['ui-card--interactive'] : '';
  const widthClass = fullWidth ? styles['ui-card--full-width'] : '';

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