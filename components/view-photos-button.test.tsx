import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ViewPhotosButton } from "@/components/view-photos-button";

describe("ViewPhotosButton", () => {
  it("points at the photos section", () => {
    const html = renderToStaticMarkup(<ViewPhotosButton sx={{}} />);

    expect(html).toContain("View photos");
    expect(html).toContain('href="#photos"');
  });
});
