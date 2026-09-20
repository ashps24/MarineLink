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
      // Deploy artefacts, not source: the Slate chunk archive and the export.
      ".slate-static-archive/**",
      "scripts/**",
      // A separate CommonJS Node project (Catalyst Advanced I/O function),
      // not part of the Next.js app or its TypeScript project.
      "functions/**",
    ],
  },
];

export default eslintConfig;
