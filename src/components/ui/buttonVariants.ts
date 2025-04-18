import { cva, VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  `inline-flex items-center justify-center whitespace-nowrap rounded-md text-md font-medium
   ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2
   border-t-2 border-solid border-yellow-300
   border-b-2 border-solid border-yellow-300
   border-l-6 border-solid border-yellow-300
   border-r-6 border-solid border-yellow-300
   focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none
   disabled:opacity-60  `,
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 ",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
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

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;