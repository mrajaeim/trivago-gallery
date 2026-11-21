"use client";

import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container
      component="main"
      maxWidth={false}
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: "48rem",
        mx: "auto",
        px: 3,
        py: 8,
      }}
    >
      <Stack spacing={2}>
        <Typography variant="h5" component="h1">
          Something went wrong
        </Typography>
        <Typography color="text.secondary">
          The accommodation page could not be shown.
        </Typography>
        <Button
          variant="contained"
          onClick={() => retry()}
          sx={{ alignSelf: "flex-start" }}
        >
          Try again
        </Button>
      </Stack>
    </Container>
  );
}
