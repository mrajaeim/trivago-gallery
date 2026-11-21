import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { accommodationLabel } from "@/lib/trivago/accommodation-name";
import { readRouteNsid } from "@/lib/trivago/gallery";

export function AccommodationDialogHeading({ title }: { title: string }) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: 0, flex: 1, pr: { xs: 0.25, sm: 1 } }}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{
          lineHeight: 1.1,
          letterSpacing: "0.08em",
          display: { xs: "none", sm: "block" },
        }}
      >
        Hotel gallery
      </Typography>
      <Typography
        variant="subtitle1"
        component="p"
        title={title}
        sx={{
          fontWeight: 700,
          lineHeight: 1.25,
          fontSize: { xs: "1rem", sm: "1.0625rem" },
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: { xs: 2, sm: 1 },
          WebkitBoxOrient: "vertical",
          textOverflow: "ellipsis",
          whiteSpace: { xs: "normal", sm: "nowrap" },
        }}
      >
        {title}
      </Typography>
    </Stack>
  );
}

export async function AccommodationDialogTitle({
  params,
}: {
  params: Promise<{ ns: string; id: string }>;
}) {
  const { ns, id } = await params;
  const nsid = readRouteNsid(ns, id);
  const title = nsid ? await accommodationLabel(nsid) : "Accommodation";
  return <AccommodationDialogHeading title={title} />;
}
