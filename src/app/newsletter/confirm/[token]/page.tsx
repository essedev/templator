import { confirmNewsletterSubscription } from "@/features/newsletter/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface NewsletterConfirmPageProps {
  params: Promise<{ token: string }>;
}

export default async function NewsletterConfirmPage({ params }: NewsletterConfirmPageProps) {
  const { token } = await params;
  const result = await confirmNewsletterSubscription(token);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {result.success ? "Subscription Confirmed!" : "Confirmation Failed"}
          </CardTitle>
          <CardDescription>
            {result.success
              ? "You're now subscribed to our newsletter."
              : "We couldn't confirm your subscription."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result.success ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Thank you for subscribing! You'll start receiving our latest updates and news in
                your inbox.
              </p>
              <Button asChild className="w-full">
                <Link href="/">Go to Homepage</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-destructive">{result.error}</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/">Go to Homepage</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
