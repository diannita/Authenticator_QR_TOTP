const Express = require("express");
const BodyParser = require("body-parser");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

const app = Express();
const LABEL = "My QR Code Generator";
const ISSUER = "Diana Rodriguez";

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

// Genera un secreto TOTP y un código QR
app.get("/totp-secret", async (req, res) => {
  try {
    // Genera un secreto TOTP de 20 caracteres
    const secret = speakeasy.generateSecret({ length: 20 });
    // Genera una URL otpauth para el secreto generado
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: LABEL,
      issuer: ISSUER,
      algorithm: "sha1",
    });
    // Genera una imagen de código QR para la URL otpauth
    const imageUrl = await qrcode.toDataURL(otpauthUrl);
    // Envía la imagen de código QR y el secreto generado al cliente
    res.send(`
      <p>Scan this QR code with Google Authenticator:</p>
      <img src="${imageUrl}"/>
      <p>Or manually enter this base32 secret:</p>
      <pre>${secret.base32}</pre>
    `);
  } catch (err) {
    // Envía un error 500 si hay un problema generando el código QR
    res.status(500).send("Error generating QR code");
  }
});

// Genera un token TOTP
app.post("/totp-generate", (req, res) => {
  const { secret } = req.body;
  // Genera un token TOTP utilizando el secreto proporcionado
  const token = speakeasy.totp({
    secret,
    encoding: "base32",
  });
  // Calcula el tiempo restante antes de que el token expire
  const remaining = 30 - Math.floor((new Date().getTime() / 1000.0) % 30);
  // Envía el token y el tiempo restante al cliente
  res.send({
    token,
    remaining,
  });
});

// Valida un token TOTP
app.post("/totp-validate", (req, res) => {
  const { secret, token } = req.body;
  try {
    // Valida el token TOTP utilizando el secreto proporcionado
    const valid = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 0,
    });
    // Envía si el token es válido o no al cliente
    res.send({
      valid,
    });
  } catch (err) {
    // Envía un error 500 si hay un problema validando el token TOTP
    res.status(500).send("Error validating TOTP token");
  }
});

// Inicia el servidor en el puerto 3000
app.listen(3000, () => {
  console.log("Listening on port: 3000...");
});
