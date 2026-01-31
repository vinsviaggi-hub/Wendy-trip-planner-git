import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

const base =
  "inline-flex items-center justify-center rounded-xl font-semibold transition " +
  "focus:outline-none focus:ring-2 focus:ring-accent/35 focus:ring-offset-0 " +
  "disabled:opacity-50 disabled:pointer-events-none select-none " +
  "active:translate-y-[0.5px]";

const variants: Record<NonNullable<Props["variant"]>, string> = {
  // CTA forte, premium
  primary:
    "text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)] " +
    "bg-gradient-to-r from-accent to-accent2 hover:opacity-95 " +
    "ring-1 ring-white/10",

  // Pulsante “glass” per dark UI (non bianco)
  secondary:
    "text-slate-100 shadow-[0_18px_45px_rgba(0,0,0,0.28)] " +
    "bg-white/[0.06] backdrop-blur-xl border border-white/10 hover:bg-white/[0.10] " +
    "ring-1 ring-white/10",

  // Solo testo, ma leggibile su scuro
  ghost:
    "text-slate-100/90 " +
    "hover:bg-white/[0.06] border border-transparent",

  // Danger serio, non “rosso piatto”
  danger:
    "text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)] " +
    "bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-95 " +
    "ring-1 ring-white/10",
};

const sizes: Record<NonNullable<Props["size"]>, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-sm",
};

export function Button({ variant = "primary", size = "md", className = "", ...props }: Props) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}