/**
 * Base email layout
 *
 * Provides consistent structure for all emails:
 * - Professional branding
 * - Responsive design
 * - Consistent spacing
 * - Footer with legal info
 */

import { Body, Container, Head, Html, Preview, Section, Text } from "@react-email/components";
import { ReactNode } from "react";

interface EmailLayoutProps {
  preview: string;
  children: ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.logo}>Templator</Text>
          </Section>

          {/* Main Content */}
          <Section style={styles.content}>{children}</Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} Templator. All rights reserved.
            </Text>
            <Text style={styles.footerText}>
              You received this email because you signed up for Templator.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#f6f9fc",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  },
  container: {
    margin: "0 auto",
    padding: "40px 20px",
    maxWidth: "600px",
  },
  header: {
    textAlign: "center" as const,
    marginBottom: "32px",
    paddingBottom: "24px",
    borderBottom: "2px solid #e5e7eb",
  },
  logo: {
    fontSize: "28px",
    fontWeight: "bold",
    margin: "0",
    color: "#000",
  },
  content: {
    backgroundColor: "#ffffff",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  footer: {
    textAlign: "center" as const,
    marginTop: "32px",
    paddingTop: "24px",
    borderTop: "1px solid #e5e7eb",
  },
  footerText: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "8px 0",
    lineHeight: "20px",
  },
};
