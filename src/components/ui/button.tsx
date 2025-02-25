import * as React from "react";
//import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { buttonVariants, ButtonVariantProps } from "./buttonVariants";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {}

type ButtonComponent = React.ForwardRefExoticComponent<
  ButtonProps & React.RefAttributes<HTMLButtonElement>
> & {
  variants: typeof buttonVariants;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
) as ButtonComponent;

Button.displayName = "Button";
Button.variants = buttonVariants;

export { Button };