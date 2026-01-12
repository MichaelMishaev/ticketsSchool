import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Backup and experimental files
      "**/*-BACKUP-*.tsx",
      "**/*-backup.tsx",
      "**/*-redesigned.tsx",
      "**/*-improved.tsx",
      "**/*-original-backup.tsx",
      "**/new-test/**",
      "**/new-restaurant/**",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "off",
      "prefer-const": "warn",
    },
  },
];

export default eslintConfig;
