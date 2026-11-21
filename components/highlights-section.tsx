import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CdnImage } from "@/components/cdn-image";
import { AppLink, CardLink } from "@/components/next-link";
import { accommodationPath } from "@/lib/trivago/gallery-shared";
import {
  fetchAccommodationHighlights,
  type HighlightView,
  type Nsid,
} from "@/lib/trivago/highlights";

function sentimentLabel(sentiment: HighlightView["sentiment"]) {
  if (sentiment === "POSITIVE") {
    return "Positive";
  }
  if (sentiment === "NEGATIVE") {
    return "Caution";
  }
  return "Neutral";
}

function sentimentColor(
  sentiment: HighlightView["sentiment"],
): "success" | "warning" | "default" {
  if (sentiment === "POSITIVE") {
    return "success";
  }
  if (sentiment === "NEGATIVE") {
    return "warning";
  }
  return "default";
}

function HighlightCard({
  highlight,
  nsid,
  linkToGallery,
}: {
  highlight: HighlightView;
  nsid: Nsid;
  linkToGallery: boolean;
}) {
  const content = (
  <>
      <CardContent>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
          >
            <Typography variant="h6" component="h2">
              {highlight.title}
            </Typography>
            <Chip
              label={sentimentLabel(highlight.sentiment)}
              color={sentimentColor(highlight.sentiment)}
              size="small"
              sx={{ flexShrink: 0 }}
            />
          </Stack>
          {highlight.imageSrc ? (
            <CdnImage
              src={highlight.imageSrc}
              width={16}
              height={10}
              alt=""
              sx={{ borderRadius: 2, objectFit: "cover" }}
            />
          ) : null}
          <Typography color="text.secondary">{highlight.description}</Typography>
        </Stack>
      </CardContent>
      {linkToGallery ? (
        <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
          <Button
            component="span"
            size="small"
            variant="outlined"
            endIcon={<ChevronRightIcon />}
            sx={{ pointerEvents: "none" }}
          >
            View photos
          </Button>
        </CardActions>
      ) : null}
    </>
  );

  if (!linkToGallery) {
    return (
      <Card variant="outlined">
        <Box sx={{ opacity: 0.98 }}>{content}</Box>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ "&:hover": { boxShadow: 1 } }}>
      <CardLink href={accommodationPath(nsid.ns, nsid.id)} scroll={false}>
        {content}
      </CardLink>
    </Card>
  );
}

export function HighlightsSectionHeader({
  context,
  displayName,
}: {
  context: "home" | "accommodation";
  displayName: string;
}) {
  return (
    <Stack component="header" spacing={1.5}>
      <Stack spacing={1}>
        <Typography id="accommodation-intro" variant="h5" component="h2">
          Accommodation
        </Typography>
        <Chip
          label={displayName}
          size="small"
          variant="outlined"
          sx={{ alignSelf: "flex-start", fontWeight: 500, maxWidth: "100%" }}
        />
      </Stack>
      {context === "home" ? (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: "36rem" }}>
          Open a card to view its photos in a dialog while Home stays underneath.
        </Typography>
      ) : (
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            Same linked cards as on <AppLink href="/">Home</AppLink>; each opens this
            accommodation&apos;s gallery.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Descriptions are AI-generated and not independently verified.
          </Typography>
        </Stack>
      )}
    </Stack>
  );
}

export function HighlightsSectionHeaderSkeleton({
  context,
}: {
  context: "home" | "accommodation";
}) {
  return (
    <Stack spacing={1.5} aria-hidden="true">
      <Skeleton variant="text" width={140} height={36} />
      <Skeleton variant="rounded" width="min(100%, 20rem)" height={28} />
      <Skeleton variant="text" width="min(100%, 28rem)" />
      {context === "accommodation" ? <Skeleton variant="text" width={200} /> : null}
    </Stack>
  );
}

export function HighlightsSkeleton() {
  return (
    <Stack spacing={2} aria-hidden="true">
      {["one", "two", "three"].map((key) => (
        <Skeleton key={key} variant="rounded" height={128} />
      ))}
    </Stack>
  );
}

export function AccommodationHighlightsFallback() {
  return (
    <Stack spacing={2.5} aria-hidden="true">
      <HighlightsSectionHeaderSkeleton context="accommodation" />
      <HighlightsSkeleton />
    </Stack>
  );
}

function FailureAlert({
  title,
  status,
  messages,
}: {
  title: string;
  status: number | null;
  messages: string[];
}) {
  const statusLabel = status === null ? "No HTTP response" : `HTTP ${status}`;

  return (
    <Alert severity="error">
      <Typography component="h2" variant="h6">
        {title}
      </Typography>
      <Typography>
        This was a live request to trivago with no session cookies. {statusLabel}.
      </Typography>
      <List dense disablePadding sx={{ my: 1, listStyleType: "disc", pl: 2.5 }}>
        {messages.map((message) => (
          <ListItem key={message} disableGutters sx={{ display: "list-item", py: 0 }}>
            <ListItemText primary={message} />
          </ListItem>
        ))}
      </List>
    </Alert>
  );
}

export async function HighlightsSection({
  nsid,
  linkToGallery = true,
}: {
  nsid: Nsid;
  linkToGallery?: boolean;
}) {
  const result = await fetchAccommodationHighlights(nsid);

  if (!result.ok) {
    return (
      <FailureAlert
        title="Accommodation request failed"
        status={result.status}
        messages={result.messages}
      />
    );
  }

  if (result.highlights.length === 0) {
    return (
      <Alert severity="info">
        No accommodation details were returned for this property.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      {result.highlights.map((highlight) => (
        <HighlightCard
          key={highlight.id}
          highlight={highlight}
          nsid={nsid}
          linkToGallery={linkToGallery}
        />
      ))}
    </Stack>
  );
}
