import { FC, ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'text';
  iconAfter?: ReactNode;
  onClick?: () => void;
  className?: string;
}

const Button: FC<ButtonProps> = ({ children, variant = 'primary', iconAfter, onClick, className }) => {
  const baseStyles = "px-6 py-3 rounded-full font-medium transition-all duration-300";
  const variants = {
    primary: "bg-white text-black hover:bg-opacity-90",
    secondary: "bg-black text-white hover:bg-opacity-90",
    text: "bg-transparent text-white hover:opacity-80"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} group/button ${className || ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {children}
        {iconAfter}
      </div>
    </button>
  );
};

export default Button; 