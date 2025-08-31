import React from "react";
import { Box, Container, Grid, Typography, Link, IconButton, Stack, Paper, Divider } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import EmailIcon from "@mui/icons-material/Email";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import SchoolIcon from "@mui/icons-material/School";
import CodeIcon from "@mui/icons-material/Code";

const githubUrl = "https://github.com/NamNguyen1909";
const email = "namnguyen19092004@gmail.com";
const linkedinUrl = "https://www.linkedin.com/in/nam-nguyen-1909-";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.light} 100%)`,
        color: "#222",
        py: 5,
        position: "relative",
        overflow: "hidden",
        borderTop: "1px solid #e0e0e0",
      }}
    >
      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                background: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(6px)",
                border: "1px solid #e0e0e0",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <CodeIcon sx={{ color: "#1976d2", fontSize: 22 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: "bold", color: "#1976d2" }}>
                  Developed by
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <IconButton
                  component="a"
                  href={githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: "#18181b" }}
                  aria-label="GitHub"
                >
                  <GitHubIcon />
                </IconButton>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  NamNguyen1909
                </Typography>
                <IconButton
                  component="a"
                  href={`mailto:${email}`}
                  sx={{ color: "#c62828" }}
                  aria-label="Email"
                >
                  <EmailIcon />
                </IconButton>
                <Typography variant="body2" sx={{ fontWeight: 400 }}>
                  {email}
                </Typography>
                <IconButton
                  component="a"
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: "#0077b5" }}
                  aria-label="LinkedIn"
                >
                  <LinkedInIcon />
                </IconButton>
                <Typography variant="body2" sx={{ fontWeight: 400 }}>
                  LinkedIn
                </Typography>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: { xs: "center", md: "right" } }}>
              <SchoolIcon sx={{ color: "#1976d2", mr: 1, verticalAlign: "middle" }} />
              <Typography variant="body2" sx={{ color: "#333", display: "inline" }}>
                © {currentYear} Smart Learning Platform. All rights reserved.
              </Typography>
            </Box>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3, borderColor: "#e0e0e0" }} />
        <Typography variant="caption" sx={{ color: "#888", textAlign: "center", display: "block" }}>
          Empowering learners & tutors with modern technology.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;