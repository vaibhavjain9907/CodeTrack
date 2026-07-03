/**
 * Button.
 *
 * Shared button primitive used across the app. Variants are
 * deliberately limited to what we actually use — add more only when
 * a real screen needs one, not speculatively.
 */
import { forwardRef, type ReactNode } from "react";
import { clsx } from "clsx";
import { motion, type HTMLMotionProps } from "framer-motion";
type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children?: ReactNode;
}
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 disabled:bg-brand-300 dark:bg-brand-500 dark:hover:bg-brand-400 dark:disabled:bg-brand-900 dark:disabled:text-surface-500",
  secondary:
    "bg-surface-100 text-surface-900 border border-surface-200 hover:bg-surface-200 disabled:bg-surface-50 disabled:text-surface-400 dark:bg-surface-800 dark:text-surface-50 dark:border-surface-700 dark:hover:bg-surface-700 dark:disabled:bg-surface-900 dark:disabled:text-surface-600",
  outline:
    "bg-transparent text-surface-700 border border-surface-300 hover:border-surface-400 hover:bg-surface-50 disabled:text-surface-400 disabled:border-surface-200 dark:text-surface-300 dark:border-surface-700 dark:hover:border-surface-600 dark:hover:bg-surface-900 dark:disabled:text-surface-600 dark:disabled:border-surface-800",
  ghost:
    "bg-transparent text-surface-600 hover:bg-surface-100 disabled:text-surface-300 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100 dark:disabled:text-surface-700",
  danger:
    "bg-danger text-white shadow-sm hover:bg-red-700 disabled:bg-red-300 dark:hover:bg-red-500 dark:disabled:bg-red-900 dark:disabled:text-surface-500",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", isLoading = false, disabled, className, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileTap={disabled || isLoading ? undefined : { scale: 0.97 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        className={clsx(
          "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-950",
          "disabled:cursor-not-allowed disabled:opacity-70",
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {isLoading && (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = "Button";
