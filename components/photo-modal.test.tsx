import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PhotoModalToolbar } from "@/components/photo-modal";

describe("PhotoModalToolbar", () => {
  it("offers share, full screen, and open in a new tab", () => {
    const html = renderToStaticMarkup(
      <PhotoModalToolbar
        href="/accommodation/100/102762"
        fullScreen={false}
        shareStatus="idle"
        onShare={() => undefined}
        onToggleFullScreen={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(html).toContain('aria-label="Share"');
    expect(html).toContain('aria-label="Full screen"');
    expect(html).toContain('aria-label="Open in new tab"');
    expect(html).toContain('href="/accommodation/100/102762"');
    expect(html).toContain('target="_blank"');
  });
});
