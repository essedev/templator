import nextConfig from "eslint-config-next";
import nextTypeScriptConfig from "eslint-config-next/typescript";

const eslintConfig = [
  // Next.js base config
  ...nextConfig,
  // Next.js TypeScript config
  ...nextTypeScriptConfig,
  // Custom ignores (extends Next.js defaults)
  {
    ignores: [
      ".open-next/**",
      ".wrangler/**",
      "drizzle/**",
      "cloudflare-env.d.ts",
      "tsconfig.tsbuildinfo",
    ],
  },
  // Custom rules
  {
    rules: {
      // Disable unescaped entities rule - apostrophes are safe in JSX text
      // and essential for multilingual content (Italian, French, etc.)
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
