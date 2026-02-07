import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  `inline-flex items-center justify-center whitespace-nowrap rounded-none text-md font-bold
   ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2
   border-2 border-black
   focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none
   disabled:opacity-60 shadow-neo active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`,
  {
    variants: {
      variant: {
        default: "bg-yellow-400 text-black hover:bg-yellow-300",
        destructive: "bg-red-500 text-white hover:bg-red-400",
        outline: "bg-white text-black hover:bg-gray-100",
        secondary: "bg-purple-500 text-white hover:bg-purple-400",
        ghost: "border-transparent shadow-none hover:bg-black/5",
        link: "border-transparent shadow-none underline-offset-4 hover:underline text-primary",
        glass: "glass-effect border-2 border-black shadow-neo hover:bg-white/80",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3",
        lg: "h-12 px-8",
        xs: "h-5 px-2"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);