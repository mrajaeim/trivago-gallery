"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { createContext, useContext, type ReactNode } from "react";
import { CdnImage } from "@/components/cdn-image";
import { AppLink, ButtonLink } from "@/components/next-link";
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

const photoFrameSx = {
  width: "100%",
  height: "min(32rem, 62dvh, 75vw)",
  aspectRatio: "auto",
  objectFit: "contain",
  bgcolor: "action.hover",
  borderRadius: 2,
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
      sx={{ alignItems: "center", justifyContent: "space-between" }}
    >
      <ButtonLink href={previousHref} scroll={false}>
        Previous
      </ButtonLink>
      <ButtonLink href={nextHref} scroll={false}>
        Next
      </ButtonLink>
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
      }}
    >
      <ArrowBackIcon fontSize="small" />
      Back to accommodation detail
    </AppLink>
  );
}

export function PhotoCursor({ imageId }: { imageId: string }) {
  const { images, ns, id } = useGallery();
  const index = images.findIndex((image) => image.imageId === imageId);
  const image = index >= 0 ? images[index] : null;

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

  const previous = images[index - 1];
  const next = images[index + 1];
  const frame = image.size ?? fallbackImageSize;
  const source = image.advertisers.length > 0 ? image.advertisers.join(", ") : null;
  const titles = groupTitles(image.groups);
  const positionLabel = `Photo ${index + 1} of ${images.length}`;
  const title = titles.length > 0 ? titles.join(", ") : positionLabel;

  return (
    <Stack component="article" spacing={2}>
      <Typography variant="h5" component="h1">
        {title}
      </Typography>
      {titles.length > 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: -1 }}>
          {positionLabel}
        </Typography>
      ) : null}
      <CdnImage
        src={image.srcPhoto}
        width={frame.width}
        height={frame.height}
        alt=""
        loading="eager"
        sx={photoFrameSx}
      />
      {source ? <Typography color="text.secondary">{source}</Typography> : null}
      <PhotoNav
        previousHref={previous ? photoPath(ns, id, previous.imageId) : null}
        nextHref={next ? photoPath(ns, id, next.imageId) : null}
      />
      <BackToGallery ns={ns} id={id} />
    </Stack>
  );
}

export function PhotoRouteFallback() {
  return (
    <Stack component="article" spacing={2} aria-busy="true">
      <Skeleton variant="text" width={220} height={40} />
      <Skeleton variant="rounded" sx={photoFrameSx} />
      <PhotoNav previousHref={null} nextHref={null} />
      <Button
        disabled
        startIcon={<ArrowBackIcon fontSize="small" />}
        sx={{ alignSelf: "flex-start", textTransform: "none" }}
      >
        Back to accommodation detail
      </Button>
    </Stack>
  );
}
