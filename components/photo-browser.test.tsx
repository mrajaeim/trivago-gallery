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

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "",
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

  it("shows the current photo area and an all filter", () => {
    const html = renderToStaticMarkup(
      <PhotoGalleryProvider
        images={[
          {
            imageId: "room",
            size: { width: 800, height: 600 },
            advertisers: [],
            groups: [{ ns: 2002, id: 1 }],
            srcPhoto: "https://img.example/room",
          },
          {
            imageId: "pool",
            size: { width: 800, height: 600 },
            advertisers: [],
            groups: [{ ns: 2002, id: 11 }],
            srcPhoto: "https://img.example/pool",
          },
        ]}
        ns={100}
        id={102762}
      >
        <PhotoCursor imageId="room" />
      </PhotoGalleryProvider>,
    );

    expect(html).toContain("Rooms");
    expect(html).toContain("This photo");
    expect(html).toContain("All (2)");
    expect(html).toContain(">Show<");
  });

  it("mounts the selected photo and its neighbors only", () => {
    const many: BrowserPhoto[] = Array.from({ length: 7 }, (_, index) => ({
      imageId: `photo-${index}`,
      size: { width: 800, height: 600 },
      advertisers: [],
      groups: [],
      srcPhoto: `https://img.example/photo-${index}`,
    }));
    const html = renderToStaticMarkup(
      <PhotoGalleryProvider images={many} ns={100} id={102762}>
        <PhotoCursor imageId="photo-3" />
      </PhotoGalleryProvider>,
    );

    expect(html).toContain("https://img.example/photo-1");
    expect(html).toContain("https://img.example/photo-3");
    expect(html).toContain("https://img.example/photo-5");
    expect(html).not.toContain("https://img.example/photo-0");
    expect(html).not.toContain("https://img.example/photo-6");
    expect(html).toContain('fetchPriority="high"');
    expect(html.match(/<img /g)).toHaveLength(5);
    expect(html).toContain("Photo 4 of 7");
  });

  it("renders a responsive cdn set for the open photo", () => {
    const html = renderToStaticMarkup(
      <PhotoGalleryProvider
        images={[
          {
            imageId: "room",
            size: { width: 800, height: 600 },
            advertisers: [],
            groups: [],
            srcPhoto: "https://img.example/fallback",
            urlTail: "/partner-images/room.jpeg",
          },
        ]}
        ns={100}
        id={102762}
      >
        <PhotoCursor imageId="room" />
      </PhotoGalleryProvider>,
    );

    expect(html).toContain("640w");
    expect(html).toContain("1600w");
    expect(html).toContain("(max-width: 600px) 100vw, 56rem");
    expect(html).not.toContain("https://img.example/fallback");
  });
});
