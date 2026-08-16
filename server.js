const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Canonical host for the SpeedSpin brand. Override with CANONICAL_HOST if the
// site is served from a staging or preview domain.
const CANONICAL_HOST = process.env.CANONICAL_HOST || "speedspin.com";

// quantumvaultassets.com is no longer served by this project, so there is
// nothing left to redirect from it. What remains is plain www canonicalisation
// so the site answers on a single hostname.
const LEGACY_HOSTS = [`www.${CANONICAL_HOST}`];

app.set("trust proxy", true);

app.use((req, res, next) => {
  // Redirects are disabled unless we know which host the request arrived on,
  // which keeps local development and health checks working untouched.
  const host = (req.headers.host || "").toLowerCase().split(":")[0];
  if (!host || !LEGACY_HOSTS.includes(host)) return next();

  // Never redirect the canonical host to itself, whatever CANONICAL_HOST is set
  // to — otherwise a value that also matches a legacy host would 301 the domain
  // to itself and loop until the browser gives up.
  if (host === CANONICAL_HOST.toLowerCase()) return next();

  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  return res.redirect(301, `${protocol}://${CANONICAL_HOST}${req.originalUrl}`);
});

// `extensions` lets /terms resolve to public/terms.html. Without it the
// catch-all below would swallow those paths and quietly serve the homepage.
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
