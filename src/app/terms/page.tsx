import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using our service",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
          <CardDescription>Last updated: {new Date().toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <h2>Agreement to Terms</h2>
          <p>
            By accessing or using our service, you agree to be bound by these Terms of Service and
            all applicable laws and regulations.
          </p>

          <h2>Use License</h2>
          <p>
            Permission is granted to temporarily access the materials on our service for personal,
            non-commercial transitory viewing only. This is the grant of a license, not a transfer
            of title.
          </p>

          <h2>User Accounts</h2>
          <p>
            When you create an account with us, you must provide accurate and complete information.
          </p>
          <ul>
            <li>You are responsible for safeguarding your password</li>
            <li>You are responsible for all activities that occur under your account</li>
            <li>You must notify us immediately of any unauthorized use</li>
          </ul>

          <h2>Prohibited Uses</h2>
          <p>You may not use our service:</p>
          <ul>
            <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
            <li>To violate any international, federal, provincial or state regulations</li>
            <li>To infringe upon or violate our intellectual property rights</li>
            <li>To harass, abuse, insult, harm, defame, or discriminate</li>
            <li>To submit false or misleading information</li>
            <li>To upload or transmit viruses or any other malicious code</li>
          </ul>

          <h2>Intellectual Property</h2>
          <p>
            The service and its original content, features, and functionality are owned by us and
            are protected by international copyright, trademark, and other intellectual property
            laws.
          </p>

          <h2>Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability,
            for any reason, including if you breach these Terms.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            In no event shall we be liable for any indirect, incidental, special, consequential, or
            punitive damages arising out of or relating to your use of the service.
          </p>

          <h2>Changes to Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. We will provide
            notice of any significant changes.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at{" "}
            <a href="/contact">our contact page</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
