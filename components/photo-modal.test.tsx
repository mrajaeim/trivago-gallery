import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhotoModalToolbar, sharePage } from "@/components/photo-modal";

function stubNavigator(value: {
  share?: () => Promise<void>;
  clipboard?: { writeText: (text: string) => Promise<void> };
}) {
  vi.stubGlobal("navigator", value);
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    writable: true,
    value,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PhotoModalToolbar", () => {
  it("offers share, full screen, and open in a new tab", () => {
    const html = renderToStaticMarkup(
      <PhotoModalToolbar
        href="/accommodation/100/102762"
        shareStatus="idle"
        onShare={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(html).toContain('aria-label="Share"');
    expect(html).toContain('href="/accommodation/100/102762" aria-label="Full screen"');
    expect(html).toContain('aria-label="Open in new tab"');
    expect(html).toContain('target="_blank"');
    expect(html).not.toMatch(/aria-label="Full screen"[^>]*target="_blank"/);
    expect(html).not.toMatch(/aria-label="Share"[^>]*\sdisabled/);
  });

  it("disables share and open in a new tab until the destination is ready", () => {
    const html = renderToStaticMarkup(
      <PhotoModalToolbar
        href={null}
        shareStatus="idle"
        onShare={() => undefined}
        onClose={() => undefined}
      />,
    );

    expect(html).toContain('aria-label="Share"');
    expect(html).toContain('aria-label="Open in new tab"');
    expect(html).toContain('aria-label="Full screen"');
    expect(html).toContain('aria-label="Close"');
    expect(html).not.toContain('href="#"');
    expect(html).toContain('disabled="" aria-label="Share"');
    expect(html).toContain('disabled="" aria-label="Full screen"');
    expect(html).toContain('disabled="" aria-label="Open in new tab"');
  });
});

describe("sharePage", () => {
  it("returns cancelled when the user dismisses the share dialog", async () => {
    const writeText = vi.fn();
    const abort = Object.assign(new Error("The operation was aborted."), {
      name: "AbortError",
    });
    vi.stubGlobal("document", { title: "trivago gallery" });
    stubNavigator({
      share: vi.fn(async () => {
        throw abort;
      }),
      clipboard: { writeText },
    });

    await expect(sharePage("https://example.com/accommodation/100/102762")).resolves.toBe(
      "cancelled",
    );
    expect(writeText).not.toHaveBeenCalled();
  });

  it("returns failed when clipboard write is denied", async () => {
    stubNavigator({
      clipboard: {
        writeText: vi.fn(async () => {
          throw new Error("denied");
        }),
      },
    });

    await expect(sharePage("https://example.com/accommodation/100/102762")).resolves.toBe(
      "failed",
    );
  });
});
