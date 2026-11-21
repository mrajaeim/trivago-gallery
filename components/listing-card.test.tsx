import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ListingCard } from "@/components/listing-card";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/trivago/profile", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/trivago/profile")>();
  return {
    ...actual,
    fetchAccommodationProfile: vi.fn(async () => ({
      ok: false,
      reason: "upstream-error",
      retryable: true,
    })),
  };
});

vi.mock("@/lib/trivago/highlights", () => ({
  fetchAccommodationHighlights: vi.fn(async () => ({
    ok: false,
    status: 503,
    messages: ["upstream unavailable"],
  })),
}));

describe("ListingCard", () => {
  it("keeps a working gallery link while accommodation details are loading", () => {
    const html = renderToStaticMarkup(
      <ListingCard nsid={{ ns: 100, id: 102762 }} linkToGallery />,
    );

    expect(html).toContain("/accommodation/100/102762");
    expect(html).toContain("Loading accommodation");
    expect(html).not.toContain("Photo unavailable");
    expect(html).not.toContain("View details");
    expect(html).not.toContain("Live hotel details were not available");
  });
});
