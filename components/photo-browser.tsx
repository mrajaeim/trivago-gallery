"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { CdnImage } from "@/components/cdn-image";
import { AppLink } from "@/components/next-link";
import {
  accommodationPath,
  fallbackImageSize,
  groupTitles,
  photoPath,
  type ImageSize,
} from "@/lib/trivago/gallery-shared";

export type BrowserPhoto = {
  imageId: string;
  size: ImageSize | null;
  advertisers: string[];
  groups: Array<{ ns: number; id: number }>;
  srcPhoto: string | null;
};

type GalleryContextValue = {
  images: BrowserPhoto[];
  ns: number;
  id: number;
};

const GalleryContext = createContext<GalleryContextValue | null>(null);

const dealGreen = "#008a05";

const photoStageHeight = {
  xs: "min(40dvh, 15rem)",
  sm: "min(62dvh, 28rem)",
} as const;

const photoStageSx = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: photoStageHeight,
  minHeight: photoStageHeight,
  flexShrink: 0,
  px: { xs: 1, sm: 2 },
  bgcolor: "action.hover",
  borderBottom: "1px solid",
  borderColor: "divider",
  overflow: "hidden",
} as const;

const photoFrameSx = {
  display: "block",
  width: "auto",
  height: "auto",
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain",
  mx: "auto",
} as const;

const navButtonSx = {
  borderRadius: 2,
  fontWeight: 700,
  flex: { xs: 1, sm: "0 1 auto" },
  minHeight: { xs: 44, sm: 36 },
  px: { xs: 1, sm: 2 },
  textTransform: "none",
  borderColor: "divider",
  fontSize: { xs: "0.8125rem", sm: "0.875rem" },
  "& .MuiButton-startIcon, & .MuiButton-endIcon": {
    mx: { xs: 0, sm: undefined },
  },
  "&:not(.Mui-disabled)": {
    borderColor: dealGreen,
    color: dealGreen,
    "&:hover": {
      borderColor: "#006e04",
      bgcolor: "rgba(0, 138, 5, 0.08)",
    },
  },
} as const;

function useGallery() {
  const gallery = useContext(GalleryContext);
  if (!gallery) {
    throw new Error("PhotoCursor must render inside PhotoGalleryProvider");
  }
  return gallery;
}

export function PhotoGalleryProvider({
  images,
  ns,
  id,
  children,
}: {
  images: BrowserPhoto[];
  ns: number;
  id: number;
  children: ReactNode;
}) {
  return (
    <GalleryContext.Provider value={{ images, ns, id }}>
      {children}
    </GalleryContext.Provider>
  );
}

function PhotoStep({
  href,
  direction,
  label,
  shortLabel,
}: {
  href: string | null;
  direction: "previous" | "next";
  label: string;
  shortLabel?: string;
}) {
  const previous = direction === "previous";
  const icon = previous ? (
    <ChevronLeftRoundedIcon fontSize="small" />
  ) : (
    <ChevronRightRoundedIcon fontSize="small" />
  );
  const text = shortLabel ? (
    <>
      <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
        {label}
      </Box>
      <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
        {shortLabel}
      </Box>
    </>
  ) : (
    label
  );
  const shared = {
    variant: "outlined" as const,
    size: "small" as const,
    startIcon: previous ? icon : undefined,
    endIcon: previous ? undefined : icon,
    sx: navButtonSx,
  };

  if (!href) {
    return (
      <Button disabled {...shared}>
        {text}
      </Button>
    );
  }

  return (
    <Button component={Link} href={href} scroll={false} {...shared}>
      {text}
    </Button>
  );
}

function PhotoNav({
  previousHref,
  nextHref,
}: {
  previousHref: string | null;
  nextHref: string | null;
}) {
  return (
    <Stack
      component="nav"
      direction="row"
      aria-label="More photos"
      spacing={{ xs: 0.75, sm: 1 }}
      sx={{
        alignItems: "stretch",
        justifyContent: { sm: "space-between" },
        width: "100%",
      }}
    >
      <PhotoStep href={previousHref} direction="previous" label="Previous" shortLabel="Prev" />
      <PhotoStep href={nextHref} direction="next" label="Next" />
    </Stack>
  );
}

function BackToGallery({ ns, id }: { ns: number; id: number }) {
  return (
    <AppLink
      href={accommodationPath(ns, id)}
      underline="none"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        alignSelf: "flex-start",
        color: "text.secondary",
        fontWeight: 600,
        fontSize: "0.875rem",
        "&:hover": { color: dealGreen },
      }}
    >
      <ArrowBackIcon fontSize="small" />
      Back to gallery
    </AppLink>
  );
}

export function PhotoCursor({ imageId }: { imageId: string }) {
  const router = useRouter();
  const { images, ns, id } = useGallery();
  const index = images.findIndex((image) => image.imageId === imageId);
  const image = index >= 0 ? images[index] : null;

  const previous = index > 0 ? images[index - 1] : null;
  const next = index >= 0 && index < images.length - 1 ? images[index + 1] : null;
  const previousHref = previous ? photoPath(ns, id, previous.imageId) : null;
  const nextHref = next ? photoPath(ns, id, next.imageId) : null;

  useEffect(() => {
    if (!previousHref && !nextHref) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "ArrowLeft" && previousHref) {
        event.preventDefault();
        router.push(previousHref, { scroll: false });
      }
      if (event.key === "ArrowRight" && nextHref) {
        event.preventDefault();
        router.push(nextHref, { scroll: false });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previousHref, nextHref, router]);

  if (!image) {
    return (
      <Stack component="article" spacing={2}>
        <Typography variant="h5" component="h1">
          Photo unavailable
        </Typography>
        <PhotoNav previousHref={null} nextHref={null} />
        <BackToGallery ns={ns} id={id} />
      </Stack>
    );
  }

  const frame = image.size ?? fallbackImageSize;
  const source = image.advertisers.length > 0 ? image.advertisers.join(", ") : null;
  const titles = groupTitles(image.groups);
  const positionLabel = `Photo ${index + 1} of ${images.length}`;
  const title = titles.length > 0 ? titles.join(", ") : positionLabel;
  const progress = images.length > 0 ? ((index + 1) / images.length) * 100 : 0;

  const compactPosition = `${index + 1} / ${images.length}`;

  return (
    <Stack component="article" spacing={{ xs: 1.25, sm: 2.5 }}>
      <Stack spacing={{ xs: 0.75, sm: 1.25 }}>
        {titles.length > 1 ? (
          <Stack direction="row" useFlexGap spacing={0.5} sx={{ flexWrap: "wrap" }}>
            {titles.map((area) => (
              <Chip
                key={area}
                label={area}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: dealGreen,
                  color: dealGreen,
                  fontWeight: 600,
                  height: 26,
                  fontSize: "0.75rem",
                }}
              />
            ))}
          </Stack>
        ) : null}
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "baseline", justifyContent: "space-between", gap: 1, minWidth: 0 }}
        >
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: 800,
              lineHeight: 1.2,
              fontSize: { xs: "1.125rem", sm: "1.5rem" },
              minWidth: 0,
              flex: 1,
            }}
          >
            {title}
          </Typography>
          {titles.length > 0 ? (
            <Typography
              variant="caption"
              color="text.secondary"
              component="p"
              sx={{ flexShrink: 0, fontWeight: 700, fontSize: { xs: "0.75rem", sm: "0.8125rem" } }}
            >
              <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                {compactPosition}
              </Box>
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                {positionLabel}
              </Box>
            </Typography>
          ) : null}
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          aria-hidden
          sx={{
            height: { xs: 3, sm: 4 },
            borderRadius: 999,
            bgcolor: "action.hover",
            "& .MuiLinearProgress-bar": { bgcolor: dealGreen, borderRadius: 999 },
          }}
        />
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          borderRadius: { xs: 2, sm: 2.5 },
          overflow: "hidden",
          bgcolor: "background.paper",
        }}
      >
        <Box sx={photoStageSx}>
          <CdnImage
            src={image.srcPhoto}
            width={frame.width}
            height={frame.height}
            alt={titles.length > 0 ? `${titles.join(", ")} photo` : positionLabel}
            loading="eager"
            sx={photoFrameSx}
          />
        </Box>
        <Stack spacing={{ xs: 1, sm: 1.5 }} sx={{ px: { xs: 1, sm: 1.75 }, py: { xs: 1, sm: 1.5 } }}>
          {source ? (
            <Chip
              label={source}
              size="small"
              variant="outlined"
              sx={{
                alignSelf: "flex-start",
                borderColor: "divider",
                color: "text.secondary",
                height: 26,
                fontSize: "0.75rem",
              }}
            />
          ) : null}
          <PhotoNav previousHref={previousHref} nextHref={nextHref} />
        </Stack>
      </Paper>

      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          display: { xs: "none", sm: "flex" },
        }}
      >
        <BackToGallery ns={ns} id={id} />
        <Typography variant="caption" color="text.secondary">
          Arrow keys to browse
        </Typography>
      </Stack>
    </Stack>
  );
}

export function PhotoRouteFallback() {
  return (
    <Stack component="article" spacing={2.5} aria-busy="true">
      <Stack spacing={1}>
        <Skeleton variant="rounded" width={88} height={28} />
        <Skeleton variant="text" width={220} height={40} />
        <Typography variant="caption" color="text.secondary">
          Loading photos
        </Typography>
        <Skeleton variant="rounded" height={4} />
      </Stack>
      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: "hidden" }}>
        <Skeleton variant="rectangular" sx={{ ...photoStageSx, animation: "wave" }} />
        <Stack spacing={1.5} sx={{ p: 1.5 }}>
          <PhotoNav previousHref={null} nextHref={null} />
        </Stack>
      </Paper>
      <Button
        disabled
        startIcon={<ArrowBackIcon fontSize="small" />}
        sx={{ alignSelf: "flex-start", textTransform: "none" }}
      >
        Back to gallery
      </Button>
    </Stack>
  );
}
