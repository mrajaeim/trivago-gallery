"use client";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  PhotoSlider,
  photoStageHeight,
  type PhotoSliderControls,
} from "@/components/photo-slider";
import {
  accommodationPath,
  groupLabel,
  imageIdFromPathname,
  photoPath,
  photoViewerTitle,
  type ImageSize,
} from "@/lib/trivago/gallery-shared";

export type BrowserPhoto = {
  imageId: string;
  size: ImageSize | null;
  advertisers: string[];
  groups: Array<{ ns: number; id: number }>;
  srcPhoto: string | null;
  urlTail?: string | null;
};

type GalleryContextValue = {
  images: BrowserPhoto[];
  ns: number;
  id: number;
  area: string;
  setArea: (area: string) => void;
};

function areaKey(group: { ns: number; id: number }) {
  return `${group.ns}:${group.id}`;
}

function photoAreas(image: BrowserPhoto) {
  const seen = new Set<string>();
  const areas: Array<{ key: string; label: string }> = [];
  for (const group of image.groups) {
    const key = areaKey(group);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    areas.push({ key, label: groupLabel(group.ns, group.id) });
  }
  return areas;
}

function areaOptions(images: BrowserPhoto[]) {
  const order: string[] = [];
  const counts = new Map<string, { ns: number; id: number; count: number }>();
  for (const image of images) {
    const seen = new Set<string>();
    for (const group of image.groups) {
      const key = areaKey(group);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      const current = counts.get(key);
      if (current) {
        current.count += 1;
      } else {
        counts.set(key, { ns: group.ns, id: group.id, count: 1 });
        order.push(key);
      }
    }
  }
  return order.flatMap((key) => {
    const option = counts.get(key);
    return option ? [option] : [];
  });
}

function inArea(image: BrowserPhoto, area: string) {
  if (area === "all") {
    return true;
  }
  return image.groups.some((group) => areaKey(group) === area);
}

const GalleryContext = createContext<GalleryContextValue | null>(null);

const dealGreen = "#008a05";

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
  const [area, setArea] = useState("all");

  return (
    <GalleryContext.Provider value={{ images, ns, id, area, setArea }}>
      {children}
    </GalleryContext.Provider>
  );
}

function unmodifiedClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function PhotoStep({
  href,
  direction,
  label,
  shortLabel,
  onStep,
}: {
  href: string | null;
  direction: "previous" | "next";
  label: string;
  shortLabel?: string;
  onStep: (() => boolean) | null;
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
    <Button
      component={Link}
      href={href}
      scroll={false}
      prefetch={false}
      onClick={
        onStep
          ? (event) => {
              if (!unmodifiedClick(event) || !onStep()) {
                return;
              }
              event.preventDefault();
            }
          : undefined
      }
      {...shared}
    >
      {text}
    </Button>
  );
}

function PhotoNav({
  previousHref,
  nextHref,
  onPrevious,
  onNext,
}: {
  previousHref: string | null;
  nextHref: string | null;
  onPrevious: (() => boolean) | null;
  onNext: (() => boolean) | null;
}) {
  return (
    <Box component="nav" aria-label="More photos" sx={photoNavGroupSx}>
      <PhotoStep
        href={previousHref}
        direction="previous"
        label="Previous"
        shortLabel="Prev"
        onStep={onPrevious}
      />
      <PhotoStep href={nextHref} direction="next" label="Next" onStep={onNext} />
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
  const pathname = usePathname();
  const routeImageId = imageIdFromPathname(pathname, imageId);
  const { images, ns, id, area, setArea } = useGallery();
  const [gestureId, setGestureId] = useState<string | null>(null);
  const [seenRouteId, setSeenRouteId] = useState(routeImageId);
  if (seenRouteId !== routeImageId) {
    setSeenRouteId(routeImageId);
    setGestureId(null);
  }
  const shownId = gestureId ?? routeImageId;
  const controlsRef = useRef<PhotoSliderControls | null>(null);
  const scrollPrevious = () => {
    const controls = controlsRef.current;
    if (!controls) {
      return false;
    }
    controls.scrollPrev();
    return true;
  };
  const scrollNext = () => {
    const controls = controlsRef.current;
    if (!controls) {
      return false;
    }
    controls.scrollNext();
    return true;
  };
  const index = images.findIndex((item) => item.imageId === shownId);
  const image = index >= 0 ? images[index] : null;
  const options = areaOptions(images);
  const visible = images.filter((item) => inArea(item, area));
  const visibleIndex = image ? visible.findIndex((item) => item.imageId === image.imageId) : -1;
  const browseIndex = visibleIndex >= 0 ? visibleIndex : index;
  const browseImages = visibleIndex >= 0 ? visible : images;
  const previous = browseIndex > 0 ? browseImages[browseIndex - 1] : null;
  const next =
    browseIndex >= 0 && browseIndex < browseImages.length - 1
      ? browseImages[browseIndex + 1]
      : null;
  const previousHref = previous ? photoPath(ns, id, previous.imageId) : null;
  const nextHref = next ? photoPath(ns, id, next.imageId) : null;

  useEffect(() => {
    if (!image || area === "all" || inArea(image, area)) {
      return;
    }
    const first = images.find((item) => inArea(item, area));
    if (!first || first.imageId === image.imageId) {
      return;
    }
    window.history.replaceState(null, "", photoPath(ns, id, first.imageId));
  }, [area, image, images, ns, id]);

  useEffect(() => {
    if (!image) {
      return;
    }
    document.title = photoViewerTitle(ns, id, image);
  }, [image, ns, id]);

  if (!image) {
    return (
      <Stack component="article" spacing={2}>
        <Typography variant="h5" component="h1">
          Photo unavailable
        </Typography>
        <PhotoNav previousHref={null} nextHref={null} onPrevious={null} onNext={null} />
      </Stack>
    );
  }
  const source = image.advertisers.length > 0 ? image.advertisers.join(", ") : null;
  const areas = photoAreas(image);
  const titles = areas.map((item) => item.label);
  const total = browseImages.length;
  const position = browseIndex >= 0 ? browseIndex + 1 : index + 1;
  const positionLabel = `Photo ${position} of ${total}`;
  const title = titles.length > 0 ? titles.join(", ") : positionLabel;
  const progress = total > 0 ? (position / total) * 100 : 0;
  const compactPosition = `${position} / ${total}`;
  const selectedArea = options.some((option) => areaKey(option) === area) ? area : "all";

  return (
    <Stack component="article" spacing={{ xs: 1, sm: 2.5 }}>
      <Stack spacing={{ xs: 0.5, sm: 1.25 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 0.75, sm: 1.25 }}
          sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
        >
          <Stack
            direction="row"
            useFlexGap
            spacing={0.5}
            sx={{ flexWrap: "wrap", alignItems: "center", minWidth: 0 }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", mr: 0.25 }}
            >
              This photo
            </Typography>
            {areas.length > 0 ? (
              areas.map((item) => (
                <Chip
                  key={item.key}
                  label={item.label}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: item.key === selectedArea ? dealGreen : "divider",
                    color: item.key === selectedArea ? dealGreen : "text.primary",
                    fontWeight: 700,
                    height: 26,
                    fontSize: "0.75rem",
                  }}
                />
              ))
            ) : (
              <Typography variant="caption" color="text.secondary">
                No area
              </Typography>
            )}
          </Stack>
          {options.length > 0 ? (
            <FormControl size="small" sx={{ width: { xs: "100%", sm: 200 }, flexShrink: 0 }}>
              <InputLabel id="photo-area-filter">Show</InputLabel>
              <Select
                labelId="photo-area-filter"
                label="Show"
                value={selectedArea}
                onChange={(event) => setArea(event.target.value)}
              >
                <MenuItem value="all">All ({images.length})</MenuItem>
                {options.map((option) => (
                  <MenuItem key={areaKey(option)} value={areaKey(option)}>
                    {groupLabel(option.ns, option.id)} ({option.count})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}
        </Stack>
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
            aria-live="polite"
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
        <PhotoSlider
          images={browseImages}
          imageId={imageId}
          ns={ns}
          id={id}
          onSelectId={setGestureId}
          controlsRef={controlsRef}
        />
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
          <PhotoNav
            previousHref={previousHref}
            nextHref={nextHref}
            onPrevious={previousHref ? scrollPrevious : null}
            onNext={nextHref ? scrollNext : null}
          />
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
          <PhotoNav previousHref={null} nextHref={null} onPrevious={null} onNext={null} />
        </Stack>
      </Paper>
    </Stack>
  );
}
