import { describe, expect, it } from "vitest";
import {
  classifyProfileFailure,
  classifyProfileHttpStatus,
  readProfile,
} from "@/lib/trivago/profile";

const nsid = { ns: 100, id: 102762 };

function page(scripts: unknown[], ogTitle?: string): string {
  const og = ogTitle
    ? `<meta property="og:title" content="${ogTitle}">`
    : "";
  return (
    og +
    scripts
      .map(
        (script) =>
          `<script type="application/ld+json">${JSON.stringify(script)}</script>`,
      )
      .join("")
  );
}

function hotel(
  name: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    "@type": "Hotel",
    name,
    url: `https://www.trivago.com/en-US/oar/${name.toLowerCase().replace(/\s+/g, "-")}?search=100-102762`,
    ...extra,
  };
}

describe("readProfile", () => {
  it("selects the hotel whose canonical URL matches the requested nsid", () => {
    const html = page([
      hotel("Other Stay", {
        url: "https://www.trivago.com/en-US/oar/other-stay?search=100-1",
      }),
      hotel("Requested Stay"),
    ]);

    expect(readProfile(html, nsid)?.name).toBe("Requested Stay");
  });

  it("omits unverified details when several hotels are plausible", () => {
    const html = page(
      [
        {
          "@type": "Hotel",
          name: "Other Stay",
          amenityFeature: [{ name: "Parking", value: true }],
        },
        {
          "@type": "Hotel",
          name: "Requested Stay",
          amenityFeature: [{ name: "Pool" }],
        },
      ],
      "Requested Stay | trivago",
    );

    expect(readProfile(html, nsid)).toEqual({
      name: "Requested Stay",
      imageSrc: null,
      streetAddress: null,
      locality: null,
      postalCode: null,
      country: null,
      stars: null,
      ratingValue: null,
      ratingCount: null,
      ratingLabel: null,
      price: null,
      priceText: null,
      checkIn: null,
      checkOut: null,
      summary: null,
      amenities: [],
    });
  });

  it("keeps amenities that are true or omit a value, and drops false ones", () => {
    const html = page([
      hotel("Requested Stay", {
        amenityFeature: [
          { name: "WiFi", value: true },
          { name: "Parking", value: false },
          { name: "Pool" },
        ],
      }),
    ]);

    expect(readProfile(html, nsid)?.amenities).toEqual(["WiFi", "Pool"]);
  });

  it("keeps the source text when a price omits its currency", () => {
    const html = page([hotel("Requested Stay", { priceRange: "From 102 per night" })]);
    const profile = readProfile(html, nsid);

    expect(profile?.price).toBeNull();
    expect(profile?.priceText).toBe("From 102 per night");
  });

  it("maps an explicit dollar sign to USD", () => {
    const html = page([hotel("Requested Stay", { priceRange: "from $102 per night" })]);
    const profile = readProfile(html, nsid);

    expect(profile?.price).toEqual({
      amount: 102,
      currency: "USD",
      period: "night",
    });
  });

  it("models a price only when amount, currency, and period are all present", () => {
    const html = page([hotel("Requested Stay", { priceRange: "from €100 per night" })]);
    const profile = readProfile(html, nsid);

    expect(profile?.price).toEqual({
      amount: 100,
      currency: "EUR",
      period: "night",
    });
  });

  it("does not treat a longer search id as a match for a prefix request", () => {
    const html = page(
      [
        hotel("Prefix Stay", {
          url: "https://www.trivago.com/en-US/oar/prefix-stay?search=100-420",
        }),
        hotel("Other Stay", {
          url: "https://www.trivago.com/en-US/oar/other-stay?search=100-19",
        }),
      ],
      "Requested Stay | trivago",
    );

    expect(readProfile(html, { ns: 100, id: 42 })).toEqual({
      name: "Requested Stay",
      imageSrc: null,
      streetAddress: null,
      locality: null,
      postalCode: null,
      country: null,
      stars: null,
      ratingValue: null,
      ratingCount: null,
      ratingLabel: null,
      price: null,
      priceText: null,
      checkIn: null,
      checkOut: null,
      summary: null,
      amenities: [],
    });
  });

  it("selects the complete search id when a prefix sibling is also present", () => {
    const html = page([
      hotel("Prefix Stay", {
        url: "https://www.trivago.com/en-US/oar/prefix-stay?search=100-420",
      }),
      hotel("Exact Stay", {
        url: "https://www.trivago.com/en-US/oar/exact-stay?search=100-42",
      }),
    ]);

    expect(readProfile(html, { ns: 100, id: 42 })?.name).toBe("Exact Stay");
  });

  it("rejects a sole hotel whose search id conflicts with the request", () => {
    const html = page(
      [
        hotel("Other Stay", {
          url: "https://www.trivago.com/en-US/oar/other-stay?search=100-19",
        }),
      ],
      "Requested Stay | trivago",
    );

    expect(readProfile(html, { ns: 100, id: 42 })).toEqual({
      name: "Requested Stay",
      imageSrc: null,
      streetAddress: null,
      locality: null,
      postalCode: null,
      country: null,
      stars: null,
      ratingValue: null,
      ratingCount: null,
      ratingLabel: null,
      price: null,
      priceText: null,
      checkIn: null,
      checkOut: null,
      summary: null,
      amenities: [],
    });
  });
});

describe("classifyProfileFailure", () => {
  it("keeps the reason encoded by the profile loader", () => {
    expect(classifyProfileFailure(new Error("accommodation-profile:invalid-response"))).toEqual({
      ok: false,
      reason: "invalid-response",
      retryable: false,
    });
    expect(classifyProfileFailure(new Error("accommodation-profile:not-found"))).toEqual({
      ok: false,
      reason: "not-found",
      retryable: false,
    });
  });

  it("treats timeouts as retryable and unknown failures as upstream errors", () => {
    expect(classifyProfileFailure({ name: "TimeoutError" })).toEqual({
      ok: false,
      reason: "timeout",
      retryable: true,
    });
    expect(classifyProfileFailure(new Error("socket hang up"))).toEqual({
      ok: false,
      reason: "upstream-error",
      retryable: true,
    });
  });

  it("maps HTTP 404 separately from other status codes", () => {
    expect(classifyProfileHttpStatus(404).reason).toBe("not-found");
    expect(classifyProfileHttpStatus(404).retryable).toBe(false);
    expect(classifyProfileHttpStatus(503)).toEqual({
      ok: false,
      reason: "upstream-error",
      retryable: true,
    });
  });
});
