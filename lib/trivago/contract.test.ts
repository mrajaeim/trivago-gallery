import { describe, expect, it } from "vitest";
import { imagesQueryVariables } from "@/lib/trivago/contract";

describe("imagesQueryVariables", () => {
  it("queries the requested accommodation and a future compatibility stay", () => {
    const now = new Date("2026-11-21T22:30:00.000Z");
    const variables = imagesQueryVariables({ ns: 200, id: 15 }, now);

    expect(variables.getAccommodationDetailsInput.nsids).toEqual([{ ns: 200, id: 15 }]);
    expect(variables.contextAwareContent.stayPeriod).toEqual({
      arrival: "2026-12-21",
      departure: "2026-12-23",
    });
    expect(variables.contextAwareContent.uiv).toEqual([
      { nsid: { ns: 100, id: 102762 } },
      { nsid: { ns: 200, id: 42362 } },
    ]);
    expect(
      variables.contextAwareContent.uiv.some(
        (entry) => entry.nsid.ns === 200 && entry.nsid.id === 15,
      ),
    ).toBe(false);
  });
});
