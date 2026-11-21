import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Alert from "@mui/material/Alert";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { AppLink } from "@/components/next-link";
import { accommodationPath } from "@/lib/trivago/gallery-shared";
import type { GalleryFailure, Nsid } from "@/lib/trivago/gallery";

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

export function PhotoGalleryNotice({
  failure,
  nsid,
  children,
}: {
  failure: GalleryFailure;
  nsid: Nsid;
  children?: ReactNode;
}) {
  return (
    <Stack spacing={2}>
      {children}
      {failure.reason === "not-found" ? (
        <Alert severity="info">
          No gallery was returned for this accommodation.
        </Alert>
      ) : failure.reason === "invalid-response" ? (
        <Alert severity="error">
          <Typography component="h2" variant="h6">
            Gallery response was incomplete
          </Typography>
          <Typography>
            The accommodation was found, but its photo fields were not usable.
          </Typography>
          <List dense disablePadding sx={{ my: 1, listStyleType: "disc", pl: 2.5 }}>
            {failure.messages.map((message) => (
              <ListItem key={message} disableGutters sx={{ display: "list-item", py: 0 }}>
                <ListItemText primary={message} />
              </ListItem>
            ))}
          </List>
        </Alert>
      ) : (
        <GalleryAlert failure={failure} />
      )}
      <AppLink
        href={accommodationPath(nsid.ns, nsid.id)}
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
    </Stack>
  );
}
