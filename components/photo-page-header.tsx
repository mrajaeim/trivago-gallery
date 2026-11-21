import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { notFound } from "next/navigation";
import { PhotoTrail } from "@/components/page-breadcrumbs";
import { PhotoPageActions } from "@/components/photo-browser";
import { accommodationLabel } from "@/lib/trivago/accommodation-name";
import { readRouteNsid } from "@/lib/trivago/gallery";
import { accommodationPath } from "@/lib/trivago/gallery-shared";

const headerChromeSx = {
  borderRadius: { xs: 2, sm: 2.5 },
  overflow: "hidden",
  bgcolor: "background.paper",
} as const;

export function PhotoPageHeaderFallback() {
  return (
    <Paper variant="outlined" sx={headerChromeSx}>
      <Stack spacing={1} sx={{ px: { xs: 1, sm: 1.25 }, py: { xs: 0.9, sm: 1.1 } }}>
        <Skeleton variant="text" width="72%" height={22} />
        <Divider flexItem />
        <Stack direction="row" spacing={0.75} sx={{ width: "100%" }}>
          <Skeleton variant="rounded" height={40} sx={{ flex: 1, borderRadius: 1.75 }} />
          <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: 1.75 }} />
        </Stack>
      </Stack>
    </Paper>
  );
}

export async function PhotoPageHeader({
  params,
}: {
  params: Promise<{ ns: string; id: string }>;
}) {
  const { ns, id } = await params;
  const nsid = readRouteNsid(ns, id);
  if (!nsid) {
    notFound();
  }

  const label = await accommodationLabel(nsid);
  const detailHref = accommodationPath(nsid.ns, nsid.id);

  return (
    <Paper component="header" variant="outlined" sx={headerChromeSx}>
      <Stack spacing={0.85} sx={{ px: { xs: 1, sm: 1.25 }, py: { xs: 0.9, sm: 1.1 } }}>
        <PhotoTrail label={label} href={detailHref} />
        <Divider flexItem sx={{ borderColor: "divider" }} />
        <PhotoPageActions ns={nsid.ns} id={nsid.id} />
      </Stack>
    </Paper>
  );
}