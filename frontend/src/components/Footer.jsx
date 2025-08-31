import React from "react";
import { Box, Grid, Typography, Link, Divider, IconButton } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import EmailIcon from "@mui/icons-material/Email";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

const githubUrl = "https://github.com/NamNguyen1909";
const email = "namnguyen19092004@gmail.com";
const linkedinUrl = "https://www.linkedin.com/in/nam-nguyen-1909-";

const footerLinks = [
  { label: "Trang chủ", href: "/" },
  { label: "Khóa học", href: "/courses" },
  { label: "Giới thiệu", href: "/about" },
  { label: "Liên hệ", href: "/contact" },
];

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#222",
        color: "#fff",
        py: 4,
        px: { xs: 2, sm: 6 },
        mt: 6,
        fontSize: { xs: "0.95rem", sm: "1rem" },
      }}
    >
      <Grid
        container
        columns={12}
        spacing={{ xs: 2, sm: 4 }}
        alignItems="center"
        justifyContent="space-between"
        sx={{
          flexDirection: { xs: "column", sm: "row" },
          textAlign: { xs: "center", sm: "left" },
        }}
      >
    <Grid>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Smart Learning Platform
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              justifyContent: { xs: "center", sm: "flex-start" },
              mb: 1,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href={githubUrl}
              target="_blank"
              rel="noopener"
              sx={{
                display: "flex",
                alignItems: "center",
                color: "#fff",
                textDecoration: "none",
                mr: 2,
                "&:hover": { color: "#90caf9" },
              }}
            >
              <GitHubIcon sx={{ mr: { sm: 0.5 } }} />
              <Box sx={{ display: { xs: "none", sm: "inline" }, ml: 0.5 }}>NamNguyen1909</Box>
            </Link>
            <Link
              href={`mailto:${email}`}
              sx={{
                display: "flex",
                alignItems: "center",
                color: "#fff",
                textDecoration: "none",
                mr: 2,
                "&:hover": { color: "#90caf9" },
              }}
            >
              <EmailIcon sx={{ mr: { sm: 0.5 } }} />
              <Box sx={{ display: { xs: "none", sm: "inline" }, ml: 0.5 }}>{email}</Box>
            </Link>
            <Link
              href={linkedinUrl}
              target="_blank"
              rel="noopener"
              sx={{
                display: "flex",
                alignItems: "center",
                color: "#fff",
                textDecoration: "none",
                "&:hover": { color: "#90caf9" },
              }}
            >
              <LinkedInIcon sx={{ mr: { sm: 0.5 } }} />
              <Box sx={{ display: { xs: "none", sm: "inline" }, ml: 0.5 }}>Nam Nguyễn</Box>
            </Link>
          </Box>
        </Grid>
  <Grid sx={{ mt: { xs: 2, sm: 0 } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: "center",
              justifyContent: { xs: "center", sm: "flex-end" },
              gap: 2,
            }}
          >
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                underline="hover"
                sx={{
                  color: "#fff",
                  fontWeight: 500,
                  fontSize: { xs: "1rem", sm: "1.05rem" },
                  "&:hover": { color: "#90caf9" },
                  mx: { sm: 1 },
                  my: { xs: 0.5, sm: 0 },
                }}
              >
                {link.label}
              </Link>
            ))}
          </Box>
        </Grid>
      </Grid>
      <Divider sx={{ my: 3, borderColor: "#e0e0e0" }} />
      <Typography variant="body2" sx={{ color: "#bbb", textAlign: "center", mb: 1 }}>
        © 2025 Smart Learning Platform. All rights reserved.
      </Typography>
      <Typography variant="caption" sx={{ color: "#888", textAlign: "center", display: "block" }}>
        Empowering learners & tutors with modern technology.
      </Typography>
    </Box>
  );
};

export default Footer;