export type GalleryGroupCount = {
  ns: number;
  id: number;
  imageCount: number;
};

export type GalleryTile = {
  imageId: string;
  width: number;
  height: number;
  advertisers: string[];
  groups: Array<{ ns: number; id: number }>;
  src: string | null;
};

const GROUP_TITLES: Record<string, string> = {
  "2002:1": "Rooms",
  "2002:2": "Bathroom",
  "2002:3": "Other",
  "2002:4": "Dining",
  "2002:6": "Fitness",
  "2002:8": "Surroundings",
  "2002:11": "Pool",
};

export function galleryImageUrl(urlTail: string, width: number): string | null {
  if (!urlTail.startsWith("/") || urlTail.startsWith("//")) {
    return null;
  }

  return `https://imgcy.trivago.com/c_limit,d_dummy.jpeg,f_auto,q_auto,w_${width}${urlTail}`;
}

export function groupTitle(ns: number, id: number): string | null {
  return GROUP_TITLES[`${ns}:${id}`] ?? null;
}

export function groupLabel(ns: number, id: number): string {
  return groupTitle(ns, id) ?? `${ns}:${id}`;
}

export function groupTitles(groups: Array<{ ns: number; id: number }>): string[] {
  return [
    ...new Set(
      groups.flatMap((group) => {
        const title = groupTitle(group.ns, group.id);
        return title ? [title] : [];
      }),
    ),
  ];
}

export function decodeImageId(value: string): string | null {
  try {
    const decoded = decodeURIComponent(value);
    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

export function accommodationPath(ns: number, id: number): string {
  return `/accommodation/${ns}/${id}`;
}

export function photoPath(ns: number, id: number, imageId: string): string {
  return `${accommodationPath(ns, id)}/photos/${encodeURIComponent(imageId)}`;
}
