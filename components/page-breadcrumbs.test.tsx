import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { HomeCrumbs, PageBreadcrumbs } from "@/components/page-breadcrumbs";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("PageBreadcrumbs", () => {
  it("starts every trail from Home", () => {
    const home = renderToStaticMarkup(<HomeCrumbs />);
    const nested = renderToStaticMarkup(
      <PageBreadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Hotel", href: "/accommodation/100/102762" },
          { label: "Photo" },
        ]}
      />,
    );

    expect(home).toContain("Home");
    expect(home).not.toContain('href="/"');
    expect(nested).toContain('href="/"');
    expect(nested).toContain("Home");
    expect(nested).toContain("Hotel");
    expect(nested).toContain("Photo");
    expect(nested).toContain("/accommodation/100/102762");
  });
});
