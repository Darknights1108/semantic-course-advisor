import { mkdtemp, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";

const appBase = process.env.APP_BASE ?? "http://127.0.0.1:5173/app/";
const chromePath =
  process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profileDir = await mkdtemp(path.join(os.tmpdir(), "careergraph-ui-test-"));
const port = 9700 + Math.floor(Math.random() * 200);
const failures = [];
const consoleErrors = [];

class Cdp {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.method === "Runtime.exceptionThrown") {
        consoleErrors.push(message.params.exceptionDetails?.text ?? "Runtime exception");
      }
      if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
        consoleErrors.push(
          message.params.args.map((arg) => arg.value ?? arg.description ?? "").join(" "),
        );
      }
      const request = this.pending.get(message.id);
      if (!request) return;
      this.pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForChrome() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (response.ok) return response.json();
    } catch {
      // Chrome is starting.
    }
    await delay(100);
  }
  throw new Error("Chrome did not start");
}

async function evaluate(cdp, expression) {
  const response = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
  }
  return response.result.value;
}

async function navigate(cdp, url) {
  await cdp.send("Page.navigate", { url });
  await delay(1000);
  await evaluate(
    cdp,
    `new Promise(resolve => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", resolve, { once: true });
    })`,
  );
  await delay(300);
}

function record(results) {
  for (const result of results) {
    console.log(`${result.pass ? "PASS" : "FAIL"} | ${result.name}${result.detail ? ` | ${result.detail}` : ""}`);
    if (!result.pass) failures.push(result);
  }
}

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
  const targets = await waitForChrome();
  const page = targets.find((target) => target.type === "page");
  const cdp = new Cdp(page.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await navigate(cdp, `${appBase}?tab=dashboard`);
  record(
    await evaluate(
      cdp,
      `(async () => {
        const wait = (ms = 80) => new Promise(resolve => setTimeout(resolve, ms));
        const out = [];
        const check = (name, pass, detail = "") => out.push({ name, pass: Boolean(pass), detail: String(detail) });
        await document.fonts.ready;
        await document.fonts.load('14px "Plus Jakarta Sans"');
        await document.fonts.load('14px "JetBrains Mono"');
        check("Plus Jakarta Sans loaded", document.fonts.check('14px "Plus Jakarta Sans"'));
        check("JetBrains Mono loaded", document.fonts.check('14px "JetBrains Mono"'));
        check("desktop frame alignment", document.querySelector(".appFrame").getBoundingClientRect().left === 0 && document.querySelector(".sidebar").getBoundingClientRect().width === 248);
        check("desktop no horizontal overflow", document.documentElement.scrollWidth <= innerWidth, document.documentElement.scrollWidth + "/" + innerWidth);

        for (const name of ["dashboard","search","recommendations","explorer","skillgap","graph","sparql","stats","system","mobile"]) {
          document.querySelector('[data-tab="' + name + '"]').click();
          await wait();
          check("navigate " + name, document.querySelector(".tabPanel.is-active")?.id === "tab-" + name);
        }

        document.querySelector('[data-tab="dashboard"]').click();
        await wait();
        const tech = document.querySelector('[data-dashboard-filter="Technology"]');
        tech.click();
        await wait();
        check("dashboard filter", tech.classList.contains("is-active") && document.querySelectorAll(".matchCard").length > 0);
        const bookmarkId = document.querySelector("[data-bookmark]").dataset.bookmark;
        document.querySelector('[data-bookmark="' + bookmarkId + '"]').click();
        await wait();
        check("dashboard bookmark", document.querySelector('[data-bookmark="' + bookmarkId + '"]').getAttribute("aria-pressed") === "true");

        document.querySelector('[data-tab="search"]').click();
        await wait();
        const example = document.querySelector(".examples [data-query]");
        example.click();
        await wait();
        check("search example", document.querySelector("#searchInput").value === example.dataset.query);
        document.querySelector("#searchForm").requestSubmit();
        await wait();
        check("inline semantic search", Number(document.querySelector("#searchResultCount").textContent) > 0 && document.querySelectorAll(".inlineResultCard").length > 0);
        const typeInput = document.querySelector('[data-search-type="Skill Entity"]');
        typeInput.click();
        await wait();
        check("search entity filter", !typeInput.checked);
        const finance = document.querySelector('[data-search-industry="Finance"]');
        finance.click();
        await wait();
        check("search industry filter", finance.classList.contains("is-active"));

        document.querySelector('[data-tab="recommendations"]').click();
        await wait();
        const chipId = document.querySelector("#recommendInterestChoices [data-id]").dataset.id;
        const chipBefore = document.querySelector('#recommendInterestChoices [data-id="' + chipId + '"]').getAttribute("aria-pressed");
        document.querySelector('#recommendInterestChoices [data-id="' + chipId + '"]').click();
        await wait();
        check("recommendation interest chip", document.querySelector('#recommendInterestChoices [data-id="' + chipId + '"]').getAttribute("aria-pressed") !== chipBefore);
        document.querySelector("#recalculateButton").click();
        await wait(20);
        check("recommendation recalculate", document.querySelector("#recalculateButton").textContent.includes("updated"));
        check("recommendation cards", document.querySelectorAll(".recommendationRow").length >= 3);

        document.querySelector('[data-tab="explorer"]').click();
        await wait();
        const explorer = document.querySelector("#careerExplorerSelect");
        explorer.selectedIndex = 1;
        explorer.dispatchEvent(new Event("change", { bubbles: true }));
        await wait();
        check("career selector", explorer.selectedIndex === 1 && document.querySelector(".careerHero h2").textContent.length > 0);
        document.querySelector("[data-graph-career]").click();
        await wait();
        check("visualize subgraph", document.querySelector(".tabPanel.is-active")?.id === "tab-graph");
        const initialTransform = document.querySelector("#graphStage").getAttribute("transform");
        document.querySelector("#graphZoomIn").click();
        check("graph zoom", document.querySelector("#graphStage").getAttribute("transform") !== initialTransform);
        document.querySelector("#graphFit").click();

        document.querySelector('[data-tab="skillgap"]').click();
        await wait();
        const skillCareer = document.querySelector("#skillGapCareerSelect");
        skillCareer.selectedIndex = 1;
        skillCareer.dispatchEvent(new Event("change", { bubbles: true }));
        await wait();
        check("skill gap career selector", skillCareer.selectedIndex === 1);
        const skillButton = document.querySelector("[data-skill-id]");
        const selectedSkillId = skillButton.dataset.skillId;
        skillButton.click();
        await wait();
        check("skill gap skill interaction", !document.querySelector('[data-skill-id="' + selectedSkillId + '"]') || document.querySelector("#skillGapSummary").textContent.includes("%"));
        const planButton = document.querySelector("[data-add-plan]");
        planButton.click();
        check("add learning plan", planButton.textContent.includes("Added") && planButton.disabled);

        document.querySelector('[data-tab="sparql"]').click();
        await wait();
        document.querySelector('[data-query-id="recommendationSupport"]').click();
        await wait();
        check("SPARQL query tabs", document.querySelector('[data-query-id="recommendationSupport"]').classList.contains("is-active"));
        const keyword = document.querySelector("#queryKeywordInput");
        keyword.value = "Python";
        keyword.dispatchEvent(new Event("input", { bubbles: true }));
        await wait();
        check("SPARQL keyword", document.querySelector("#queryText").textContent.includes("SELECT") && document.querySelector("#queryRowCount").textContent.includes("row"));
        document.querySelector("#copyQueryButton").click();

        document.querySelector('[data-tab="stats"]').click();
        await wait();
        check("statistics metrics", document.querySelectorAll(".statisticsCard").length === 4);
        check("evaluation rows", document.querySelectorAll("#evaluationTable tbody tr").length === 4);

        document.querySelector('[data-tab="system"]').click();
        await wait();
        const demo = document.querySelector(".componentDemo button");
        demo.click();
        check("design system demo button", demo.classList.contains("is-demo-active"));

        document.querySelector("#notificationButton").click();
        check("notification popover", !document.querySelector("#notificationPanel").hidden);
        document.querySelector("#notificationButton").click();
        document.querySelector("#profileButton").click();
        check("profile popover", !document.querySelector("#profilePanel").hidden);
        return out;
      })()`,
    ),
  );

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await navigate(cdp, `${appBase}?tab=dashboard`);
  record(
    await evaluate(
      cdp,
      `(async () => {
        const wait = (ms = 80) => new Promise(resolve => setTimeout(resolve, ms));
        const out = [];
        const check = (name, pass, detail = "") => out.push({ name, pass: Boolean(pass), detail: String(detail) });
        check("mobile bottom navigation visible", getComputedStyle(document.querySelector(".mobileNav")).display === "flex");
        check("mobile sidebar hidden", getComputedStyle(document.querySelector(".sidebar")).display === "none");
        check("mobile no horizontal overflow", document.documentElement.scrollWidth <= innerWidth, document.documentElement.scrollWidth + "/" + innerWidth);
        document.querySelector('[data-mobile-tab="search"]').click();
        await wait();
        check("mobile search navigation", document.querySelector(".tabPanel.is-active")?.id === "tab-search");
        document.querySelector("#mobileMoreButton").click();
        check("mobile more sheet", !document.querySelector("#mobileMoreSheet").hidden && !document.querySelector("#mobileSheetBackdrop").hidden);
        document.querySelector('[data-sheet-tab="graph"]').click();
        await wait();
        check("mobile semantic navigation", document.querySelector(".tabPanel.is-active")?.id === "tab-graph");
        return out;
      })()`,
    ),
  );

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await navigate(
    cdp,
    `${appBase}results.html?q=${encodeURIComponent("AI engineer Python machine learning")}`,
  );
  record(
    await evaluate(
      cdp,
      `(() => {
        const out = [];
        const check = (name, pass, detail = "") => out.push({ name, pass: Boolean(pass), detail: String(detail) });
        check("search results cards", document.querySelectorAll(".resultCard").length > 0);
        check("search results summary", document.querySelectorAll("#resultSummary .metricCard").length === 3);
        check("results page no horizontal overflow", document.documentElement.scrollWidth <= innerWidth, document.documentElement.scrollWidth + "/" + innerWidth);
        return out;
      })()`,
    ),
  );

  if (consoleErrors.length) {
    for (const message of consoleErrors) {
      failures.push({ name: "console error", detail: message });
      console.log(`FAIL | console error | ${message}`);
    }
  } else {
    console.log("PASS | no browser console errors");
  }
} finally {
  chrome.kill();
  await delay(300);
  await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

if (failures.length) {
  throw new Error(`${failures.length} UI smoke test(s) failed`);
}

console.log("UI smoke test passed");
