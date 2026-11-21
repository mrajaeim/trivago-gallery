import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  PhotoCursor,
  PhotoGalleryProvider,
  type BrowserPhoto,
} from "@/components/photo-browser";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const images: BrowserPhoto[] = [
  {
    imageId: "first",
    size: { width: 3734, height: 2504 },
    advertisers: [],
    groups: [],
    srcPhoto: "https://img.example/first",
  },
  {
    imageId: "second",
    size: { width: 4096, height: 2730 },
    advertisers: [],
    groups: [],
    srcPhoto: "https://img.example/second",
  },
];

function markup(imageId: string) {
  return renderToStaticMarkup(
    <PhotoGalleryProvider images={images} ns={100} id={102762}>
      <PhotoCursor imageId={imageId} />
    </PhotoGalleryProvider>,
  );
}

describe("PhotoCursor", () => {
  it("renders the route photo on direct entry without a loading skeleton", () => {
    const html = markup("second");

    expect(html).toContain("Photo 2 of 2");
    expect(html).not.toContain("4096 × 2730");
    expect(html).toContain("https://img.example/second");
    expect(html).not.toContain("aria-busy");
  });

  it("follows the same photo url across refresh, back, and forward", () => {
    const opened = markup("first");
    const refreshed = markup("first");
    const forwarded = markup("second");
    const backed = markup("first");

    expect(refreshed).toBe(opened);
    expect(opened).toContain("Photo 1 of 2");
    expect(opened).toContain("/accommodation/100/102762/photos/second");
    expect(forwarded).toContain("Photo 2 of 2");
    expect(forwarded).toContain("/accommodation/100/102762/photos/first");
    expect(backed).toBe(opened);
  });
});
