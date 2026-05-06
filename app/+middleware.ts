// app/+middleware.ts

/*
import { authMiddleware } from "../middlewares/auth";
import { loggingMiddleware } from "../middlewares/logging";
import { rateLimitMiddleware } from "../middlewares/rateLimit";

export default function middleware(request: Request) {
  const { pathname } = new URL(request.url);

  // logging em tudo
  const log = loggingMiddleware(request);
  if (log) return log;

  // auth só nas rotas /api/*
  if (pathname.startsWith("/api/")) {
    const auth = authMiddleware(request);
    if (auth) return auth;
  }

  // rate limit só em /api/public/*
  if (pathname.startsWith("/api/public/")) {
    const rate = rateLimitMiddleware(request);
    if (rate) return rate;
  }
}*/
