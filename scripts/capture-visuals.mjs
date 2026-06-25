import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const chromePath =
  process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const mode = process.argv[2] ?? "app";
const appBase = process.env.APP_BASE ?? "http://127.0.0.1:5173/app/";
const outputRoot = path.join(
  projectRoot,
  "artifacts",
  "visual-verification",
  mode === "reference" ? "reference" : "final",
);

const views = [
  ["dashboard", "Dashboard", "overview"],
  ["search", "Career Search", "search"],
  ["recommendations", "Recommendations", "recommendations"],
  ["explorer", "Career Explorer", "career"],
  ["skill-gap", "Skill Gap & Plan", "skillgap"],
  ["knowledge-graph", "Knowledge Graph", "graph"],
  ["sparql", "SPARQL Viewer", "sparql"],
  ["ontology", "Ontology Viewer", "ontology"],
  ["statistics-evaluation", "Statistics & Eval", "statistics"],
  ["profile", "Profile", "profile"],
  ["settings", "Settings", "settings"],
];

class Cdp {
  constructor(webSocketUrl) {
    this.socket = new WebSocket(webSocketUrl);
    this.sequence = 0;
    this.pending = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      const request = this.pending.get(message.id);
      if (!request) return;
      this.pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.sequence;
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function waitForJson(url, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      // Chrome is still starting.
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function evaluate(cdp, expression) {
  const response = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text ?? "Browser evaluation failed");
  }
  return response.result.value;
}

async function navigate(cdp, url) {
  await cdp.send("Page.navigate", { url });
  await delay(900);
  await evaluate(
    cdp,
    `new Promise(resolve => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", resolve, { once: true });
    })`,
  );
  await delay(500);
}

async function screenshot(cdp, destination) {
  const capture = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(destination, Buffer.from(capture.data, "base64"));
}

async function setViewport(cdp, width, height, mobile = false) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });
}

async function selectReferenceView(cdp, label) {
  const found = await evaluate(
    cdp,
    `(() => {
      const wanted = ${JSON.stringify(label)};
      const button = [...document.querySelectorAll("button")].find(
        (item) => item.textContent.trim() === wanted
      );
      if (!button) return false;
      button.click();
      const main = document.querySelector("main");
      if (main) main.scrollTop = 0;
      return true;
    })()`,
  );
  if (!found) throw new Error(`Reference navigation button not found: ${label}`);
  await delay(350);
}

async function captureReference(cdp) {
  const templatePath = path.resolve(
    projectRoot,
    "..",
    "template",
    "Semantic Career Advisor (standalone).html",
  );
  const templateUrl = pathToFileURL(templatePath).href;
  await setViewport(cdp, 1440, 1000);
  await navigate(cdp, templateUrl);

  const desktopDir = path.join(outputRoot, "desktop");
  await mkdir(desktopDir, { recursive: true });
  for (const [slug, label] of views) {
    await selectReferenceView(cdp, label);
    await screenshot(cdp, path.join(desktopDir, `${slug}.png`));
    console.log(`Captured reference ${slug}`);
  }
}

async function captureApp(cdp) {
  const desktopDir = path.join(outputRoot, "desktop");
  const mobileDir = path.join(outputRoot, "mobile");
  await mkdir(desktopDir, { recursive: true });
  await mkdir(mobileDir, { recursive: true });

  await setViewport(cdp, 1440, 1000);
  for (const [slug, , tab] of views) {
    await navigate(cdp, `${appBase}?tab=${encodeURIComponent(tab)}`);
    await screenshot(cdp, path.join(desktopDir, `${slug}.png`));
    console.log(`Captured desktop ${slug}`);
  }
  await navigate(
    cdp,
    `${appBase}results.html?q=${encodeURIComponent("AI engineer Python machine learning")}`,
  );
  await screenshot(cdp, path.join(desktopDir, "search-results.png"));
  await navigate(
    cdp,
    `${appBase}results.html?q=${encodeURIComponent("Data Science Fundamentals")}&course=${encodeURIComponent("cad:DataScienceFundamentals")}&from=skillgap`,
  );
  await screenshot(cdp, path.join(desktopDir, "course-learning.png"));
  await navigate(
    cdp,
    `${appBase}results.html?q=${encodeURIComponent("Data Science Fundamentals")}&course=${encodeURIComponent("cad:DataScienceFundamentals")}&topic=${encodeURIComponent("cad:PythonNotebooks")}&from=skillgap`,
  );
  await screenshot(cdp, path.join(desktopDir, "topic-learning.png"));

  await setViewport(cdp, 390, 844, true);
  for (const [slug, , tab] of views) {
    await navigate(cdp, `${appBase}?tab=${encodeURIComponent(tab)}`);
    await screenshot(cdp, path.join(mobileDir, `${slug}.png`));
    console.log(`Captured mobile ${slug}`);
  }
  await navigate(
    cdp,
    `${appBase}results.html?q=${encodeURIComponent("AI engineer Python machine learning")}`,
  );
  await screenshot(cdp, path.join(mobileDir, "search-results.png"));
  await navigate(
    cdp,
    `${appBase}results.html?q=${encodeURIComponent("Data Science Fundamentals")}&course=${encodeURIComponent("cad:DataScienceFundamentals")}&from=skillgap`,
  );
  await screenshot(cdp, path.join(mobileDir, "course-learning.png"));
  await navigate(
    cdp,
    `${appBase}results.html?q=${encodeURIComponent("Data Science Fundamentals")}&course=${encodeURIComponent("cad:DataScienceFundamentals")}&topic=${encodeURIComponent("cad:PythonNotebooks")}&from=skillgap`,
  );
  await screenshot(cdp, path.join(mobileDir, "topic-learning.png"));
}

await mkdir(outputRoot, { recursive: true });
const profileDir = await mkdtemp(path.join(os.tmpdir(), "careergraph-capture-"));
const port = 9400 + Math.floor(Math.random() * 300);
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    "--window-size=1440,1000",
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true },
);

try {
  const targets = await waitForJson(`http://127.0.0.1:${port}/json/list`);
  const page = targets.find((target) => target.type === "page");
  if (!page) throw new Error("Chrome did not expose a page target");
  const cdp = new Cdp(page.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  if (mode === "reference") await captureReference(cdp);
  else if (mode === "app") await captureApp(cdp);
  else throw new Error(`Unknown capture mode: ${mode}`);

  cdp.close();
} finally {
  chrome.kill();
  await delay(300);
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
