import { evaluateProfile, loadDataset, searchKnowledgeGraph } from "../src/semanticGraph.js";

const state = {
  dataset: null,
  query: "",
  profile: {
    targetCareerId: "cad:AIEngineer",
    selectedInterests: ["cad:ArtificialIntelligence"],
    selectedSkills: ["cad:Python"],
  },
};

const els = {
  form: document.querySelector("#resultsSearchForm"),
  input: document.querySelector("#resultsSearchInput"),
  summary: document.querySelector("#resultSummary"),
  list: document.querySelector("#resultList"),
};

async function init() {
  readParams();
  const xml = await fetch("../data/career_knowledge_graph.xml").then((response) => response.text());
  state.dataset = loadDataset(xml);
  els.input.value = state.query;
  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set("q", els.input.value.trim() || "career knowledge graph");
    window.location.href = url.toString();
  });
  render();
}

function readParams() {
  const params = new URLSearchParams(window.location.search);
  state.query = params.get("q") || "AI engineer Python machine learning";
  const career = params.get("career");
  const interests = csvParam(params.get("interests"));
  const skills = csvParam(params.get("skills"));
  if (career) state.profile.targetCareerId = career;
  if (interests.length) state.profile.selectedInterests = interests;
  if (skills.length) state.profile.selectedSkills = skills;
}

function render() {
  const profile = evaluateProfile(state.dataset, state.profile);
  const results = searchKnowledgeGraph(state.dataset, profile, state.query);
  const top = results[0];
  const typeCount = new Set(results.map((item) => item.type)).size;

  els.summary.innerHTML = [
    metricCard("Query", state.query),
    metricCard("Top entity", top ? top.title : "No result"),
    metricCard("Entity types", typeCount),
  ].join("");

  if (!results.length) {
    els.list.innerHTML = `<p class="empty">No matching entity result.</p>`;
    return;
  }

  els.list.innerHTML = results
    .map(
      (item) => `
        <article class="resultCard">
          <div class="resultBadge">${escapeHtml(item.type)}</div>
          <div class="resultBody">
            <h2>${escapeHtml(item.title)}</h2>
            <p class="resultSubtitle">${escapeHtml(item.subtitle)}</p>
            <p>${escapeHtml(item.description)}</p>
            <div class="chips">
              ${item.relationships.map((relationship) => `<em>${escapeHtml(relationship)}</em>`).join("")}
            </div>
            <p class="explainLine">${escapeHtml(item.explanation)}</p>
          </div>
          <div class="scoreBox">
            <strong>${Math.round(item.score)}</strong>
            <span>Semantic score</span>
            <small>${item.matchedTerms.length ? item.matchedTerms.map(escapeHtml).join(", ") : "graph match"}</small>
          </div>
        </article>
      `,
    )
    .join("");
}

function metricCard(label, value) {
  return `
    <article class="metricCard">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function csvParam(value) {
  return value ? value.split(",").filter(Boolean) : [];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

init().catch((error) => {
  document.body.innerHTML = `<main class="appShell"><p class="empty">${escapeHtml(error.message)}</p></main>`;
});
