import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { AppLink } from "@/components/next-link";

export type Crumb = {
  label: string;
  href?: string;
  scroll?: boolean;
};

export function BreadcrumbFallback() {
  return <Skeleton variant="text" width={220} />;
}

const crumbShellSx = {
  display: "inline-flex",
  alignItems: "center",
  minWidth: 0,
  maxWidth: "100%",
} as const;

const crumbLabelSx = {
  fontSize: { xs: "0.75rem", sm: "0.875rem" },
  lineHeight: 1.5,
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;

const crumbLinkShellSx = {
  ...crumbShellSx,
  maxWidth: { xs: "38vw", sm: "none" },
} as const;

const crumbTextShellSx = {
  ...crumbShellSx,
  maxWidth: { xs: "28vw", sm: "none" },
} as const;

function CrumbLabel({ label }: { label: string }) {
  return (
    <Box component="span" sx={crumbLabelSx}>
      {label}
    </Box>
  );
}

const breadcrumbsSx = {
  lineHeight: 1.5,
  "& .MuiBreadcrumbs-ol": {
    flexWrap: { xs: "nowrap", sm: "wrap" },
    alignItems: "center",
    rowGap: 0.25,
  },
  "& .MuiBreadcrumbs-li": {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 0,
    minWidth: 0,
  },
  "& .MuiBreadcrumbs-li:not(.MuiBreadcrumbs-separator)": {
    flexShrink: { xs: 1, sm: 0 },
    maxWidth: "100%",
  },
  "& .MuiBreadcrumbs-separator": {
    display: "inline-flex",
    alignItems: "center",
    marginLeft: 0.5,
    marginRight: 0.5,
    lineHeight: 1,
  },
} as const;

export function PageBreadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <Breadcrumbs aria-label="Breadcrumb" sx={breadcrumbsSx}>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        if (last || !item.href) {
          return (
            <Typography
              key={`${item.label}-${index}`}
              variant="body2"
              component="span"
              color="text.primary"
              title={item.label}
              sx={{ ...crumbShellSx, ...crumbTextShellSx }}
            >
              <CrumbLabel label={item.label} />
            </Typography>
          );
        }

        return (
          <AppLink
            key={item.href}
            href={item.href}
            scroll={item.scroll}
            variant="body2"
            underline="hover"
            color="inherit"
            title={item.label}
            sx={{ ...crumbShellSx, ...crumbLinkShellSx }}
          >
            <CrumbLabel label={item.label} />
          </AppLink>
        );
      })}
    </Breadcrumbs>
  );
}

export function HomeCrumbs() {
  return <PageBreadcrumbs items={[{ label: "Home" }]} />;
}

export function PhotoTrail({
  label,
  href,
}: {
  label: string;
  href: string;
}) {
  return (
    <PageBreadcrumbs
      items={[
        { label: "Home", href: "/" },
        { label, href, scroll: false },
        { label: "Photo" },
      ]}
    />
  );
}
