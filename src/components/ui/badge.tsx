import { type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import React from "react";
import { badgeVariants } from "./badge-variants";

export function Badge(
  { className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>
) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
