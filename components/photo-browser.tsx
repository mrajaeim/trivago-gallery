"use client";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
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
  xs: "min(46dvh, 17.5rem)",
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

const photoNavGroupSx = {
  display: "flex",
  width: "100%",
  maxWidth: { sm: "26rem" },
  mx: { sm: "auto" },
  borderRadius: 1.75,
  border: "1px solid",
  borderColor: "divider",
  overflow: "hidden",
  bgcolor: "action.hover",
} as const;

const navButtonSx = {
  flex: 1,
  minWidth: 0,
  borderRadius: 0,
  fontWeight: 700,
  minHeight: { xs: 44, sm: 40 },
  px: { xs: 0.75, sm: 1.5 },
  py: { xs: 0.75, sm: 0.65 },
  textTransform: "none",
  fontSize: { xs: "0.8125rem", sm: "0.875rem" },
  color: "text.primary",
  bgcolor: "transparent",
  boxShadow: "none",
  "&:not(:last-of-type)": {
    borderRight: "1px solid",
    borderColor: "divider",
  },
  "& .MuiButton-startIcon, & .MuiButton-endIcon": {
    mx: { xs: 0, sm: undefined },
  },
  "&:not(.Mui-disabled)": {
    "&:hover": {
      bgcolor: "rgba(0, 138, 5, 0.12)",
      color: dealGreen,
    },
    "&:active": {
      bgcolor: "rgba(0, 138, 5, 0.18)",
    },
  },
  "&.Mui-disabled": {
    color: "text.disabled",
    borderColor: "divider",
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
    variant: "text" as const,
    size: "small" as const,
    disableElevation: true,
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
    <Box component="nav" aria-label="More photos" sx={photoNavGroupSx}>
      <PhotoStep href={previousHref} direction="previous" label="Previous" shortLabel="Prev" />
      <PhotoStep href={nextHref} direction="next" label="Next" />
    </Box>
  );
}

const photoHeaderActionRowSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr auto", sm: "auto auto" },
  gap: 0.75,
  width: "100%",
  alignItems: "stretch",
  justifyContent: { sm: "flex-start" },
} as const;

const photoHeaderActionBaseSx = {
  textTransform: "none",
  fontWeight: 700,
  minHeight: { xs: 40, sm: 36 },
  px: { xs: 1.25, sm: 1.75 },
  borderRadius: 1.75,
  fontSize: { xs: "0.8125rem", sm: "0.875rem" },
  whiteSpace: "nowrap",
} as const;

const photoHeaderSecondarySx = {
  ...photoHeaderActionBaseSx,
  minWidth: { xs: 40, sm: "auto" },
  borderColor: "divider",
  color: "text.primary",
  px: { xs: 1, sm: 1.75 },
  "&:hover": {
    borderColor: dealGreen,
    color: dealGreen,
    bgcolor: "rgba(0, 138, 5, 0.06)",
  },
} as const;

const photoHeaderPrimarySx = {
  ...photoHeaderActionBaseSx,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  bgcolor: dealGreen,
  color: "#fff",
  justifyContent: "center",
  "&:hover": { bgcolor: "#006e04" },
  "& .MuiButton-endIcon": {
    marginLeft: { xs: 0.25, sm: 0.5 },
    marginRight: { xs: -0.25, sm: -0.5 },
  },
} as const;

export function PhotoPageActions({ ns, id }: { ns: number; id: number }) {
  const detailHref = accommodationPath(ns, id);

  return (
    <Box
      component="nav"
      aria-label="Accommodation and navigation"
      sx={photoHeaderActionRowSx}
    >
      <Button
        component={Link}
        href={detailHref}
        scroll={false}
        variant="contained"
        disableElevation
        size="small"
        endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: { xs: 15, sm: 18 } }} />}
        sx={photoHeaderPrimarySx}
      >
        <Box component="span" sx={{ display: { xs: "none", lg: "inline" } }}>
          Show accommodation details
        </Box>
        <Box component="span" sx={{ display: { xs: "none", sm: "inline", lg: "none" } }}>
          Show details
        </Box>
        <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
          Open details
        </Box>
      </Button>
      <Button
        component={Link}
        href="/"
        variant="outlined"
        size="small"
        aria-label="Home"
        startIcon={<HomeRoundedIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
        sx={{
          ...photoHeaderSecondarySx,
          justifyContent: "center",
          "& .MuiButton-startIcon": {
            margin: { xs: 0, sm: undefined },
          },
        }}
      >
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
          Home
        </Box>
      </Button>
    </Box>
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
    <Stack component="article" spacing={{ xs: 1, sm: 2.5 }}>
      <Stack spacing={{ xs: 0.5, sm: 1.25 }}>
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
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            minWidth: 0,
            flexWrap: "wrap",
            rowGap: 0.25,
          }}
        >
          <Typography
            variant="h5"
            component="h1"
            sx={{
              fontWeight: 800,
              lineHeight: 1.2,
              fontSize: { xs: "1.0625rem", sm: "1.5rem" },
              minWidth: 0,
              flex: "1 1 auto",
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            component="p"
            sx={{
              flexShrink: 0,
              fontWeight: 700,
              fontSize: { xs: "0.75rem", sm: "0.8125rem" },
              px: { xs: 0.75, sm: 1 },
              py: 0.25,
              borderRadius: 999,
              bgcolor: "action.hover",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
              {compactPosition}
            </Box>
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              {positionLabel}
            </Box>
          </Typography>
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

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: { xs: "none", sm: "block" }, textAlign: "right" }}
      >
        Arrow keys to browse
      </Typography>
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
    </Stack>
  );
}
