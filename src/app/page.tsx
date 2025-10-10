import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NewsletterForm } from "@/features/newsletter/NewsletterForm";
import { Section } from "@/components/common";
import { ArrowRight, Zap, Shield, Rocket, Code } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <Section className="space-y-8">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <Badge variant="secondary" className="px-4 py-1">
            Next.js 15 + Drizzle + NextAuth + Cloudflare
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            AI-First Next.js Template for Rapid Development
          </h1>

          <p className="text-xl text-muted-foreground">
            Production-ready starter with authentication, database, and Cloudflare Workers
            deployment. Built for developers who want to ship fast.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" asChild>
              <Link href="/register">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="https://github.com" target="_blank">
                View on GitHub
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      <Separator />

      {/* Features Section */}
      <Section variant="muted">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything you need to build modern web apps
            </h2>
            <p className="text-xl text-muted-foreground">
              Production-ready features out of the box
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Lightning Fast</CardTitle>
              </CardHeader>
              <CardContent>
                Next.js 15 with React Server Components and Turbopack for instant development
                experience.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Secure by Default</CardTitle>
              </CardHeader>
              <CardContent>
                NextAuth with Drizzle adapter for bulletproof authentication. Server Actions for
                type-safe mutations.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Rocket className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Deploy to the Edge</CardTitle>
              </CardHeader>
              <CardContent>
                One-click deployment to Cloudflare Workers. Global edge network with zero cold
                starts.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Code className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Developer Experience</CardTitle>
              </CardHeader>
              <CardContent>
                TypeScript strict mode, shadcn/ui components, Tailwind CSS 4, and feature-based
                architecture.
              </CardContent>
            </Card>
          </div>
        </div>
      </Section>

      <Separator />

      {/* Tech Stack Section */}
      <Section>
        <div className="mx-auto max-w-4xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Modern Stack, Maximum Productivity</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {[
              "Next.js 15",
              "React 19",
              "TypeScript",
              "Drizzle ORM",
              "NextAuth",
              "Tailwind CSS 4",
              "shadcn/ui",
              "Cloudflare Workers",
              "Neon PostgreSQL",
            ].map((tech) => (
              <div
                key={tech}
                className="flex items-center justify-center p-6 border rounded-lg hover:border-primary transition-colors"
              >
                <span className="font-medium">{tech}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Separator />

      {/* CTA Section */}
      <Section variant="muted">
        <div className="mx-auto max-w-3xl text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to build your next project?</h2>
          <p className="text-xl text-muted-foreground">
            Start with a production-ready foundation. Add features, not boilerplate.
          </p>
          <Button size="lg" asChild>
            <Link href="/register">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Section>

      <Separator />

      {/* Newsletter Section */}
      <Section>
        <div className="mx-auto max-w-2xl text-center space-y-6">
          <h3 className="text-2xl font-bold">Stay updated</h3>
          <p className="text-muted-foreground">Get notified about new features and updates.</p>
          <div className="flex justify-center">
            <NewsletterForm />
          </div>
        </div>
      </Section>
    </div>
  );
}
