import { describe, expect, it } from "vitest";
import { mosaicTiles } from "@/components/gallery-mosaic";

describe("mosaicTiles", () => {
  it("alternates three-up and two-up rows on desktop", () => {
    const tiles = mosaicTiles(5);

    expect(tiles.map((tile) => tile.desktop)).toEqual([
      { span: 2, height: 155 },
      { span: 2, height: 155 },
      { span: 2, height: 155 },
      { span: 3, height: 235 },
      { span: 3, height: 235 },
    ]);
  });

  it("alternates two-up and one-up rows on mobile", () => {
    const tiles = mosaicTiles(5);

    expect(tiles.map((tile) => tile.mobile)).toEqual([
      { span: 1, height: 148 },
      { span: 1, height: 148 },
      { span: 2, height: 210 },
      { span: 1, height: 148 },
      { span: 1, height: 148 },
    ]);
  });

  it("stretches a short final row across the track", () => {
    const tiles = mosaicTiles(4);

    expect(tiles.map((tile) => tile.desktop.span)).toEqual([2, 2, 2, 6]);
    expect(tiles.map((tile) => tile.mobile.span)).toEqual([1, 1, 2, 2]);
  });

  it("returns no tiles for an empty gallery", () => {
    expect(mosaicTiles(0)).toEqual([]);
  });
});
