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

function scoreColor(label: string | null): string {
  if (label === "Excellent") {
    return "#007a33";
  }
  if (label === "Good") {
    return "#c77d00";
  }
  return "#3f7d12";
}

function featureLine(highlights: HighlightView[], amenities: string[]): string | null {
  const titles = highlights
    .filter((highlight) => highlight.sentiment === "POSITIVE")
    .slice(0, 2)
    .map((highlight) => highlight.title);
  if (titles.length > 0) {
    return titles.join(", ");
  }
  return amenities.length > 0 ? amenities.slice(0, 3).join(", ") : null;
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
          <StarIcon key={index} sx={{ fontSize: 18 }} />
        ) : (
          <StarBorderIcon key={index} sx={{ fontSize: 18 }} />
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
    fontWeight: 700,
    textTransform: "none",
    "&:hover": { bgcolor: "#006e04" },
  } as const;

  return (
    <Stack
      spacing={0.75}
      sx={{
        justifyContent: "center",
        bgcolor: "#e7f6ec",
        px: 2.5,
        py: 2,
      }}
    >
      {amount ? (
        profile.price ? (
          <>
            <Typography variant="body2" color="text.secondary">
              from
            </Typography>
            <Typography variant="h4" component="p" sx={{ fontWeight: 800, lineHeight: 1 }}>
              {amount}
            </Typography>
            {period ? (
              <Typography variant="body2" color="text.secondary">
                {period}
              </Typography>
            ) : null}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {amount}
          </Typography>
        )
      ) : (
        <Typography variant="body2" color="text.secondary">
          Nightly rate unavailable
        </Typography>
      )}
      {linked ? (
        <Button component="span" variant="contained" disableElevation sx={buttonSx}>
          View details
        </Button>
      ) : (
        <Button
          component="a"
          href="#photos"
          variant="contained"
          disableElevation
          sx={buttonSx}
        >
          View photos
        </Button>
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
                <Chip key={amenity} label={amenity} size="small" variant="outlined" />
              ))}
            </Stack>
          </Stack>
        ) : null}
      </Stack>
    </>
  );
}

function FeatureLine({ text }: { text: string }) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "flex-start" }}>
      <AutoAwesomeOutlinedIcon sx={{ fontSize: 18, mt: 0.15, color: "text.secondary" }} />
      <Typography variant="body2">{text}</Typography>
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
  const text = featureLine(highlights.ok ? highlights.highlights : [], amenities);
  return text ? <FeatureLine text={text} /> : null;
}

function FeatureSummary({
  nsid,
  amenities,
}: {
  nsid: Nsid;
  amenities: string[];
}) {
  const fallback = featureLine([], amenities);
  return (
    <Suspense fallback={fallback ? <FeatureLine text={fallback} /> : null}>
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
        gridTemplateColumns: { xs: "1fr", md: "220px minmax(0, 1fr) 210px" },
      }}
    >
      <Box sx={{ minHeight: 180, bgcolor: "action.hover" }}>
        <CdnImage
          src={profile.imageSrc}
          width={16}
          height={10}
          alt={profile.name}
          sx={{ height: "100%", minHeight: 180, objectFit: "cover", borderRadius: 0 }}
        />
      </Box>
      <Stack spacing={1.25} sx={{ px: 2.5, py: 2, justifyContent: "center" }}>
        <Typography
          id={titleComponent === "h1" ? "accommodation-title" : undefined}
          variant={titleComponent === "h1" ? "h5" : "h6"}
          component={titleComponent}
          sx={{ fontWeight: 800, lineHeight: 1.25 }}
        >
          {profile.name}
        </Typography>
        {profile.stars !== null ? <Stars value={profile.stars} /> : null}
        {profile.ratingValue !== null ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                bgcolor: color,
                color: "#fff",
                fontWeight: 800,
                borderRadius: 1,
                px: 0.75,
                py: 0.25,
                minWidth: 36,
                textAlign: "center",
                lineHeight: 1.4,
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
        {location ? (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "flex-start" }}>
            <PlaceOutlinedIcon sx={{ fontSize: 18, mt: 0.15, color: "text.secondary" }} />
            <Typography variant="body2" color="text.secondary">
              {location}
            </Typography>
          </Stack>
        ) : null}
        <FeatureSummary nsid={nsid} amenities={profile.amenities} />
        {stay ? (
          <Typography variant="caption" color="text.secondary">
            {stay}
          </Typography>
        ) : null}
      </Stack>
      <PricePanel profile={profile} linked={linked} />
    </Box>
  );
}

export function ListingCardSkeleton() {
  return <Skeleton variant="rounded" height={196} sx={{ borderRadius: 3 }} />;
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
    <Card variant="outlined" sx={{ overflow: "hidden", borderRadius: 3 }}>
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
