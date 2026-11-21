import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import { GalleryGrid } from "@/components/gallery-grid";
import { AppLink } from "@/components/next-link";
import { accommodationLabel } from "@/lib/trivago/accommodation-name";
import {
  fetchAccommodationImageCount,
  fetchAccommodationImages,
  readRouteNsid,
  type GalleryFailure,
} from "@/lib/trivago/gallery";

function GalleryAlert({ failure }: { failure: GalleryFailure }) {
  const status =
    failure.status === null ? "No HTTP response" : `HTTP ${failure.status}`;

  return (
    <Alert severity="error">
      <Typography component="h2" variant="h6">
        Gallery request failed
      </Typography>
      <Typography>
        This was a live request to trivago with no session cookies. {status}.
      </Typography>
      <List dense disablePadding sx={{ my: 1, listStyleType: "disc", pl: 2.5 }}>
        {failure.messages.map((message) => (
          <ListItem key={message} disableGutters sx={{ display: "list-item", py: 0 }}>
            <ListItemText primary={message} />
          </ListItem>
        ))}
      </List>
    </Alert>
  );
}

export function GallerySkeleton() {
  return (
    <Stack spacing={3}>
      <Stack spacing={2.5}>
        <Skeleton variant="text" width={120} aria-hidden="true" />
        <Skeleton variant="rounded" width={200} height={28} aria-hidden="true" />
        <Stack spacing={1}>
          <Typography id="gallery-dialog-title" variant="h4" component="h1">
            Photos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Loading photos
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }} aria-hidden="true">
          {["a", "b", "c", "d", "e", "f"].map((key) => (
            <Skeleton key={key} variant="rounded" width={96} height={32} />
          ))}
        </Stack>
      </Stack>
      <Box
        aria-hidden="true"
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
        }}
      >
        {(
          [
            ["a", 2, 155],
            ["b", 2, 155],
            ["c", 2, 155],
            ["d", 3, 235],
            ["e", 3, 235],
            ["f", 2, 155],
            ["g", 2, 155],
            ["h", 2, 155],
          ] as const
        ).map(([key, span, height]) => (
          <Skeleton
            key={key}
            variant="rounded"
            sx={{ gridColumn: `span ${span}`, height }}
          />
        ))}
      </Box>
    </Stack>
  );
}

export async function GallerySection({
  params,
  presentation = "page",
}: {
  params: Promise<{ ns: string; id: string }>;
  presentation?: "page" | "modal";
}) {
  const { ns, id } = await params;
  const nsid = readRouteNsid(ns, id);
  if (!nsid) {
    notFound();
  }

  const [imagesResult, countResult, displayName] = await Promise.all([
    fetchAccommodationImages(nsid),
    fetchAccommodationImageCount(nsid),
    accommodationLabel(nsid),
  ]);

  const totalImageCount = countResult.ok ? countResult.totalImageCount : null;
  const partial =
    imagesResult.ok &&
    totalImageCount !== null &&
    imagesResult.images.length < totalImageCount;

  const helperText =
    presentation === "modal"
      ? "Filter by area, then choose a photo to open it. Close the dialog or use your browser back button to return."
      : "Filter by area, then choose a photo to view it full size.";

  return (
    <Stack component="section" spacing={3}>
      <Stack component="header" spacing={2}>
        {presentation === "page" ? (
          <Breadcrumbs aria-label="Breadcrumb">
            <AppLink href="/" underline="hover" color="inherit">
              Home
            </AppLink>
            <Typography color="text.primary">Photos</Typography>
          </Breadcrumbs>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Photo gallery
          </Typography>
        )}
        <Stack spacing={1.25}>
          <Chip
            label={displayName}
            size="small"
            variant="outlined"
            sx={{ alignSelf: "flex-start", fontWeight: 500, maxWidth: "100%" }}
          />
          <Typography id="gallery-dialog-title" variant="h4" component="h1">
            Photos
          </Typography>
          {imagesResult.ok && totalImageCount !== null ? (
            <Typography variant="body1" color="text.secondary">
              {partial
                ? `${totalImageCount} photos at this property · ${imagesResult.images.length} loaded on this page`
                : `${totalImageCount} photos at this property`}
            </Typography>
          ) : null}
          {imagesResult.ok && imagesResult.images.length > 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: "40rem" }}>
              {helperText}
            </Typography>
          ) : null}
        </Stack>
        {imagesResult.ok && !countResult.ok ? (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              The photo total could not be loaded.
            </Typography>
            <List
              dense
              disablePadding
              sx={{ my: 0, pl: 2.5, color: "text.secondary", listStyleType: "disc" }}
            >
              {countResult.messages.map((message) => (
                <ListItem key={message} disableGutters sx={{ display: "list-item", py: 0 }}>
                  <ListItemText primary={message} primaryTypographyProps={{ variant: "body2" }} />
                </ListItem>
              ))}
            </List>
          </Stack>
        ) : null}
      </Stack>
      {!imagesResult.ok && imagesResult.reason === "missing" ? (
        <Alert severity="info">
          No gallery was returned for this accommodation.
        </Alert>
      ) : null}
      {!imagesResult.ok && imagesResult.reason === "error" ? (
        <GalleryAlert failure={imagesResult} />
      ) : null}
      {imagesResult.ok && imagesResult.images.length === 0 ? (
        <Stack spacing={1}>
          <Alert severity="info">
            No photos were returned for this accommodation.
          </Alert>
          {totalImageCount !== null && totalImageCount > 0 ? (
            <Typography variant="body2" color="text.secondary">
              The gallery total is {totalImageCount}.
            </Typography>
          ) : null}
        </Stack>
      ) : null}
      {imagesResult.ok && imagesResult.images.length > 0 ? (
        <>
          <Divider />
          <GalleryGrid
          images={imagesResult.images.map((image) => ({
            imageId: image.imageId,
            width: image.width,
            height: image.height,
            advertisers: image.advertisers,
            groups: image.groups,
            src: image.srcTile,
          }))}
          groups={countResult.ok ? countResult.groups : []}
          totalImageCount={totalImageCount ?? imagesResult.images.length}
          partial={partial}
          ns={nsid.ns}
          id={nsid.id}
          />
          {presentation === "page" ? (
            <Typography variant="caption" display="block" color="text.secondary">
              Open any thumbnail to see the full image and move between photos with Previous and Next.
            </Typography>
          ) : null}
        </>
      ) : null}
    </Stack>
  );
}
