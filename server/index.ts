import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// A criação do 'app' e a configuração dos middlewares síncronos continuam iguais.
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/**
 * Função assíncrona para configurar e retornar o app.
 * Isso garante que todas as rotas e middlewares assíncronos
 * sejam registrados antes do app ser exportado.
 */
async function setupApp() {
  // A Vercel não retorna um servidor, então ignoramos o retorno de registerRoutes
  await registerRoutes(app);

  // Middleware para tratamento de erros
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });
  
  // A lógica de `serveStatic` é redundante na Vercel por causa do `vercel.json`,
  // mas não causa problemas mantê-la.
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  }

  return app;
}

// Exportamos a PROMESSA que resolverá com o app configurado.
// A Vercel saberá como lidar com isso.
export default setupApp();
