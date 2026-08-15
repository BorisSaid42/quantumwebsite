const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Canonical host for the SpeedSpin brand. Override with CANONICAL_HOST if the
// site is served from a staging or preview domain.
const CANONICAL_HOST = process.env.CANONICAL_HOST || "speedspin.com";

// Legacy hosts kept alive purely to hand their traffic and link equity over to
// speedspin.com. Everything is redirected with a 301 so search engines move the
// index across rather than treating the new domain as a separate site.
const LEGACY_HOSTS = [
  "quantumvaultassets.com",
  "www.quantumvaultassets.com",
  `www.${CANONICAL_HOST}`,
];

app.set("trust proxy", true);

app.use((req, res, next) => {
  // Redirects are disabled unless we know which host the request arrived on,
  // which keeps local development and health checks working untouched.
  const host = (req.headers.host || "").toLowerCase().split(":")[0];
  if (!host || !LEGACY_HOSTS.includes(host)) return next();

  // Never redirect the canonical host to itself. Without this, pointing
  // CANONICAL_HOST at a host that is also in LEGACY_HOSTS — for example setting
  // it back to quantumvaultassets.com to postpone the cutover — would 301 that
  // domain to itself and loop until the browser gives up.
  if (host === CANONICAL_HOST.toLowerCase()) return next();

  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  return res.redirect(301, `${protocol}://${CANONICAL_HOST}${req.originalUrl}`);
});

app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
