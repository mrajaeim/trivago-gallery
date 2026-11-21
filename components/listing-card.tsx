import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Suspense } from "react";
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
          <StarIcon key={index} sx={{ fontSize: 20 }} />
        ) : (
          <StarBorderIcon key={index} sx={{ fontSize: 20 }} />
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
    alignSelf: "stretch",
    bgcolor: dealGreen,
    borderRadius: 2,
    color: "#fff",
    fontWeight: 700,
    mt: 0.5,
    py: 1.1,
    textTransform: "none",
    "&:hover": { bgcolor: "#006e04" },
  } as const;

  return (
    <Stack
      spacing={0.75}
      sx={{
        justifyContent: "center",
        bgcolor: pricePanelBg,
        color: pricePanelInk,
        px: 2.5,
        py: 2.25,
        minHeight: { md: "100%" },
        borderTop: { xs: "1px solid", md: "none" },
        borderLeft: { md: "1px solid" },
        borderColor: pricePanelBorder,
      }}
    >
      {amount ? (
        profile.price ? (
          <>
            <Typography
              variant="overline"
              component="p"
              sx={{ color: pricePanelInkMuted, lineHeight: 1.2, letterSpacing: 0.6 }}
            >
              From
            </Typography>
            <Typography
              variant="h4"
              component="p"
              sx={{ color: pricePanelInk, fontWeight: 800, lineHeight: 1 }}
            >
              {amount}
            </Typography>
            {period ? (
              <Typography variant="body2" sx={{ color: pricePanelInkMuted }}>
                {period}
              </Typography>
            ) : null}
          </>
        ) : (
          <Typography variant="body2" sx={{ color: pricePanelInkMuted }}>
            {amount}
          </Typography>
        )
      ) : (
        <Typography variant="body2" sx={{ color: pricePanelInkMuted }}>
          Nightly rate unavailable
        </Typography>
      )}
      <Typography
        variant="caption"
        component="p"
        sx={{ color: pricePanelInkMuted, lineHeight: 1.35, pt: 0.25, pb: 0.25 }}
      >
        Compare offers from multiple partners
      </Typography>
      {linked ? (
        <Button
          component="span"
          variant="contained"
          disableElevation
          endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />}
          sx={buttonSx}
        >
          View details
        </Button>
      ) : (
        <ViewPhotosButton sx={buttonSx} />
      )}
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
            <Typography variant="body2" color="text.secondary">
              {profile.summary}
            </Typography>
          </Stack>
        ) : null}
        {profile.amenities.length > 0 ? (
          <Stack spacing={1}>
            <Typography variant="subtitle2" component="p">
              Amenities
            </Typography>
            <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: "wrap" }}>
              {profile.amenities.map((amenity) => (
                <Chip
                  key={amenity}
                  label={amenity}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: "divider", bgcolor: "action.hover" }}
                />
              ))}
            </Stack>
          </Stack>
        ) : null}
      </Stack>
    </>
  );
}

const featureChipSx = {
  maxWidth: "100%",
  height: "auto",
  borderColor: "divider",
  bgcolor: "action.hover",
  "& .MuiChip-label": { whiteSpace: "normal", lineHeight: 1.35, py: 0.55 },
  "& .MuiChip-icon": { color: dealGreen },
} as const;

function FeatureChips({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Stack direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: "wrap" }}>
      {items.map((item) => (
        <Chip
          key={item}
          size="small"
          variant="outlined"
          icon={<AutoAwesomeOutlinedIcon sx={{ fontSize: "16px !important" }} />}
          label={item}
          sx={featureChipSx}
        />
      ))}
    </Stack>
  );
}

function StayMeta({ checkIn, checkOut }: { checkIn: string; checkOut: string }) {
  const pillSx = {
    display: "inline-flex",
    alignItems: "center",
    gap: 0.5,
    fontSize: "0.75rem",
    lineHeight: 1.35,
    border: "1px solid",
    borderColor: "divider",
    color: "text.secondary",
    borderRadius: 999,
    px: 1,
    py: 0.35,
  } as const;

  return (
    <Stack direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: "wrap", pt: 0.25 }}>
      <Box component="span" sx={pillSx}>
        <AccessTimeOutlinedIcon sx={{ fontSize: 16, flexShrink: 0 }} aria-hidden />
        {`Check-in ${checkIn}`}
      </Box>
      <Box component="span" sx={pillSx}>
        <AccessTimeOutlinedIcon sx={{ fontSize: 16, flexShrink: 0 }} aria-hidden />
        {`Check-out ${checkOut}`}
      </Box>
    </Stack>
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
}: {
  profile: AccommodationProfile;
  nsid: Nsid;
  linked: boolean;
  titleComponent: "h1" | "h2";
}) {
  const location = locationLine(profile);
  const color = scoreColor(profile.ratingLabel);
  const stay =
    profile.checkIn && profile.checkOut
      ? `Check-in ${profile.checkIn} · Check-out ${profile.checkOut}`
      : null;

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
          minHeight: { xs: 200, md: 180 },
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
            minHeight: { xs: 200, md: 180 },
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
              top: 10,
              left: 10,
              bgcolor: "rgba(0,0,0,0.72)",
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: 700,
              px: 1,
              py: 0.4,
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
        spacing={1.5}
        sx={{
          px: 2.5,
          py: 2.25,
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
            fontWeight: 800,
            lineHeight: 1.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            transition: "color 0.2s ease",
          }}
        >
          {profile.name}
        </Typography>
        <Stack
          direction="row"
          useFlexGap
          spacing={1.25}
          sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1 }}
        >
          {profile.stars !== null ? <Stars value={profile.stars} /> : null}
          {profile.stars !== null && profile.ratingValue !== null ? (
            <Box
              component="span"
              aria-hidden
              sx={{ width: "1px", height: 20, bgcolor: "divider", flexShrink: 0 }}
            />
          ) : null}
          {profile.ratingValue !== null ? (
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                px: 1,
                py: 0.35,
                borderRadius: 1.5,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "action.hover",
              }}
            >
              <Box
                component="span"
                sx={{
                  bgcolor: color,
                  color: "#fff",
                  fontSize: "0.875rem",
                  fontWeight: 800,
                  borderRadius: 1,
                  px: 0.85,
                  py: 0.35,
                  minWidth: 36,
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {formatScore(profile.ratingValue)}
              </Box>
              <Typography variant="body2" component="span">
                {profile.ratingLabel ? (
                  <Box component="strong" sx={{ color, fontWeight: 700 }}>
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
          <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
            <PlaceOutlinedIcon
              sx={{ fontSize: 20, mt: 0.1, color: "text.secondary", flexShrink: 0 }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {location}
            </Typography>
          </Stack>
        ) : null}
        <FeatureSummary nsid={nsid} amenities={profile.amenities} />
        {profile.checkIn && profile.checkOut ? (
          <StayMeta checkIn={profile.checkIn} checkOut={profile.checkOut} />
        ) : stay ? (
          <Typography variant="caption" color="text.secondary" sx={{ pt: 0.25 }}>
            {stay}
          </Typography>
        ) : null}
      </Stack>
      <PricePanel profile={profile} linked={linked} />
    </Box>
  );
}

export function ListingCardSkeleton() {
  return (
    <Card variant="outlined" sx={{ overflow: "hidden", borderRadius: 3 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "232px minmax(0, 1fr) 196px" },
        }}
      >
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{ minHeight: { xs: 200, md: 180 }, borderRadius: 0 }}
        />
        <Stack spacing={1.25} sx={{ px: 2.5, py: 2.25 }}>
          <Skeleton variant="text" width="92%" height={32} />
          <Skeleton variant="text" width="58%" height={28} />
          <Skeleton variant="text" width="78%" height={22} />
          <Skeleton variant="rounded" width="70%" height={28} />
          <Stack direction="row" spacing={1}>
            <Skeleton variant="rounded" width={120} height={28} />
            <Skeleton variant="rounded" width={140} height={28} />
          </Stack>
        </Stack>
        <Stack spacing={1.25} sx={{ px: 2.5, py: 2.25, bgcolor: pricePanelBg }}>
          <Skeleton variant="text" width="45%" />
          <Skeleton variant="text" width="70%" height={40} />
          <Skeleton variant="rounded" height={40} />
        </Stack>
      </Box>
    </Card>
  );
}

async function ListingCardProfile({
  nsid,
  linked,
  expanded,
  titleComponent,
}: {
  nsid: Nsid;
  linked: boolean;
  expanded: boolean;
  titleComponent: "h1" | "h2";
}) {
  const profile =
    (await fetchAccommodationProfile(nsid)) ??
    emptyAccommodationProfile(accommodationFallbackLabel(nsid));

  return (
    <>
      <ListingCardBody
        profile={profile}
        nsid={nsid}
        linked={linked}
        titleComponent={titleComponent}
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
}: {
  nsid: Nsid;
  linkToGallery: boolean;
  expanded?: boolean;
  titleComponent?: "h1" | "h2";
}) {
  const fallback = emptyAccommodationProfile(accommodationFallbackLabel(nsid));
  const body = (
    <Suspense
      fallback={
        <ListingCardBody
          profile={fallback}
          nsid={nsid}
          linked={linkToGallery}
          titleComponent={titleComponent}
        />
      }
    >
      <ListingCardProfile
        nsid={nsid}
        linked={linkToGallery}
        expanded={expanded}
        titleComponent={titleComponent}
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
