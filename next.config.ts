import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["streamdown", "@streamdown/cjk", "@streamdown/code", "@streamdown/math", "@streamdown/mermaid"],
};

export default withNextIntl(nextConfig);
