import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline";
};

export function Button({ className, variant = "primary", ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const styles = {
    primary:
      "bg-[color:var(--naath-blue)] text-white hover:bg-[color:var(--naath-blue)]/90 focus:ring-[color:var(--naath-bronze)]",
    secondary:
      "bg-[color:var(--naath-bronze)] text-white hover:bg-[color:var(--naath-bronze)]/90 focus:ring-[color:var(--naath-blue)]",
    outline:
      "border border-[color:var(--naath-blue)] text-[color:var(--naath-blue)] hover:bg-[color:var(--naath-blue)]/5 focus:ring-[color:var(--naath-bronze)]",
  } as const;
  return <button className={clsx(base, styles[variant], className)} {...props} />;
}


