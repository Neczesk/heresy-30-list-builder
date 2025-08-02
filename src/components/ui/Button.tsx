import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: (event?: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  fullWidth?: boolean;
  title?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  fullWidth = false,
  title,
}) => {
  const baseClass = styles['ui-button'];
  const variantClass = styles[`ui-button--${variant}`];
  const sizeClass = styles[`ui-button--${size}`];
  const widthClass = fullWidth ? styles['ui-button--full-width'] : '';
  const disabledClass = disabled ? styles['ui-button--disabled'] : '';

  const buttonClass = [
    baseClass,
    variantClass,
    sizeClass,
    widthClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
};

export default Button; 