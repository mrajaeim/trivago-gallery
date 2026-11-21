
"use client";

import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const dealGreen = "#008a05";

export function AboutSummary({ text }: { text: string }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const textId = useId();

  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  // Reset the presentation when the description changes.
  useLayoutEffect(() => {
    setExpanded(false);
  }, [text]);

  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element || expanded) return;

    let active = true;

    const measure = () => {
      if (!active) return;

      setTruncated(
        element.scrollHeight > element.clientHeight + 1,
      );
    };

    measure();

    // Observe the container, whose width controls wrapping.
    const container = element.parentElement;

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;

    if (container) {
      observer?.observe(container);
    }

    // Recheck after web fonts finish loading.
    void document.fonts?.ready.then(measure);

    return () => {
      active = false;
      observer?.disconnect();
    };
  }, [expanded, text]);

  return (
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Typography
        id={textId}
        ref={textRef}
        variant="body2"
        color="text.secondary"
        sx={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {text}
      </Typography>

      {truncated && (
        <Link
          component="button"
          type="button"
          underline="hover"
          aria-controls={textId}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          sx={{
            alignSelf: "flex-start",
            color: dealGreen,
            fontSize: "0.8125rem",
            fontWeight: 700,
            lineHeight: 1.4,
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          {expanded ? "Read less" : "Read more"}
        </Link>
      )}
    </Stack>
  );
}