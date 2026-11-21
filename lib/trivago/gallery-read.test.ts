import { describe, expect, it, vi } from "vitest";
import { interpretAccommodationImageCount, interpretAccommodationImages } from "@/lib/trivago/gallery-read";

const nsid = { ns: 100, id: 102762 };

function accommodation(imageGallery: unknown, id = nsid) {
  return {
    getAccommodationDetails: {
      accommodationDetails: [{ nsid: id, imageGallery }],
    },
  };
}

function photo(imageId: string, urlTail: string) {
  return {
    imageId,
    urlTail,
    width: 3734,
    height: 2504,
    source: { advertisers: [{ translatedName: { value: "ICE Portal" } }] },
    tagGroupings: [{ groupTag: { nsid: { ns: 2002, id: 1 } } }],
  };
}

describe("interpretAccommodationImages", () => {
  it("keeps an empty image array as an empty gallery", () => {
    const result = interpretAccommodationImages(
      accommodation({ images: [], totalImageCount: 0 }),
      nsid,
      200,
    );

    expect(result).toEqual({ ok: true, images: [] });
  });

  it("rejects a missing image list instead of showing an empty gallery", () => {
    const result = interpretAccommodationImages(
      accommodation({ totalImageCount: 83 }),
      nsid,
      200,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid-response");
      expect(result.messages[0]).toMatch(/image list/i);
    }
  });

  it("rejects a malformed image list", () => {
    const result = interpretAccommodationImages(
      accommodation({ images: { imageId: "gg-1" }, totalImageCount: 1 }),
      nsid,
      200,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid-response");
    }
  });

  it("rejects an image list whose entries are not photos", () => {
    const result = interpretAccommodationImages(
      accommodation({ images: [{ caption: "Lobby" }], totalImageCount: 1 }),
      nsid,
      200,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid-response");
    }
  });

  it("reports a missing accommodation separately from a bad payload", () => {
    const missing = interpretAccommodationImages(
      accommodation({ images: [] }, { ns: 100, id: 1 }),
      nsid,
      200,
    );
    const malformed = interpretAccommodationImages({ data: {} }, nsid, 200);

    expect(missing.ok).toBe(false);
    expect(malformed.ok).toBe(false);
    if (!missing.ok && !malformed.ok) {
      expect(missing.reason).toBe("not-found");
      expect(malformed.reason).toBe("invalid-response");
    }
  });

  it("gives the second photo its own url when the first photo cannot", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = interpretAccommodationImages(
      accommodation({
        images: [photo("broken", "not-a-path"), photo("ok", "/partner-images/ok.jpeg")],
        totalImageCount: 2,
      }),
      nsid,
      200,
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.images.map((image) => image.imageId)).toEqual(["broken", "ok"]);
      expect(result.images[0]?.srcTile).toBeNull();
      expect(result.images[0]?.srcPhoto).toBeNull();
      expect(result.images[1]?.srcTile).toBe(
        "https://imgcy.trivago.com/c_limit,d_dummy.jpeg,f_auto,q_auto,w_480/partner-images/ok.jpeg",
      );
      expect(result.images[1]?.srcPhoto).toBe(
        "https://imgcy.trivago.com/c_limit,d_dummy.jpeg,f_auto,q_auto,w_1600/partner-images/ok.jpeg",
      );
    }
  });
});

describe("interpretAccommodationImageCount", () => {
  it("treats a missing count as an invalid response, not a missing accommodation", () => {
    const result = interpretAccommodationImageCount(
      accommodation({ images: [] }),
      nsid,
      200,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid-response");
      expect(result.messages.join(" ")).not.toMatch(/no accommodation record matched/i);
    }
  });

  it("accepts a numeric count of zero", () => {
    const result = interpretAccommodationImageCount(
      accommodation({ images: [], totalImageCount: 0, imageCountsByGroupTag: [] }),
      nsid,
      200,
    );

    expect(result).toMatchObject({ ok: true, totalImageCount: 0, groups: [] });
  });
});
