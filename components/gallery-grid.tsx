"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import MuiLink from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CdnImage } from "@/components/cdn-image";
import {
  groupLabel,
  groupTitles,
  photoPath,
  type GalleryGroupCount,
  type GalleryTile,
} from "@/lib/trivago/gallery-shared";

function groupKey(group: { ns: number; id: number }) {
  return `${group.ns}:${group.id}`;
}

function sourceLine(advertisers: string[]) {
  return advertisers.length > 0 ? advertisers.join(", ") : null;
}

const ROW_PATTERN = [
  { count: 3, height: 155 },
  { count: 2, height: 235 },
] as const;

function placeTiles(images: GalleryTile[]) {
  const placed: Array<{ image: GalleryTile; height: number; span: number }> =
    [];
  let index = 0;
  let pattern = 0;

  while (index < images.length) {
    const spec = ROW_PATTERN[pattern % ROW_PATTERN.length];
    const slice = images.slice(index, index + spec.count);
    const span = 6 / slice.length;
    for (const image of slice) {
      placed.push({ image, height: spec.height, span });
    }
    index += slice.length;
    pattern += 1;
  }

  return placed;
}

const FILTER_SKELETON = [
  ["a", 2, 155],
  ["b", 2, 155],
  ["c", 2, 155],
  ["d", 3, 235],
  ["e", 3, 235],
  ["f", 2, 155],
  ["g", 2, 155],
  ["h", 2, 155],
] as const;

function FilterGridSkeleton() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
      }}
    >
      {FILTER_SKELETON.map(([key, span, height]) => (
        <Skeleton
          key={key}
          variant="rounded"
          sx={{ gridColumn: `span ${span}`, height }}
        />
      ))}
    </Box>
  );
}

function FilterChip({
  label,
  count,
  selected,
  onSelect,
}: {
  label: string;
  count: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Chip
      label={`${label} · ${count}`}
      onClick={onSelect}
      clickable
      color={selected ? "primary" : "default"}
      variant={selected ? "filled" : "outlined"}
      sx={{ fontWeight: selected ? 600 : 500 }}
    />
  );
}

export function GalleryGrid({
  images,
  groups,
  totalImageCount,
  partial,
  ns,
  id,
}: {
  images: GalleryTile[];
  groups: GalleryGroupCount[];
  totalImageCount: number;
  partial: boolean;
  ns: number;
  id: number;
}) {
  const [filter, setFilter] = useState("all");
  const [shown, setShown] = useState("all");
  const [filtering, setFiltering] = useState(false);
  const filterTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (filterTimer.current !== null) {
        window.clearTimeout(filterTimer.current);
      }
    };
  }, []);

  const selectFilter = (value: string) => {
    if (value === filter) {
      return;
    }
    setFilter(value);
    setFiltering(true);
    if (filterTimer.current !== null) {
      window.clearTimeout(filterTimer.current);
    }
    filterTimer.current = window.setTimeout(() => {
      setShown(value);
      setFiltering(false);
      filterTimer.current = null;
    }, 280);
  };

  const visible =
    shown === "all"
      ? images
      : images.filter((image) =>
          image.groups.some((group) => groupKey(group) === shown),
        );
  const placed = placeTiles(visible);
  const positionById = new Map(
    images.map((image, index) => [image.imageId, index + 1]),
  );
  const activeGroup = groups.find((group) => groupKey(group) === filter);
  const areaLabel =
    filter === "all"
      ? "all areas"
      : activeGroup
        ? groupLabel(activeGroup.ns, activeGroup.id)
        : "this area";
  const summary = filtering
    ? `Loading ${areaLabel} photos.`
    : visible.length === 0
      ? `No photos from ${areaLabel} are in the loaded set.`
      : filter === "all"
        ? `Showing ${visible.length} photo${visible.length === 1 ? "" : "s"}.`
        : `Showing ${visible.length} of ${activeGroup?.imageCount ?? visible.length} ${areaLabel} photo${visible.length === 1 ? "" : "s"}.`;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Stack spacing={1.25}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ lineHeight: 1.2, letterSpacing: "0.08em" }}
        >
          Filter by area
        </Typography>
        <Stack
          direction="row"
          role="group"
          aria-label="Photo groups"
          useFlexGap
          spacing={1}
          sx={{ flexWrap: "wrap" }}
        >
          <FilterChip
            label="All"
            count={totalImageCount}
            selected={filter === "all"}
            onSelect={() => selectFilter("all")}
          />
          {groups.map((group) => {
            const key = groupKey(group);
            return (
              <FilterChip
                key={key}
                label={groupLabel(group.ns, group.id)}
                count={group.imageCount}
                selected={filter === key}
                onSelect={() => selectFilter(key)}
              />
            );
          })}
        </Stack>
        <Typography variant="body2" color="text.secondary" aria-live="polite">
          {summary}
        </Typography>
      </Stack>
      {partial ? (
        <Alert severity="info" variant="outlined" sx={{ py: 0.5 }}>
          This page loaded the first {images.length} of {totalImageCount} photos. Category counts
          reflect the full gallery.
        </Alert>
      ) : null}
      {filtering ? (
        <FilterGridSkeleton />
      ) : visible.length === 0 ? (
        <Alert severity="info">
          No photos in this group were in the loaded page.
        </Alert>
      ) : (
        <Box
          component="ul"
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            listStyle: "none",
            m: 0,
            p: 0,
          }}
        >
          {placed.map(({ image, height, span }) => {
            const source = sourceLine(image.advertisers);
            const position = positionById.get(image.imageId) ?? 0;
            const titles = groupTitles(image.groups);
            const subject = titles.length > 0 ? `${titles.join(", ")} ` : "";
            const label = `Open ${subject}photo ${position}${source ? `, ${source}` : ""}`;
            return (
              <Box
                component="li"
                key={image.imageId}
                sx={{ gridColumn: `span ${span}`, height, minWidth: 0 }}
              >
                <Paper
                  variant="outlined"
                  sx={{
                    height: "100%",
                    overflow: "hidden",
                    borderRadius: 2,
                    transition: (theme) =>
                      theme.transitions.create(["box-shadow", "transform"], {
                        duration: theme.transitions.duration.shortest,
                      }),
                    "&:hover": {
                      boxShadow: 2,
                      transform: "scale(1.01)",
                    },
                    "&:focus-within": {
                      outline: 2,
                      outlineColor: "primary.main",
                      outlineOffset: 2,
                    },
                  }}
                >
                  <MuiLink
                    component={Link}
                    href={photoPath(ns, id, image.imageId)}
                    scroll={false}
                    aria-label={label}
                    underline="none"
                    color="inherit"
                    sx={{ display: "block", height: "100%", position: "relative" }}
                  >
                    <CdnImage
                      src={image.src}
                      width={image.width}
                      height={image.height}
                      alt=""
                      sx={{
                        aspectRatio: "auto",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    {!image.src && source ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          position: "absolute",
                          right: 0,
                          bottom: 0,
                          left: 0,
                          px: 1.5,
                          py: 1,
                        }}
                      >
                        {source}
                      </Typography>
                    ) : null}
                  </MuiLink>
                </Paper>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
