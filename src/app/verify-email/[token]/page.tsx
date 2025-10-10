import { verifyEmailToken } from "@/features/auth/email-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";

interface VerifyEmailPageProps {
  params: Promise<{ token: string }>;
}

export default async function VerifyEmailPage({ params }: VerifyEmailPageProps) {
  const { token } = await params;
  const result = await verifyEmailToken(token);

  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex flex-col items-center gap-2">
              <XCircle className="h-12 w-12 text-destructive" />
              <CardTitle className="text-center text-destructive">Verification Failed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{result.error}</p>
            <p className="text-sm text-muted-foreground">
              Your verification link may have expired or is invalid.
            </p>
            <Button asChild className="w-full">
              <Link href="/register">Register Again</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <CardTitle className="text-center text-green-600">Email Verified!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your email has been successfully verified. You can now log in and access all features.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
