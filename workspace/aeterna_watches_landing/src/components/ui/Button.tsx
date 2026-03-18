import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className,
  ...props
}) => {
  let buttonClasses =
    'rounded-md py-2 px-4 font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  switch (variant) {
    case 'primary':
      buttonClasses +=
        ' bg-primary text-secondary hover:bg-neutral-800 focus:ring-neutral-700';
      break;
    case 'secondary':
      buttonClasses +=
        ' bg-secondary text-primary hover:bg-neutral-200 focus:ring-neutral-200';
      break;
    case 'accent':
      buttonClasses +=
        ' bg-accent text-primary hover:bg-goldenrod-700 focus:ring-goldenrod-700';
      break;
    default:
      buttonClasses += ' bg-primary text-secondary';
  }

  if (className) {
    buttonClasses += ` ${className}`;
  }

  return (
    <button {...props} className={buttonClasses}>
      {children}
    </button>
  );
};

export default Button;