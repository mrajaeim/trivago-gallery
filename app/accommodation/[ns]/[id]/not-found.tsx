import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AppLink } from "@/components/next-link";

export default function NotFound() {
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
          Accommodation not found
        </Typography>
        <Typography color="text.secondary">
          That accommodation or photo is not available.
        </Typography>
        <AppLink
          href="/"
          underline="none"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            alignSelf: "flex-start",
          }}
        >
          <ArrowBackIcon fontSize="small" />
          Home
        </AppLink>
      </Stack>
    </Container>
  );
}
