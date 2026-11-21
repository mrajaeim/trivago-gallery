"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiLink from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CdnImage } from "@/components/cdn-image";
import {
  galleryMosaicColumns,
  mosaicCellSx,
  mosaicTiles,
} from "@/components/gallery-mosaic";
import {
  fallbackImageSize,
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

const dealGreen = "#008a05";

const filterTrackBg = "action.hover";

const filterToggleSx = {
  gap: 0.5,
  flexWrap: "nowrap",
  width: "max-content",
  p: 0.35,
  "& .MuiToggleButtonGroup-grouped": {
    border: "1px solid transparent",
    borderRadius: "999px !important",
    flexShrink: 0,
    mx: 0,
    my: 0,
    px: 1.05,
    py: 0.35,
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.8125rem",
    lineHeight: 1.25,
    color: "text.secondary",
    transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
    "&:not(:first-of-type)": {
      marginLeft: 0,
      borderLeft: "1px solid transparent",
    },
    "&:hover": {
      bgcolor: "background.paper",
      color: "text.primary",
      boxShadow: 1,
    },
    "&.Mui-selected": {
      bgcolor: dealGreen,
      borderColor: dealGreen,
      color: "#fff",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.18)",
      "&:hover": {
        bgcolor: "#006e04",
        borderColor: "#006e04",
      },
      "& .filter-chip-count": {
        bgcolor: "rgba(255,255,255,0.24)",
        color: "#fff",
      },
    },
    "&:focus-visible": {
      outline: `2px solid ${dealGreen}`,
      outlineOffset: 1,
    },
  },
} as const;

function FilterChipCount({ count }: { count: number }) {
  return (
    <Box
      component="span"
      className="filter-chip-count"
      sx={{
        ml: 0.45,
        px: 0.45,
        py: 0,
        minWidth: 18,
        borderRadius: 8,
        fontSize: "0.6875rem",
        fontWeight: 700,
        lineHeight: 1.55,
        textAlign: "center",
        bgcolor: "rgba(127, 127, 127, 0.16)",
        color: "text.secondary",
      }}
    >
      {count}
    </Box>
  );
}

function FilterChip({
  label,
  count,
  value,
}: {
  label: string;
  count: number;
  value: string;
}) {
  return (
    <ToggleButton value={value} aria-label={`${label}, ${count} photos`}>
      {label}
      <FilterChipCount count={count} />
    </ToggleButton>
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
  const filterScrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = filterScrollerRef.current;
    if (!scroller) {
      return;
    }
    const selected = scroller.querySelector(".MuiToggleButtonGroup-grouped.Mui-selected");
    if (!(selected instanceof HTMLElement)) {
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    selected.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [filter]);

  const selectFilter = (value: string) => {
    if (value === filter) {
      return;
    }
    setFilter(value);
  };

  const visible =
    filter === "all"
      ? images
      : images.filter((image) =>
          image.groups.some((group) => groupKey(group) === filter),
        );
  const placed = mosaicTiles(visible.length).map((tile, index) => ({
    image: visible[index],
    tile,
  }));
  const positionById = new Map(
    images.map((image, index) => [image.imageId, index + 1]),
  );
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, sm: 1.25 },
          py: 0.75,
          px: { xs: 1, sm: 1.25 },
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            flexShrink: 0,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            display: { xs: "none", sm: "block" },
          }}
        >
          Area
        </Typography>
        <Box
          sx={{
            position: "relative",
            flex: 1,
            minWidth: 0,
            borderRadius: 1.75,
            bgcolor: filterTrackBg,
            border: "1px solid",
            borderColor: "divider",
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 28,
              pointerEvents: "none",
              borderRadius: "0 14px 14px 0",
              background: (theme) =>
                `linear-gradient(to left, ${theme.palette.action.hover}, transparent)`,
            },
          }}
        >
          <Box
            ref={filterScrollerRef}
            sx={{
              overflowX: "auto",
              overflowY: "hidden",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            <ToggleButtonGroup
              exclusive
              value={filter}
              onChange={(_, value) => {
                if (typeof value === "string" && value.length > 0) {
                  selectFilter(value);
                }
              }}
              aria-label="Photo groups"
              sx={filterToggleSx}
            >
              <FilterChip label="All" count={totalImageCount} value="all" />
              {groups.map((group) => {
                const key = groupKey(group);
                return (
                  <FilterChip
                    key={key}
                    label={groupLabel(group.ns, group.id)}
                    count={group.imageCount}
                    value={key}
                  />
                );
              })}
            </ToggleButtonGroup>
          </Box>
        </Box>
        {filter !== "all" ? (
          <Button
            size="small"
            variant="text"
            onClick={() => selectFilter("all")}
            sx={{
              flexShrink: 0,
              color: dealGreen,
              fontWeight: 700,
              fontSize: "0.75rem",
              textTransform: "none",
              minWidth: 0,
              px: 0.5,
              py: 0.25,
              lineHeight: 1.2,
            }}
          >
            Clear
          </Button>
        ) : null}
      </Box>
      {partial ? (
        <Alert severity="info" variant="outlined" sx={{ py: 0.5 }}>
          This page loaded the first {images.length} of {totalImageCount} photos. Category counts
          reflect the full gallery.
        </Alert>
      ) : null}
      {visible.length === 0 ? (
        <Alert severity="info">
          No photos in this group were in the loaded page.
        </Alert>
      ) : (
        <Box
          component="ul"
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: galleryMosaicColumns,
            listStyle: "none",
            m: 0,
            p: 0,
          }}
        >
          {placed.map(({ image, tile }) => {
            const frame = image.size ?? fallbackImageSize;
            const source = sourceLine(image.advertisers);
            const position = positionById.get(image.imageId) ?? 0;
            const titles = groupTitles(image.groups);
            const subject = titles.length > 0 ? `${titles.join(", ")} ` : "";
            const label = `Open ${subject}photo ${position}${source ? `, ${source}` : ""}`;
            return (
              <Box
                component="li"
                key={image.imageId}
                sx={mosaicCellSx(tile)}
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
                      width={frame.width}
                      height={frame.height}
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
