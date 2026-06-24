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

        for (const name of ["dashboard","search","recommendations","explorer","skillgap","profile","settings"]) {
          document.querySelector('[data-tab="' + name + '"]').click();
          await wait();
          check("navigate " + name, document.querySelector(".tabPanel.is-active")?.id === "tab-" + name);
        }
        check(
          "semantic tools hidden from common navigation",
          !document.querySelector('.sideNav [data-tab="graph"]') &&
            !document.querySelector('.sideNav [data-tab="sparql"]') &&
            !document.querySelector('.sideNav [data-tab="stats"]') &&
            document.querySelectorAll(".referenceNav [data-tab]").length === 2,
        );

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
        check("subgraph button removed", !document.querySelector("[data-graph-career]"));
        document.querySelector('[data-tab="settings"]').click();
        await wait();
        document.querySelector('.settingsToolGrid [data-goto-tab="graph"]').click();
        await wait();
        check("knowledge graph navigation from settings", document.querySelector(".tabPanel.is-active")?.id === "tab-graph");
        const initialTransform = document.querySelector("#graphStage").getAttribute("transform");
        document.querySelector("#graphZoomIn").click();
        check("graph zoom", document.querySelector("#graphStage").getAttribute("transform") !== initialTransform);
        document.querySelector("#graphFit").click();
        const graphCareer = document.querySelector("#graphCareerSelect");
        graphCareer.value = "cad:DatabaseAdministrator";
        graphCareer.dispatchEvent(new Event("change", { bubbles: true }));
        await wait();
        const graphLabels = [...document.querySelectorAll("#graphStage > g")].map((group) => {
          const title = group.querySelector("title")?.textContent.trim() || "";
          const text = [...group.querySelectorAll("text")].find((item) => item.textContent.trim() !== "CAREER");
          const rendered = text?.querySelector("tspan")
            ? [...text.querySelectorAll("tspan")].map((item) => item.textContent.trim()).join(" ")
            : text?.textContent.trim() || "";
          const rectBox = group.querySelector("rect")?.getBBox();
          const textBox = text?.getBBox();
          const fits = rectBox && textBox &&
            textBox.x >= rectBox.x - 0.5 &&
            textBox.x + textBox.width <= rectBox.x + rectBox.width + 0.5 &&
            textBox.y >= rectBox.y - 0.5 &&
            textBox.y + textBox.height <= rectBox.y + rectBox.height + 0.5;
          return { title, rendered, fits };
        });
        check(
          "graph labels shown in full",
          graphLabels.every((label) => label.title === label.rendered && label.fits) &&
            !document.querySelector("#graphStage").textContent.includes("…"),
        );

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

        document.querySelector('[data-tab="settings"]').click();
        await wait();
        document.querySelector('.settingsToolGrid [data-goto-tab="sparql"]').click();
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

        document.querySelector('[data-tab="settings"]').click();
        await wait();
        document.querySelector('.settingsToolGrid [data-goto-tab="stats"]').click();
        await wait();
        check("statistics metrics", document.querySelectorAll(".statisticsCard").length === 4);
        check("evaluation rows", document.querySelectorAll("#evaluationTable tbody tr").length === 4);

        document.querySelector("#notificationButton").click();
        check("notification popover", !document.querySelector("#notificationPanel").hidden);
        document.querySelector("#notificationButton").click();
        document.querySelector("#profileButton").click();
        check("profile popover", !document.querySelector("#profilePanel").hidden);

        document.querySelector('[data-tab="profile"]').click();
        await wait();
        const profileInterest = document.querySelector('#profileInterestChoices [data-id="cad:SoftwareDevelopment"]');
        profileInterest.click();
        await wait();
        document.querySelector("#profileSaveButton").click();
        await wait();
        check(
          "profile interest save",
          JSON.parse(localStorage.getItem("careergraph.profileInterests.v1") || "[]").includes("cad:SoftwareDevelopment") &&
            document.querySelector("#profileSavedStatus").textContent.includes("saved"),
        );
        document.querySelector('[data-tab="recommendations"]').click();
        await wait();
        check(
          "profile interests feed recommendations",
          document.querySelector('#recommendInterestChoices [data-id="cad:SoftwareDevelopment"]').getAttribute("aria-pressed") === "true",
        );

        document.querySelector('[data-tab="settings"]').click();
        await wait();
        check(
          "obsolete settings removed",
          !document.querySelector("#settingsNotifications") &&
            !document.querySelector("#settingsEvidence") &&
            !document.querySelector("#settingsCompact") &&
            !document.querySelector("#settingsForm") &&
            document.querySelectorAll(".settingsToolGrid [data-goto-tab]").length === 3,
        );
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
        check("mobile profile and settings links", Boolean(document.querySelector('[data-sheet-tab="profile"]') && document.querySelector('[data-sheet-tab="settings"]')));
        check("mobile semantic tools hidden", !document.querySelector('[data-sheet-tab="graph"]') && !document.querySelector('[data-sheet-tab="sparql"]') && !document.querySelector('[data-sheet-tab="stats"]'));
        document.querySelector('[data-sheet-tab="settings"]').click();
        await wait();
        document.querySelector('.settingsToolGrid [data-goto-tab="graph"]').click();
        await wait();
        check("mobile semantic navigation from settings", document.querySelector(".tabPanel.is-active")?.id === "tab-graph");
        return out;
      })()`,
    ),
  );
  await navigate(
    cdp,
    `${appBase}results.html?topic=${encodeURIComponent("cad:SupervisedLearning")}&course=${encodeURIComponent("cad:MachineLearningFoundations")}&from=skillgap`,
  );
  record(
    await evaluate(
      cdp,
      `(() => {
        const toggle = document.querySelector("[data-outline-toggle]");
        const before = document.querySelector(".learningOutlineList").classList.contains("is-open");
        toggle.click();
        const after = document.querySelector(".learningOutlineList").classList.contains("is-open");
        return [
          { name: "mobile learning reader", pass: document.querySelector(".lessonArticleHeader h1")?.textContent === "Supervised Learning" && document.documentElement.scrollWidth <= innerWidth, detail: document.documentElement.scrollWidth + "/" + innerWidth },
          { name: "mobile curriculum toggle", pass: before !== after && getComputedStyle(toggle).display !== "none", detail: before + "->" + after },
        ];
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
        check(
          "results page hides advanced navigation",
          !document.querySelector('.sideNav [href="./index.html?tab=graph"]') &&
            !document.querySelector('.sideNav [href="./index.html?tab=sparql"]') &&
            !document.querySelector('.sideNav [href="./index.html?tab=stats"]') &&
            Boolean(document.querySelector('.referenceNav [href="./index.html?tab=profile"]')) &&
            Boolean(document.querySelector('.referenceNav [href="./index.html?tab=settings"]')),
        );
        return out;
      })()`,
    ),
  );

  await navigate(
    cdp,
    `${appBase}results.html?q=${encodeURIComponent("Data Science Fundamentals")}&course=${encodeURIComponent("cad:DataScienceFundamentals")}&from=skillgap`,
  );
  record(
    await evaluate(
      cdp,
      `(() => {
        const out = [];
        const check = (name, pass, detail = "") => out.push({ name, pass: Boolean(pass), detail: String(detail) });
        const topics = [...document.querySelectorAll(".topicCard")];
        const topicText = topics.map((card) => card.textContent).join(" ");
        check("course learning detail", document.querySelector(".courseHero h2")?.textContent === "Data Science Fundamentals");
        check("course topics loaded from XML", topics.length === 5 && topicText.includes("Data Cleaning") && topicText.includes("missing values"));
        check("course skills loaded from XML", document.querySelector(".courseHero .chips")?.textContent.includes("Python") && document.querySelector(".courseHero .chips")?.textContent.includes("Statistics"));
        check("course return destination", document.querySelector("#backToResults")?.textContent.includes("learning plan"));
        return out;
      })()`,
    ),
  );
  await evaluate(
    cdp,
    `localStorage.removeItem("careergraph.completedTopics.v1"); localStorage.removeItem("careergraph.lastTopic.v1")`,
  );
  await evaluate(cdp, `document.querySelector("[data-topic-id]").click()`);
  await delay(300);
  record(
    await evaluate(
      cdp,
      `(() => {
        const articleText = document.querySelector(".lessonArticle")?.textContent ?? "";
        return [
          {
            name: "topic link opens",
            pass: new URLSearchParams(location.search).get("topic") === "cad:PythonNotebooks" && document.querySelector(".lessonArticleHeader h1")?.textContent === "Python Notebooks",
            detail: location.href,
          },
          {
            name: "full lesson loaded from XML",
            pass: articleText.includes("notebook environments") && document.querySelectorAll(".lessonObjectives li").length === 5 && document.querySelectorAll(".lessonSections > section").length === 3 && document.querySelector(".lessonCallout.example") && document.querySelector(".lessonCallout.practice") && document.querySelectorAll(".lessonTakeaways li").length >= 4,
            detail: articleText.slice(0, 120),
          },
          {
            name: "course curriculum outline",
            pass: document.querySelectorAll(".learningOutlineList [data-topic-id]").length === 5 && document.querySelector(".learningOutlineList .is-current strong")?.textContent === "Python Notebooks",
            detail: document.querySelector(".learningOutlineHeader")?.textContent,
          },
        ];
      })()`,
    ),
  );
  await evaluate(cdp, `document.querySelector("[data-complete-topic]").click()`);
  await delay(200);
  record(
    await evaluate(
      cdp,
      `(() => [{
        name: "topic completion saved",
        pass: JSON.parse(localStorage.getItem("careergraph.completedTopics.v1") || "[]").includes("cad:PythonNotebooks") && document.querySelector(".completionBadge")?.textContent.includes("Completed") && document.querySelector(".learningProgressCard")?.textContent.includes("1 of 5"),
        detail: localStorage.getItem("careergraph.completedTopics.v1"),
      }])()`,
    ),
  );
  await cdp.send("Page.reload");
  await delay(700);
  record(
    await evaluate(
      cdp,
      `(() => [{
        name: "topic completion persists",
        pass: document.querySelector(".completionBadge")?.textContent.includes("Completed") && document.querySelector("[data-complete-topic]")?.disabled,
        detail: document.querySelector(".completionBadge")?.textContent,
      }])()`,
    ),
  );
  await evaluate(cdp, `document.querySelector(".lessonNavButton.next").click()`);
  await delay(250);
  record(
    await evaluate(
      cdp,
      `(() => [{
        name: "next topic navigation",
        pass: new URLSearchParams(location.search).get("topic") === "cad:DataCleaning" && document.querySelector(".lessonArticleHeader h1")?.textContent === "Data Cleaning",
        detail: location.href,
      }])()`,
    ),
  );
  await evaluate(cdp, `document.querySelector(".lessonNavButton.previous").click()`);
  await delay(250);
  await evaluate(cdp, `document.querySelector("#backToResults").click()`);
  await delay(300);
  record(
    await evaluate(
      cdp,
      `(() => [{
        name: "topic back to course",
        pass: !new URLSearchParams(location.search).has("topic") && document.querySelector(".courseHero h2")?.textContent === "Data Science Fundamentals",
        detail: location.href,
      }])()`,
    ),
  );
  await evaluate(cdp, `document.querySelector("#backToResults").click()`);
  await delay(500);
  record(
    await evaluate(
      cdp,
      `(() => [{
        name: "course back navigation",
        pass: location.pathname.endsWith("/app/index.html") && new URLSearchParams(location.search).get("tab") === "skillgap",
        detail: location.href,
      }])()`,
    ),
  );
  await evaluate(cdp, `document.querySelector(".planCourseLink").click()`);
  await delay(500);
  record(
    await evaluate(
      cdp,
      `(() => [{
        name: "learning plan subject link",
        pass: new URLSearchParams(location.search).has("course") && document.querySelector(".courseHero h2")?.textContent.length > 0,
        detail: location.href,
      }])()`,
    ),
  );
  await navigate(
    cdp,
    `${appBase}results.html?topic=${encodeURIComponent("cad:PythonSyntax")}&from=search`,
  );
  record(
    await evaluate(
      cdp,
      `(() => {
        const last = JSON.parse(localStorage.getItem("careergraph.lastTopic.v1") || "{}");
        return [
          {
            name: "direct topic context fallback",
            pass: new URLSearchParams(location.search).get("skill") === "cad:Python" && document.querySelectorAll(".learningOutlineList [data-topic-id]").length === 5,
            detail: location.href,
          },
          {
            name: "last visited topic saved",
            pass: last.topicId === "cad:PythonSyntax" && last.contextId === "cad:Python",
            detail: JSON.stringify(last),
          },
        ];
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
