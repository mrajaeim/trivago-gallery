import { describe, expect, it } from "vitest";
import {
  galleryImageSrcSet,
  galleryImageUrl,
  imageIdFromPathname,
  photoViewerTitle,
} from "@/lib/trivago/gallery-shared";

describe("galleryImageSrcSet", () => {
  it("builds a width set from a trivago path", () => {
    const srcSet = galleryImageSrcSet("/partner-images/room.jpeg");

    expect(srcSet).toContain(
      `${galleryImageUrl("/partner-images/room.jpeg", 640)} 640w`,
    );
    expect(srcSet).toContain("960w");
    expect(srcSet).toContain("1600w");
  });

  it("rejects a tail that is not a single path", () => {
    expect(galleryImageSrcSet("not-a-path")).toBeNull();
    expect(galleryImageSrcSet("//cdn.example/a.jpg")).toBeNull();
  });
});

describe("imageIdFromPathname", () => {
  it("reads an encoded photo id and falls back otherwise", () => {
    expect(
      imageIdFromPathname("/accommodation/100/102762/photos/room%20a", "fallback"),
    ).toBe("room a");
    expect(imageIdFromPathname("/accommodation/100/102762", "fallback")).toBe("fallback");
    expect(imageIdFromPathname("", "fallback")).toBe("fallback");
    expect(imageIdFromPathname(null, "fallback")).toBe("fallback");
  });
});

describe("photoViewerTitle", () => {
  it("uses a known area and otherwise the photo id", () => {
    expect(
      photoViewerTitle(100, 102762, {
        imageId: "room",
        groups: [{ ns: 2002, id: 1 }],
      }),
    ).toBe("Rooms · Accommodation 100/102762");
    expect(photoViewerTitle(100, 102762, { imageId: "plain", groups: [] })).toBe(
      "Photo plain · Accommodation 100/102762",
    );
  });
});
