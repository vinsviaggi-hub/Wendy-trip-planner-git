import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

const base =
  "inline-flex items-center justify-center rounded-xl font-medium transition " +
  "focus:outline-none focus:ring-2 focus:ring-accent/35 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<NonNullable<Props["variant"]>, string> = {
  primary: "bg-gradient-to-r from-accent to-accent2 text-white hover:opacity-95 shadow-card",
  secondary:
    "bg-white/55 backdrop-blur border border-black/25 hover:bg-white/70 shadow-card",
  ghost: "hover:bg-black/5 border border-transparent",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<NonNullable<Props["size"]>, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-sm",
};

export function Button({ variant = "primary", size = "md", className = "", ...props }: Props) {
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}