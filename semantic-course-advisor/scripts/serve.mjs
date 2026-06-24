import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const projectName = path.basename(root);
const preferredPort = Number(process.env.PORT || 5173);

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".rq": "text/plain; charset=utf-8",
  ".ttl": "text/turtle; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
    const pathname = normalizePathname(decodeURIComponent(url.pathname));
    const resolved = path.resolve(root, `.${pathname}`);
    const target = resolved.startsWith(root) ? resolved : path.join(root, "app", "index.html");
    const filePath = existsSync(target) && statSync(target).isFile() ? target : path.join(target, "index.html");

    if (!existsSync(filePath)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    const stream = createReadStream(filePath);
    stream.on("error", () => {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Unable to read file");
    });
    stream.pipe(res);
  });
}

function normalizePathname(pathname) {
  if (pathname === "/") return "/app/index.html";
  if (pathname === `/${projectName}`) return "/app/index.html";
  if (pathname.startsWith(`/${projectName}/`)) return pathname.slice(projectName.length + 1);
  return pathname;
}

function listen(port) {
  const server = createServer();
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && port < preferredPort + 20) {
      listen(port + 1);
      return;
    }
    throw error;
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`Semantic Career Recommendation Platform running at http://127.0.0.1:${port}/app/`);
  });
}

listen(preferredPort);
