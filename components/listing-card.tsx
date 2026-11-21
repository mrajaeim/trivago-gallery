import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { AboutSummary } from "@/components/about-summary";
import { CdnImage } from "@/components/cdn-image";
import { CardLink } from "@/components/next-link";
import { ViewPhotosButton } from "@/components/view-photos-button";
import { accommodationFallbackLabel } from "@/lib/trivago/accommodation-name";
import { accommodationPath } from "@/lib/trivago/gallery-shared";
import {
  fetchAccommodationHighlights,
  type HighlightView,
  type Nsid,
} from "@/lib/trivago/highlights";
import {
  emptyAccommodationProfile,
  fetchAccommodationProfile,
  formatScore,
  ratingsCountLabel,
  type AccommodationProfile,
} from "@/lib/trivago/profile";

const dealGreen = "#008a05";
const pricePanelBg = "#e7f6ec";
const pricePanelInk = "#0f2914";
const pricePanelInkMuted = "#3d5c47";
const pricePanelBorder = "rgba(15, 41, 20, 0.14)";

function scoreColor(label: string | null): string {
  if (label === "Excellent") {
    return "#007a33";
  }
  if (label === "Good") {
    return "#c77d00";
  }
  return "#3f7d12";
}

function featureItems(highlights: HighlightView[], amenities: string[]): string[] {
  const titles = highlights
    .filter((highlight) => highlight.sentiment === "POSITIVE")
    .slice(0, 2)
    .map((highlight) => highlight.title);
  if (titles.length > 0) {
    return titles;
  }
  return amenities.slice(0, 3);
}

function locationLine(profile: AccommodationProfile): string | null {
  const parts = [profile.streetAddress, profile.locality, profile.country].filter(
    (part): part is string => part !== null,
  );
  return parts.length > 0 ? parts.join(", ") : null;
}

function Stars({ value }: { value: number }) {
  return (
    <Stack
      direction="row"
      component="span"
      aria-label={`${value} out of 5 stars`}
      sx={{ color: "#f5a623" }}
    >
      {Array.from({ length: 5 }, (_, index) =>
        index < value ? (
          <StarIcon key={index} sx={{ fontSize: { xs: 17, md: 20 } }} />
        ) : (
          <StarBorderIcon key={index} sx={{ fontSize: { xs: 17, md: 20 } }} />
        ),
      )}
    </Stack>
  );
}

function formattedPrice(profile: AccommodationProfile): string | null {
  if (profile.price) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: profile.price.currency,
        maximumFractionDigits: 0,
      }).format(profile.price.amount);
    } catch {
      return profile.priceText;
    }
  }
  return profile.priceText;
}

function pricePeriodLabel(profile: AccommodationProfile): string | null {
  if (!profile.price) {
    return null;
  }
  return profile.price.period === "stay" ? "per stay" : "per night";
}

function PricePanel({
  profile,
  linked,
}: {
  profile: AccommodationProfile;
  linked: boolean;
}) {
  const amount = formattedPrice(profile);
  const period = pricePeriodLabel(profile);
  const buttonSx = {
    alignSelf: { xs: "auto", md: "stretch" },
    flexShrink: 0,
    bgcolor: dealGreen,
    borderRadius: 2,
    color: "#fff",
    fontWeight: 700,
    mt: { xs: 0, md: 0.5 },
    py: { xs: 0.85, md: 1.1 },
    px: { xs: 1.5, md: 2 },
    textTransform: "none",
    whiteSpace: "nowrap",
    "&:hover": { bgcolor: "#006e04" },
  } as const;

  const priceBlock = amount ? (
    profile.price ? (
      <>
        <Typography
          variant="overline"
          component="p"
          sx={{
            color: pricePanelInkMuted,
            lineHeight: 1,
            letterSpacing: 0.6,
            fontSize: { xs: "0.625rem", md: "0.75rem" },
          }}
        >
          From
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "baseline", flexWrap: "wrap" }}>
          <Typography
            variant="h4"
            component="p"
            sx={{
              color: pricePanelInk,
              fontWeight: 800,
              lineHeight: 1,
              fontSize: { xs: "1.35rem", md: "2.125rem" },
            }}
          >
            {amount}
          </Typography>
          {period ? (
            <Typography
              variant="body2"
              sx={{ color: pricePanelInkMuted, fontSize: { xs: "0.75rem", md: "0.875rem" } }}
            >
              {period}
            </Typography>
          ) : null}
        </Stack>
      </>
    ) : (
      <Typography variant="body2" sx={{ color: pricePanelInkMuted, fontSize: { xs: "0.8125rem", md: "0.875rem" } }}>
        {amount}
      </Typography>
    )
  ) : (
    <Typography variant="body2" sx={{ color: pricePanelInkMuted }}>
      Nightly rate unavailable
    </Typography>
  );

  const cta = linked ? (
    <Button
      component="span"
      variant="contained"
      disableElevation
      endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: { xs: 16, md: 18 } }} />}
      sx={buttonSx}
    >
      <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
        View details
      </Box>
      <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
        Details
      </Box>
    </Button>
  ) : (
    <ViewPhotosButton sx={buttonSx} />
  );

  return (
    <Stack
      spacing={0.75}
      sx={{
        justifyContent: "center",
        bgcolor: pricePanelBg,
        color: pricePanelInk,
        flexDirection: { xs: "row", md: "column" },
        alignItems: { xs: "center", md: "stretch" },
        gap: { xs: 1.25, md: 0 },
        px: { xs: 1.5, md: 2.5 },
        py: { xs: 1.15, md: 2.25 },
        minHeight: { md: "100%" },
        borderTop: { xs: "1px solid", md: "none" },
        borderLeft: { md: "1px solid" },
        borderColor: pricePanelBorder,
      }}
    >
      <Stack spacing={0.25} sx={{ flex: { xs: 1, md: "0 1 auto" }, minWidth: 0 }}>
        {priceBlock}
      </Stack>
      <Stack spacing={0.75} sx={{ flexShrink: 0, width: { xs: "auto", md: "100%" } }}>
        <Typography
          variant="caption"
          component="p"
          sx={{
            color: pricePanelInkMuted,
            lineHeight: 1.35,
            display: { xs: "none", md: "block" },
          }}
        >
          Compare offers from multiple partners
        </Typography>
        {cta}
      </Stack>
    </Stack>
  );
}

function ListingDetails({ profile }: { profile: AccommodationProfile }) {
  if (!profile.summary && profile.amenities.length === 0) {
    return null;
  }

  return (
    <>
      <Divider />
      <Stack spacing={2} sx={{ px: 2.5, py: 2 }}>
        {profile.summary ? (
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" component="p">
              About
            </Typography>
            <AboutSummary text={profile.summary} />
          </Stack>
        ) : null}
        {profile.amenities.length > 0 ? (
            <Stack spacing={1}>
            <Typography variant="subtitle2" component="p">
              Amenities
            </Typography>
            <Stack direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: "wrap" }}>
              {profile.amenities.map((amenity) => (
                <MetaPill key={amenity} title={amenity}>
                  {amenity}
                </MetaPill>
              ))}
            </Stack>
          </Stack>
        ) : null}
      </Stack>
    </>
  );
}

const metaPillBaseSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: 0.5,
  minHeight: 28,
  px: 1,
  py: 0.45,
  borderRadius: 999,
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "action.hover",
  color: "text.secondary",
  fontSize: { xs: "0.75rem", md: "0.8125rem" },
  lineHeight: 1.2,
  minWidth: 0,
  maxWidth: "100%",
} as const;

function MetaPill({
  icon,
  children,
  title,
  sx,
}: {
  icon?: ReactNode;
  children: ReactNode;
  title?: string;
  sx?: Record<string, unknown>;
}) {
  return (
    <Box component="span" title={title} sx={{ ...metaPillBaseSx, ...sx }}>
      {icon ? (
        <Box component="span" sx={{ display: "inline-flex", flexShrink: 0, lineHeight: 0 }}>
          {icon}
        </Box>
      ) : null}
      <Box
        component="span"
        sx={{
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: { xs: "nowrap", md: "normal" },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

function FeatureChips({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  const chips = items.map((item) => (
    <MetaPill
      key={item}
      title={item}
      icon={<AutoAwesomeOutlinedIcon sx={{ fontSize: 14, color: dealGreen }} aria-hidden />}
      sx={{
        flexShrink: 0,
        maxWidth: { xs: "min(72vw, 20rem)", md: "100%" },
      }}
    >
      {item}
    </MetaPill>
  ));

  return (
  <>
      <Box
        sx={{
          display: { xs: "flex", md: "none" },
          gap: 0.5,
          mx: -0.25,
          overflowX: "auto",
          pb: 0.25,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {chips}
      </Box>
      <Stack
        direction="row"
        useFlexGap
        spacing={0.75}
        sx={{ flexWrap: "wrap", display: { xs: "none", md: "flex" } }}
      >
        {chips}
      </Stack>
    </>
  );
}

function StayMeta({ checkIn, checkOut }: { checkIn: string; checkOut: string }) {
  const timeIcon = <AccessTimeOutlinedIcon sx={{ fontSize: 15 }} aria-hidden />;
  const compactLabel = `${checkIn} in · ${checkOut} out`;

  return (
    <>
      <MetaPill
        icon={timeIcon}
        title={compactLabel}
        sx={{
          display: { xs: "inline-flex", md: "none" },
          fontSize: "0.6875rem",
          px: 0.85,
          py: 0.4,
          maxWidth: "100%",
        }}
      >
        {compactLabel}
      </MetaPill>
      <Stack
        direction="row"
        useFlexGap
        spacing={0.75}
        sx={{ flexWrap: "wrap", display: { xs: "none", md: "flex" } }}
      >
        <MetaPill icon={timeIcon}>{`Check-in ${checkIn}`}</MetaPill>
        <MetaPill icon={timeIcon}>{`Check-out ${checkOut}`}</MetaPill>
      </Stack>
    </>
  );
}

async function HighlightFeatures({
  nsid,
  amenities,
}: {
  nsid: Nsid;
  amenities: string[];
}) {
  const highlights = await fetchAccommodationHighlights(nsid);
  const items = featureItems(highlights.ok ? highlights.highlights : [], amenities);
  return <FeatureChips items={items} />;
}

function FeatureSummary({
  nsid,
  amenities,
}: {
  nsid: Nsid;
  amenities: string[];
}) {
  const fallback = featureItems([], amenities);
  return (
    <Suspense fallback={<FeatureChips items={fallback} />}>
      <HighlightFeatures nsid={nsid} amenities={amenities} />
    </Suspense>
  );
}

function ListingCardBody({
  profile,
  nsid,
  linked,
  titleComponent,
  hideTitleInChrome = false,
}: {
  profile: AccommodationProfile;
  nsid: Nsid;
  linked: boolean;
  titleComponent: "h1" | "h2";
  hideTitleInChrome?: boolean;
}) {
  const location = locationLine(profile);
  const color = scoreColor(profile.ratingLabel);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "232px minmax(0, 1fr) 196px" },
      }}
    >
      <Box
        className="listing-card-media"
        sx={{
          position: "relative",
          minHeight: { xs: 148, md: 180 },
          maxHeight: { xs: 148, md: "none" },
          bgcolor: "action.hover",
          overflow: "hidden",
        }}
      >
        <CdnImage
          src={profile.imageSrc}
          width={16}
          height={10}
          alt={profile.name}
          sx={{
            display: "block",
            width: "100%",
            height: "100%",
            minHeight: { xs: 148, md: 180 },
            objectFit: "cover",
            borderRadius: 0,
            transition: "transform 0.35s ease",
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.05) 42%, transparent 62%)",
            pointerEvents: "none",
          }}
        />
        {profile.stars !== null ? (
          <Box
            sx={{
              position: "absolute",
              top: { xs: 8, md: 10 },
              left: { xs: 8, md: 10 },
              bgcolor: "rgba(0,0,0,0.72)",
              color: "#fff",
              fontSize: { xs: "0.6875rem", md: "0.75rem" },
              fontWeight: 700,
              px: { xs: 0.65, md: 1 },
              py: { xs: 0.25, md: 0.4 },
              borderRadius: 1,
              backdropFilter: "blur(6px)",
              letterSpacing: 0.2,
            }}
          >
            {profile.stars}-star hotel
          </Box>
        ) : null}
      </Box>
      <Stack
        spacing={{ xs: 1.1, md: 1.45 }}
        sx={{
          px: { xs: 1.5, md: 2.5 },
          py: { xs: 1.35, md: 2.25 },
          justifyContent: "center",
          minWidth: 0,
          bgcolor: { md: "background.paper" },
        }}
      >
        <Typography
          id={titleComponent === "h1" ? "accommodation-title" : undefined}
          variant={titleComponent === "h1" ? "h5" : "h6"}
          component={titleComponent}
          className="listing-card-title"
          sx={{
            ...(hideTitleInChrome ? visuallyHidden : null),
            fontWeight: 800,
            lineHeight: 1.2,
            fontSize: {
              xs: titleComponent === "h1" ? "1.125rem" : "1rem",
              md: titleComponent === "h1" ? "1.5rem" : "1.25rem",
            },
            display: hideTitleInChrome ? "block" : "-webkit-box",
            WebkitLineClamp: hideTitleInChrome ? undefined : 2,
            WebkitBoxOrient: hideTitleInChrome ? undefined : "vertical",
            overflow: hideTitleInChrome ? "clip" : "hidden",
            transition: "color 0.2s ease",
          }}
        >
          {profile.name}
        </Typography>
        <Stack
          direction="row"
          useFlexGap
          spacing={{ xs: 0.75, md: 1.25 }}
          sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 0.65 }}
        >
          {profile.stars !== null ? (
            <Box sx={{ display: "inline-flex", alignItems: "center", lineHeight: 0 }}>
              <Stars value={profile.stars} />
            </Box>
          ) : null}
          {profile.stars !== null && profile.ratingValue !== null ? (
            <Box
              component="span"
              aria-hidden
              sx={{ width: "1px", height: 18, bgcolor: "divider", flexShrink: 0, alignSelf: "center" }}
            />
          ) : null}
          {profile.ratingValue !== null ? (
            <Stack
              direction="row"
              spacing={{ xs: 0.65, md: 1 }}
              sx={{
                alignItems: "center",
                px: { xs: 0.65, md: 1 },
                py: 0.35,
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "action.hover",
                minHeight: 28,
              }}
            >
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: color,
                  color: "#fff",
                  fontSize: { xs: "0.75rem", md: "0.875rem" },
                  fontWeight: 800,
                  borderRadius: 1,
                  px: { xs: 0.55, md: 0.85 },
                  py: 0.25,
                  minWidth: { xs: 30, md: 36 },
                  lineHeight: 1.2,
                }}
              >
                {formatScore(profile.ratingValue)}
              </Box>
              <Typography
                variant="body2"
                component="span"
                sx={{ fontSize: { xs: "0.75rem", md: "0.875rem" } }}
              >
                {profile.ratingLabel ? (
                  <Box
                    component="strong"
                    sx={{ color, fontWeight: 700, display: { xs: "none", sm: "inline" } }}
                  >
                    {profile.ratingLabel}{" "}
                  </Box>
                ) : null}
                {profile.ratingCount !== null ? (
                  <Box component="span" sx={{ color: "text.secondary" }}>
                    ({ratingsCountLabel(profile.ratingCount)})
                  </Box>
                ) : null}
              </Typography>
            </Stack>
          ) : null}
        </Stack>
        {location ? (
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ alignItems: { xs: "center", md: "flex-start" }, minWidth: 0 }}
          >
            <PlaceOutlinedIcon
              sx={{
                fontSize: 18,
                color: "text.secondary",
                flexShrink: 0,
                mt: { md: 0.15 },
              }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              title={location}
              sx={{
                fontSize: { xs: "0.8125rem", md: "0.875rem" },
                lineHeight: 1.35,
                minWidth: 0,
                display: "-webkit-box",
                WebkitLineClamp: { xs: 1, md: 2 },
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {location}
            </Typography>
          </Stack>
        ) : null}
        <Stack spacing={0.75} sx={{ minWidth: 0 }}>
          <FeatureSummary nsid={nsid} amenities={profile.amenities} />
          {profile.checkIn && profile.checkOut ? (
            <StayMeta checkIn={profile.checkIn} checkOut={profile.checkOut} />
          ) : null}
        </Stack>
      </Stack>
      <PricePanel profile={profile} linked={linked} />
    </Box>
  );
}

function ListingCardSkeletonBody({ expanded = false }: { expanded?: boolean }) {
  return (
    <Box aria-busy="true" aria-label="Loading accommodation">
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "232px minmax(0, 1fr) 196px" },
        }}
      >
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{ minHeight: { xs: 148, md: 180 }, borderRadius: 0 }}
        />
        <Stack spacing={1.25} sx={{ px: { xs: 1.5, md: 2.5 }, py: { xs: 1.35, md: 2.25 } }}>
          <Skeleton variant="text" width="92%" height={32} />
          <Skeleton variant="text" width="58%" height={28} />
          <Skeleton variant="text" width="78%" height={22} />
          <Skeleton variant="rounded" width="70%" height={28} />
          <Stack direction="row" spacing={1}>
            <Skeleton variant="rounded" width={120} height={28} />
            <Skeleton variant="rounded" width={140} height={28} />
          </Stack>
        </Stack>
        <Stack
          direction={{ xs: "row", md: "column" }}
          spacing={1.25}
          sx={{
            alignItems: { xs: "center", md: "stretch" },
            px: { xs: 1.5, md: 2.5 },
            py: { xs: 1.15, md: 2.25 },
            bgcolor: pricePanelBg,
          }}
        >
          <Skeleton variant="text" width="45%" sx={{ flex: { xs: 1, md: "none" } }} />
          <Skeleton variant="rounded" height={40} sx={{ width: { xs: 96, md: "100%" } }} />
        </Stack>
      </Box>
      {expanded ? (
        <>
          <Divider />
          <Stack spacing={1.5} sx={{ px: 2.5, py: 2 }}>
            <Skeleton variant="text" width={72} height={24} />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="86%" />
            <Skeleton variant="text" width={96} height={24} />
            <Stack direction="row" spacing={1}>
              <Skeleton variant="rounded" width={88} height={28} />
              <Skeleton variant="rounded" width={112} height={28} />
              <Skeleton variant="rounded" width={96} height={28} />
            </Stack>
          </Stack>
        </>
      ) : null}
    </Box>
  );
}

export function ListingCardSkeleton({ expanded = false }: { expanded?: boolean }) {
  return (
    <Card variant="outlined" sx={{ overflow: "hidden", borderRadius: { xs: 2, md: 3 } }}>
      <ListingCardSkeletonBody expanded={expanded} />
    </Card>
  );
}

async function ListingCardProfile({
  nsid,
  linked,
  expanded,
  titleComponent,
  hideTitleInChrome,
}: {
  nsid: Nsid;
  linked: boolean;
  expanded: boolean;
  titleComponent: "h1" | "h2";
  hideTitleInChrome?: boolean;
}) {
  const profileResult = await fetchAccommodationProfile(nsid);
  const profile = profileResult.ok
    ? profileResult.data
    : emptyAccommodationProfile(accommodationFallbackLabel(nsid));

  return (
    <>
      <ListingCardBody
        profile={profile}
        nsid={nsid}
        linked={linked}
        titleComponent={titleComponent}
        hideTitleInChrome={hideTitleInChrome}
      />
      {expanded ? <ListingDetails profile={profile} /> : null}
    </>
  );
}

export function ListingCard({
  nsid,
  linkToGallery,
  expanded = false,
  titleComponent = "h2",
  hideTitleInChrome = false,
}: {
  nsid: Nsid;
  linkToGallery: boolean;
  expanded?: boolean;
  titleComponent?: "h1" | "h2";
  hideTitleInChrome?: boolean;
}) {
  const body = (
    <Suspense fallback={<ListingCardSkeletonBody expanded={expanded} />}>
      <ListingCardProfile
        nsid={nsid}
        linked={linkToGallery}
        expanded={expanded}
        titleComponent={titleComponent}
        hideTitleInChrome={hideTitleInChrome}
      />
    </Suspense>
  );

  return (
    <Card
      variant="outlined"
      sx={{
        overflow: "hidden",
        borderRadius: 3,
        transition: "box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
        "@media (hover: hover)": {
          "&:has(a):hover": {
            borderColor: dealGreen,
            boxShadow: 4,
            transform: "translateY(-2px)",
          },
          "&:has(a):hover .listing-card-media img": {
            transform: "scale(1.05)",
          },
          "&:has(a):hover .listing-card-title": {
            color: dealGreen,
          },
        },
        "& .MuiLink-root:focus-visible": {
          outline: `3px solid ${dealGreen}`,
          outlineOffset: -3,
        },
      }}
    >
      {linkToGallery ? (
        <CardLink href={accommodationPath(nsid.ns, nsid.id)} scroll={false}>
          {body}
        </CardLink>
      ) : (
        body
      )}
    </Card>
  );
}
