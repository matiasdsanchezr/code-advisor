"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base moderna: press effect, cursor, transición más suave
  [
    "group/button relative inline-flex shrink-0 items-center justify-center",
    "rounded-md border border-transparent bg-clip-padding",
    "text-sm font-medium whitespace-nowrap",
    "cursor-pointer select-none",
    // Transición suave en todas las props relevantes
    "transition-all duration-150 ease-out",
    "outline-none",
    // Efecto press (scale down al hacer click)
    "active:scale-[0.97]",
    // Focus moderno con ring suave
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    // Disabled
    "disabled:pointer-events-none disabled:opacity-40 disabled:saturate-50",
    // Aria invalid
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    // SVGs
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        // Default: gradiente sutil + sombra de color + shimmer en hover
        default: [
          "bg-primary text-primary-foreground",
          "shadow-[0_1px_3px_0_rgb(0_0_0/0.12),0_0_0_1px_rgb(0_0_0/0.04)]",
          "hover:brightness-110 hover:shadow-[0_4px_12px_0_color-mix(in_oklch,var(--color-primary)_40%,transparent)]",
          // Shimmer overlay
          "overflow-hidden",
          "after:absolute after:inset-0 after:-translate-x-full",
          "after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
          "hover:after:translate-x-full after:transition-transform after:duration-500 after:ease-in-out",
        ],

        // Gradient: nuevo variante animado con glow
        gradient: [
          "border-0 text-white font-semibold",
          "bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500",
          "bg-size-[200%_100%] bg-position-[0%]",
          "hover:bg-position-[100%]",
          "shadow-[0_4px_15px_0_color-mix(in_oklch,oklch(0.627_0.265_303.9)_35%,transparent)]",
          "hover:shadow-[0_6px_20px_0_color-mix(in_oklch,oklch(0.627_0.265_303.9)_50%,transparent)]",
          "overflow-hidden",
          "after:absolute after:inset-0 after:-translate-x-full",
          "after:bg-gradient-to-r after:from-transparent after:via-white/15 after:to-transparent",
          "hover:after:translate-x-full after:transition-transform after:duration-500",
        ],

        // Outline: glassmorphism refinado
        outline: [
          "border-border bg-background/60 backdrop-blur-sm",
          "shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]",
          "hover:bg-muted/80 hover:border-border/80 hover:shadow-[0_2px_8px_0_rgb(0_0_0/0.08)]",
          "hover:text-foreground",
          "aria-expanded:bg-muted aria-expanded:text-foreground",
          "dark:border-input dark:bg-input/20 dark:backdrop-blur-sm",
          "dark:hover:bg-input/40 dark:hover:border-input/80",
        ],

        // Secondary: fondo con sutil profundidad
        secondary: [
          "bg-secondary text-secondary-foreground",
          "shadow-[0_1px_2px_0_rgb(0_0_0/0.06),inset_0_1px_0_0_rgb(255_255_255/0.08)]",
          "hover:bg-secondary/70 hover:shadow-[0_2px_6px_0_rgb(0_0_0/0.1)]",
          "aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ],

        // Ghost: transición limpia con ripple de fondo
        ghost: [
          "hover:bg-muted/80 hover:text-foreground",
          "aria-expanded:bg-muted aria-expanded:text-foreground",
          "dark:hover:bg-muted/40",
        ],

        // Destructive: feedback visual más sólido
        destructive: [
          "bg-destructive/12 text-destructive",
          "border-destructive/20",
          "shadow-[0_1px_2px_0_color-mix(in_oklch,var(--color-destructive)_10%,transparent)]",
          "hover:bg-destructive/20 hover:border-destructive/30",
          "hover:shadow-[0_3px_10px_0_color-mix(in_oklch,var(--color-destructive)_20%,transparent)]",
          "focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
          "dark:bg-destructive/15 dark:hover:bg-destructive/25",
          "dark:focus-visible:ring-destructive/40",
        ],

        // Link: underline animado con offset
        link: [
          "text-primary underline-offset-4",
          "hover:underline hover:underline-offset-[5px]",
          "hover:text-primary/80",
        ],
      },
      size: {
        default:
          "h-9 gap-1.5 px-3 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),8px)] px-2 text-xs in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-[min(var(--radius-md),10px)] px-2.5 in-data-[slot=button-group]:rounded-md has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-11 gap-2 px-4 text-base has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        icon: "size-9",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),8px)] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
