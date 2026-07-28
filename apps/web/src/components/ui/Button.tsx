import { forwardRef, type ButtonHTMLAttributes } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "cta" | "cta-outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300",
  secondary: "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400",
  outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 disabled:text-slate-400",
  ghost: "text-slate-700 hover:bg-slate-100 disabled:text-slate-400",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
  // Reserved for purchase actions (Add to Cart / Buy Now) - never used
  // decoratively, so it always reads as "the button that buys the thing."
  cta: "bg-accent-500 text-white hover:bg-accent-600 disabled:bg-accent-200 shadow-card",
  "cta-outline": "border-2 border-accent-500 bg-white text-accent-700 hover:bg-accent-50 disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
