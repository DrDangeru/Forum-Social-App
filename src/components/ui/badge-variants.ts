import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  `inline-flex items-center rounded-none transition-all focus:outline-none focus:ring-2 focus:ring-black
   focus:ring-offset-2 border-2 border-black font-black uppercase tracking-widest`,
  {
    variants: {
      variant: {
        default: "bg-yellow-400 text-black shadow-neo-sm",
        secondary: "bg-purple-400 text-black shadow-neo-sm",
        destructive: "bg-red-500 text-white shadow-neo-sm",
        outline: "bg-white text-black shadow-neo-sm",
        glass: "bg-white/30 backdrop-blur-md text-black shadow-neo-sm",
        success: "bg-green-500 text-white shadow-neo-sm",
        warning: "bg-orange-500 text-white shadow-neo-sm",
      },
      size: {
        default: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-xs",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
