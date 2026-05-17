import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Supabase Auth Callback Route
  // This route handles the redirect from Supabase/Google and communicates back to the popup opener
  app.get("/auth/callback", (req, res) => {
    // Note: Supabase often appends the tokens in a hash fragment (#) which the server doesn't see.
    // So we serve a minimal script that captures the hash and sends it to the opener if needed,
    // or just signals success.
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authenticating...</title>
        </head>
        <body>
          <script>
            // Supabase client handles the session automatically from the URL hash on the next load.
            // We just need to signal the parent window to refresh/check session and close this popup.
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              // Fallback if not opened as a popup
               window.location.href = '/';
            }
          </script>
          <p style="text-align: center; font-family: sans-serif; margin-top: 50px;">
            جاري تسجيل الدخول... سيتم إغلاق هذه النافذة تلقائياً.
          </p>
        </body>
      </html>
    `);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
