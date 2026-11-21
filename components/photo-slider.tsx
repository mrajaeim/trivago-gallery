"use client";

import Box from "@mui/material/Box";
import useEmblaCarousel from "embla-carousel-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
import { CdnImage } from "@/components/cdn-image";
import {
  fallbackImageSize,
  galleryImageSrcSet,
  galleryImageUrl,
  groupTitles,
  imageIdFromPathname,
  photoPath,
  photoStageSizes,
  type ImageSize,
} from "@/lib/trivago/gallery-shared";

export type SliderPhoto = {
  imageId: string;
  size: ImageSize | null;
  groups: Array<{ ns: number; id: number }>;
  srcPhoto: string | null;
  urlTail?: string | null;
};

export type PhotoSliderControls = {
  scrollPrev: () => void;
  scrollNext: () => void;
};

type PhotoSliderProps = {
  images: SliderPhoto[];
  imageId: string;
  ns: number;
  id: number;
  onSelectId: (imageId: string) => void;
  controlsRef: RefObject<PhotoSliderControls | null>;
};

const IMAGE_WINDOW = 2;

export const photoStageHeight = {
  xs: "min(46dvh, 17.5rem)",
  sm: "min(62dvh, 28rem)",
} as const;

const viewportSx = {
  overflow: "hidden",
  touchAction: "pan-y pinch-zoom",
  bgcolor: "action.hover",
  borderBottom: "1px solid",
  borderColor: "divider",
} as const;

const containerSx = {
  display: "flex",
  touchAction: "pan-y pinch-zoom",
} as const;

const slideSx = {
  flex: "0 0 100%",
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: photoStageHeight,
  minHeight: photoStageHeight,
  flexShrink: 0,
  px: { xs: 1, sm: 2 },
} as const;

const frameSx = {
  display: "block",
  width: "auto",
  height: "auto",
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain",
  mx: "auto",
  userSelect: "none",
  WebkitUserDrag: "none",
} as const;

function photoSource(image: SliderPhoto) {
  if (image.urlTail) {
    const src = galleryImageUrl(image.urlTail, 960);
    const srcSet = galleryImageSrcSet(image.urlTail);
    if (src && srcSet) {
      return { src, srcSet, sizes: photoStageSizes };
    }
  }
  if (!image.srcPhoto) {
    return null;
  }
  return { src: image.srcPhoto, srcSet: undefined, sizes: undefined };
}

function photoAlt(image: SliderPhoto, index: number, total: number) {
  const titles = groupTitles(image.groups);
  if (titles.length > 0) {
    return `${titles.join(", ")} photo`;
  }
  return `Accommodation photo ${index + 1} of ${total}`;
}

export function PhotoSlider({
  images,
  imageId,
  ns,
  id,
  onSelectId,
  controlsRef,
}: PhotoSliderProps) {
  const pathname = usePathname();
  const routeImageId = imageIdFromPathname(pathname, imageId);
  const foundIndex = images.findIndex((image) => image.imageId === routeImageId);
  const routeIndex = foundIndex >= 0 ? foundIndex : 0;
  const [startIndex] = useState(routeIndex);
  const [selectedIndex, setSelectedIndex] = useState(routeIndex);
  const [trackedRoute, setTrackedRoute] = useState(routeIndex);
  if (trackedRoute !== routeIndex) {
    setTrackedRoute(routeIndex);
    setSelectedIndex(routeIndex);
  }
  const imagesRef = useRef(images);
  const routeIdRef = useRef(routeImageId);
  const onSelectIdRef = useRef(onSelectId);
  const committedId = useRef(routeImageId);
  const ignoreSelect = useRef(false);
  const dragging = useRef(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
    skipSnaps: false,
    watchSlides: false,
    startIndex,
  });

  const slideKey = images.map((image) => image.imageId).join("\0");

  useEffect(() => {
    imagesRef.current = images;
    onSelectIdRef.current = onSelectId;
  }, [images, onSelectId]);

  useEffect(() => {
    routeIdRef.current = routeImageId;
    committedId.current = routeImageId;
  }, [routeImageId]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    // The URL follows the chosen snap. Embla's glide can take a while to settle,
    // and a drag may cross a snap and then return, so this waits until the pointer is up.
    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      setSelectedIndex(index);
      const selected = imagesRef.current[index];
      if (!selected) {
        return;
      }
      if (selected.imageId !== routeIdRef.current) {
        onSelectIdRef.current(selected.imageId);
      }
      if (ignoreSelect.current || dragging.current || selected.imageId === committedId.current) {
        return;
      }
      committedId.current = selected.imageId;
      window.history.pushState(null, "", photoPath(ns, id, selected.imageId));
    };

    const onPointerDown = () => {
      dragging.current = true;
    };

    const onPointerUp = () => {
      dragging.current = false;
      onSelect();
    };

    emblaApi.on("select", onSelect);
    emblaApi.on("pointerDown", onPointerDown);
    emblaApi.on("pointerUp", onPointerUp);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("pointerDown", onPointerDown);
      emblaApi.off("pointerUp", onPointerUp);
    };
  }, [emblaApi, ns, id]);

  useEffect(() => {
    if (!emblaApi) {
      controlsRef.current = null;
      return;
    }
    controlsRef.current = {
      scrollPrev: () => emblaApi.scrollPrev(),
      scrollNext: () => emblaApi.scrollNext(),
    };
    return () => {
      controlsRef.current = null;
    };
  }, [emblaApi, controlsRef]);

  useEffect(() => {
    const list = imagesRef.current;
    if (!emblaApi || list.length === 0) {
      return;
    }
    const index = list.findIndex((image) => image.imageId === routeIdRef.current);
    if (index < 0) {
      return;
    }
    ignoreSelect.current = true;
    emblaApi.reInit({ startIndex: index });
    ignoreSelect.current = false;
  }, [emblaApi, slideKey]);

  useEffect(() => {
    if (!emblaApi || emblaApi.selectedScrollSnap() === routeIndex) {
      return;
    }
    ignoreSelect.current = true;
    emblaApi.scrollTo(routeIndex, true);
    ignoreSelect.current = false;
  }, [emblaApi, routeIndex]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      emblaApi.reInit({ duration: 0 });
    }
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {
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
          target.tagName === "SELECT" ||
          target.isContentEditable ||
          target.closest("[role='listbox'], [role='option']"))
      ) {
        return;
      }
      if (event.key === "ArrowLeft" && emblaApi.canScrollPrev()) {
        event.preventDefault();
        emblaApi.scrollPrev();
      }
      if (event.key === "ArrowRight" && emblaApi.canScrollNext()) {
        event.preventDefault();
        emblaApi.scrollNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [emblaApi]);

  if (images.length === 0) {
    return null;
  }

  return (
    <Box
      ref={emblaRef}
      aria-roledescription="carousel"
      aria-label="Accommodation photos"
      sx={viewportSx}
    >
      <Box sx={containerSx}>
        {images.map((image, index) => {
          const distance = Math.abs(index - selectedIndex);
          const source = distance <= IMAGE_WINDOW ? photoSource(image) : null;
          const dimensions = image.size ?? fallbackImageSize;
          return (
            <Box
              key={image.imageId}
              aria-hidden={index !== selectedIndex}
              aria-roledescription="slide"
              sx={slideSx}
            >
              {source ? (
                <CdnImage
                  src={source.src}
                  srcSet={source.srcSet}
                  sizes={source.sizes}
                  width={dimensions.width}
                  height={dimensions.height}
                  alt={photoAlt(image, index, images.length)}
                  loading={distance <= 1 ? "eager" : "lazy"}
                  fetchPriority={distance === 0 ? "high" : "low"}
                  decoding="async"
                  draggable={false}
                  sx={frameSx}
                />
              ) : (
                <Box aria-hidden sx={{ width: "100%", height: "100%" }} />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
