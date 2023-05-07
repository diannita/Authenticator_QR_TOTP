const express = require("express");
const bodyParser = require("body-parser");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

const app = express();
const LABEL = "My QR Code Generator";
const ISSUER = "Diana Rodriguez";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Generates a TOTP secret and QR code - npm start
app.get("/", async (req, res) => {
  try {
    // Generates a 20-character TOTP secret
    const secret = speakeasy.generateSecret({ length: 20 });
    // Generates an otpauth URL for the generated secret
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: LABEL,
      issuer: ISSUER,
      algorithm: "sha1",
    });
    // Generates a QR code image for the otpauth URL
    const imageUrl = await qrcode.toDataURL(otpauthUrl);
    // Sends the QR code image and generated secret to the client
    res.send(`
      <p>Scan this QR code with Google Authenticator:</p>
      <img src="${imageUrl}"/>
      <p>Or manually enter this base32 secret:</p>
      <pre>${secret.base32}</pre>
    `);
  } catch (err) {
    // Sends a 500 error if there is a problem generating the QR code
    res.status(500).send("Error generating QR code");
  }
});

// Generates a TOTP token
app.post("/totp-generate", (req, res) => {
  const { secret } = req.body;
  // Generates a TOTP token using the provided secret
  const token = speakeasy.totp({
    secret,
    encoding: "base32",
  });
  // Calculates the time remaining before the token expires
  const remaining = 30 - Math.floor((new Date().getTime() / 1000.0) % 30);
  // Sends the token and remaining time to the client
  res.send({
    token,
    remaining,
  });
});

// Validates a TOTP token
app.post("/totp-validate", (req, res) => {
  const { secret, token } = req.body;
  try {
    // Validates the TOTP token using the provided secret
    const valid = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 0,
    });
    // Sends whether the token is valid or not to the client
    res.send({
      valid,
    });
  } catch (err) {
    // Sends a 500 error if there is a problem validating the TOTP token
    res.status(500).send("Error validating TOTP token");
  }
});

// Starts the server on port 3000
app.listen(3000, () => {
  console.log("Listening on port: 3000...");
});
