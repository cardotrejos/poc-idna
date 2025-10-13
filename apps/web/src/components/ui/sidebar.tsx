"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Sidebar({ className, ...props }: React.ComponentProps<"aside">) {
  return (
    <aside
      className={cn(
        "hidden md:flex w-64 shrink-0 flex-col border-r bg-background",
        className,
      )}
      aria-label="Sidebar navigation"
      {...props}
    />
  );
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-4", className)} {...props} />;
}

export function SidebarContent({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav className={cn("flex-1 p-2", className)} {...props} />;
}

export function SidebarGroup({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("mb-2", className)} {...props} />;
}

export function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("px-3 pb-1 text-muted-foreground text-xs font-medium", className)} {...props} />
  );
}

export function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-2", className)} {...props} />;
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("flex flex-col gap-1", className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("list-none", className)} {...props} />;
}

type SidebarMenuButtonProps = React.ComponentProps<"a"> & {
  asChild?: boolean;
  isActive?: boolean;
};

export function SidebarMenuButton({
  asChild,
  isActive,
  className,
  children,
  ...props
}: SidebarMenuButtonProps) {
  const classes = cn(
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
    isActive && "bg-accent text-accent-foreground",
    className,
  );

  if (asChild) {
    // Expect children to be a Link; wrap with a div to apply styling
    return <div className={classes}>{children}</div>;
  }
  return <a className={classes} {...props}>{children}</a>;
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-auto p-3 border-t", className)} {...props} />;
}

export function SidebarRail() {
  // Decorative/placeholder element in this minimal implementation
  return null;
}

// Minimal provider for API compatibility
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

