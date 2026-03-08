import { type ReactNode, type ButtonHTMLAttributes } from 'react';

interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  label?: string;
}

export function ToolbarButton({ children, label, disabled, className = '', ...props }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      {...props}
      disabled={disabled}
      className={`
        flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-md
        kg-text-muted transition-all duration-150 text-left
        ${disabled
          ? 'opacity-30 cursor-not-allowed'
          : 'kg-hover hover:!text-[var(--kg-text)] active:scale-[0.98]'
        }
        ${className}
      `}
    >
      <span className="flex items-center justify-center w-5 h-5 shrink-0">{children}</span>
      {label && <span className="text-[11px] font-medium truncate">{label}</span>}
    </button>
  );
}
