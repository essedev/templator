/**
 * Reusable email components
 *
 * Consistent, accessible components for email templates.
 * All components follow a minimal, professional design.
 */

import { Button as EmailButton, Text } from "@react-email/components";
import { ReactNode } from "react";

/**
 * Email heading (H2 level)
 */
export function Heading({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "24px",
        fontWeight: "bold",
        margin: "0 0 16px 0",
        color: "#000",
        lineHeight: "32px",
      }}
    >
      {children}
    </h2>
  );
}

/**
 * Email paragraph with proper spacing
 */
export function Paragraph({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: "16px",
        lineHeight: "26px",
        margin: "0 0 16px 0",
        color: "#374151",
      }}
    >
      {children}
    </p>
  );
}

/**
 * Primary call-to-action button
 */
export function Button({ href, children }: { href: string; children: string }) {
  return (
    <EmailButton
      href={href}
      style={{
        backgroundColor: "#000",
        color: "#fff",
        padding: "12px 32px",
        borderRadius: "6px",
        textDecoration: "none",
        display: "inline-block",
        fontWeight: "600",
        fontSize: "16px",
        margin: "24px 0",
      }}
    >
      {children}
    </EmailButton>
  );
}

/**
 * Inline code or monospace text
 */
export function Code({ children }: { children: string }) {
  return (
    <code
      style={{
        backgroundColor: "#f3f4f6",
        padding: "2px 8px",
        borderRadius: "4px",
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#1f2937",
      }}
    >
      {children}
    </code>
  );
}

/**
 * Alert/warning box for important information
 */
export function Alert({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "#fef3c7",
        border: "1px solid #fbbf24",
        padding: "16px",
        borderRadius: "6px",
        margin: "24px 0",
      }}
    >
      <Text style={{ margin: 0, fontSize: "14px", color: "#92400e", lineHeight: "20px" }}>
        {children}
      </Text>
    </div>
  );
}

/**
 * Divider line
 */
export function Divider() {
  return (
    <hr
      style={{
        border: "none",
        borderTop: "1px solid #e5e7eb",
        margin: "24px 0",
      }}
    />
  );
}

/**
 * Small text for secondary information
 */
export function Small({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: "14px",
        lineHeight: "20px",
        margin: "8px 0",
        color: "#6b7280",
      }}
    >
      {children}
    </p>
  );
}
