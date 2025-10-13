import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";

export type CtaCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: Route; // if omitted, button disabled
  actionLabel?: string;
  disabled?: boolean;
};

export function CtaCard({ icon: Icon, title, description, href, actionLabel = "Open", disabled }: CtaCardProps) {
  const isDisabled = disabled || !href;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-5 text-primary" aria-hidden />
          {title}
        </CardTitle>
        <CardAction>
          {href ? (
            <Button asChild aria-disabled={isDisabled} disabled={isDisabled} variant={isDisabled ? "outline" : "default"}>
              <Link href={href} aria-label={title} prefetch>
                {actionLabel}
              </Link>
            </Button>
          ) : (
            <Button disabled variant="outline" aria-disabled>
              {actionLabel}
            </Button>
          )}
        </CardAction>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent></CardContent>
    </Card>
  );
}
