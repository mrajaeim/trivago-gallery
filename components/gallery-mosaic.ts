export type MosaicSpan = {
  span: number;
  height: number;
};

export type MosaicTile = {
  mobile: MosaicSpan;
  desktop: MosaicSpan;
};

type RowSpec = {
  count: number;
  height: number;
};

type Track = {
  columns: number;
  pattern: readonly RowSpec[];
};

/** Phones alternate a pair with one full-width photo. */
const mobileTrack: Track = {
  columns: 2,
  pattern: [
    { count: 2, height: 148 },
    { count: 1, height: 210 },
  ],
};

/** Wider layouts alternate a row of three with a row of two. */
const desktopTrack: Track = {
  columns: 6,
  pattern: [
    { count: 3, height: 155 },
    { count: 2, height: 235 },
  ],
};

export const galleryMosaicColumns = {
  xs: `repeat(${mobileTrack.columns}, minmax(0, 1fr))`,
  sm: `repeat(${desktopTrack.columns}, minmax(0, 1fr))`,
} as const;

function placeTrack(count: number, track: Track): MosaicSpan[] {
  const placed: MosaicSpan[] = [];
  let index = 0;
  let step = 0;

  while (index < count) {
    const spec = track.pattern[step % track.pattern.length];
    const size = Math.min(spec.count, count - index);
    const span = track.columns / size;
    for (let tile = 0; tile < size; tile += 1) {
      placed.push({ span, height: spec.height });
    }
    index += size;
    step += 1;
  }

  return placed;
}

export function mosaicTiles(count: number): MosaicTile[] {
  const mobile = placeTrack(count, mobileTrack);
  const desktop = placeTrack(count, desktopTrack);
  return mobile.map((cell, index) => ({
    mobile: cell,
    desktop: desktop[index],
  }));
}

export const galleryMosaicSkeleton = mosaicTiles(8);

export function mosaicCellSx(tile: MosaicTile) {
  return {
    gridColumn: {
      xs: `span ${tile.mobile.span}`,
      sm: `span ${tile.desktop.span}`,
    },
    height: { xs: tile.mobile.height, sm: tile.desktop.height },
    minWidth: 0,
  };
}
