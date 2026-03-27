import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: path.join(__dirname),
  },
  reactCompiler: true,
  serverExternalPackages: [
    "@google/gemini-cli-core",
    "tree-sitter-bash",
    "web-tree-sitter",
    "node-pty",
  ],
};

export default nextConfig;
