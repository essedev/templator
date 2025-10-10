import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Section } from "@/components/common";
import { Check } from "lucide-react";

export const metadata = {
  title: "Pricing - Templator",
  description: "Simple, transparent pricing for everyone",
};

const plans = [
  {
    name: "Starter",
    price: "$0",
    description: "Perfect for side projects and learning",
    features: [
      "Full source code access",
      "Next.js 15 + React 19",
      "Authentication (NextAuth)",
      "Database (Drizzle + Neon)",
      "Tailwind CSS + shadcn/ui",
      "Community support",
    ],
    cta: "Get Started",
    href: "/register",
    popular: false,
  },
  {
    name: "Pro",
    price: "$49",
    description: "For professional developers and teams",
    features: [
      "Everything in Starter",
      "Advanced components library",
      "Email templates (Resend)",
      "Payment integration (Stripe)",
      "Analytics dashboard",
      "Priority support",
      "Lifetime updates",
    ],
    cta: "Go Pro",
    href: "/register",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large teams and organizations",
    features: [
      "Everything in Pro",
      "Custom integrations",
      "Dedicated support",
      "Training & onboarding",
      "SLA guarantee",
      "Custom development",
    ],
    cta: "Contact Sales",
    href: "/contact",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <Section>
      <div className="mx-auto max-w-6xl space-y-16">
        {/* Header */}
        <PageHeader
          title="Simple, Transparent Pricing"
          description="Choose the plan that's right for you"
        />

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.popular ? "border-primary shadow-lg scale-105" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.popular && <Badge variant="default">Popular</Badge>}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className="text-muted-foreground">/one-time</span>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 space-y-8">
          <h2 className="text-3xl font-bold text-center">Frequently Asked Questions</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold mb-2">Is this a one-time payment?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! Pay once and use forever. Includes all future updates.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Can I use this for client projects?</h3>
              <p className="text-sm text-muted-foreground">
                Absolutely! Use it for unlimited personal and client projects.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">What's included in updates?</h3>
              <p className="text-sm text-muted-foreground">
                New features, security patches, dependency updates, and new components.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, 30-day money-back guarantee. No questions asked.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
