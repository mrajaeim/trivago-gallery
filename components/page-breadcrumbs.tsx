import Breadcrumbs from "@mui/material/Breadcrumbs";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { AppLink } from "@/components/next-link";

export type Crumb = {
  label: string;
  href?: string;
};

export function BreadcrumbFallback() {
  return <Skeleton variant="text" width={220} />;
}

export function PageBreadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <Breadcrumbs aria-label="Breadcrumb">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        if (last || !item.href) {
          return (
            <Typography key={`${item.label}-${index}`} color="text.primary">
              {item.label}
            </Typography>
          );
        }

        return (
          <AppLink
            key={item.href}
            href={item.href}
            underline="hover"
            color="inherit"
          >
            {item.label}
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
        { label, href },
        { label: "Photo" },
      ]}
    />
  );
}
