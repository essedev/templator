import { ContactForm } from "@/features/contact/ContactForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, Section } from "@/components/common";
import { Mail, MessageSquare, Clock } from "lucide-react";

export const metadata = {
  title: "Contact Us - Templator",
  description: "Get in touch with our team",
};

export default function ContactPage() {
  return (
    <Section>
      <div className="mx-auto max-w-5xl space-y-16">
        {/* Header */}
        <PageHeader
          title="Get in Touch"
          description="Have a question? We'd love to hear from you."
        />

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContactForm />
              </CardContent>
            </Card>
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Other ways to reach us</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Mail className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p className="text-muted-foreground">hello@templator.dev</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <MessageSquare className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Live Chat</h3>
                    <p className="text-muted-foreground">Available Monday-Friday, 9am-5pm EST</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Clock className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Response Time</h3>
                    <p className="text-muted-foreground">We typically respond within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>Looking for support?</CardTitle>
                <CardDescription>
                  Check out our documentation first. Most questions are answered there.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View Documentation →
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Section>
  );
}
