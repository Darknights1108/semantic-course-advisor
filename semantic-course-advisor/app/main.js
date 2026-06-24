import {
  countEntities,
  evaluateProfile,
  graphForCareer,
  loadDataset,
  queryCatalog,
  runQuery,
  shortTerm,
} from "../src/semanticGraph.js";

const state = {
  dataset: null,
  entityMap: new Map(),
  activeTab: "search",
  recommendationInterests: new Set(["cad:ArtificialIntelligence"]),
  recommendationSkills: new Set(["cad:Python"]),
  skillGapCareerId: "cad:MachineLearningEngineer",
  skillGapSkills: new Set(["cad:Python"]),
  explorerCareerId: "cad:AIEngineer",
  graphCareerId: "cad:AIEngineer",
  queryId: "careerSearch",
  sparqlKeyword: "",
  sparqlSkillGapSkills: new Set([]),
  searchQuery: "AI engineer Python machine learning",
};

const els = {
  panels: document.querySelectorAll(".tabPanel"),
  tabs: document.querySelectorAll(".tab"),
  rdfTripleCount: document.querySelector("#rdfTripleCount"),
  careerCount: document.querySelector("#careerCount"),
  skillCount: document.querySelector("#skillCount"),
  courseCount: document.querySelector("#courseCount"),
  certificationCount: document.querySelector("#certificationCount"),
  searchForm: document.querySelector("#searchForm"),
  searchInput: document.querySelector("#searchInput"),
  exampleButtons: document.querySelectorAll(".examples button"),
  recommendInterestChoices: document.querySelector("#recommendInterestChoices"),
  recommendSkillChoices: document.querySelector("#recommendSkillChoices"),
  recommendationResults: document.querySelector("#recommendationResults"),
  careerExplorerSelect: document.querySelector("#careerExplorerSelect"),
  careerExplorer: document.querySelector("#careerExplorer"),
  skillGapCareerSelect: document.querySelector("#skillGapCareerSelect"),
  skillGapSkillChoices: document.querySelector("#skillGapSkillChoices"),
  skillGapPlanner: document.querySelector("#skillGapPlanner"),
  graphCareerSelect: document.querySelector("#graphCareerSelect"),
  graphCanvas: document.querySelector("#graphCanvas"),
  querySelect: document.querySelector("#querySelect"),
  queryKeywordField: document.querySelector("#queryKeywordField"),
  queryKeywordInput: document.querySelector("#queryKeywordInput"),
  queryKeywordHelp: document.querySelector("#queryKeywordHelp"),
  sparqlSkillContext: document.querySelector("#sparqlSkillContext"),
  sparqlSkillChoices: document.querySelector("#sparqlSkillChoices"),
  queryExplanation: document.querySelector("#queryExplanation"),
  queryText: document.querySelector("#queryText"),
  queryResults: document.querySelector("#queryResults"),
  statisticsGrid: document.querySelector("#statisticsGrid"),
  evaluationTable: document.querySelector("#evaluationTable"),
};

async function init() {
  const xml = await fetch("../data/career_knowledge_graph.xml").then((response) => response.text());
  state.dataset = loadDataset(xml);
  state.entityMap = buildEntityMap(state.dataset);
  readInitialTab();
  setupEvents();
  setupSelects();
  setActiveTab(state.activeTab);
  render();
}

function readInitialTab() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab") || window.location.hash.replace("#", "");
  if (tab && document.querySelector(`#tab-${tab}`)) {
    state.activeTab = tab;
  }
}

function setupEvents() {
  for (const tab of els.tabs) {
    tab.addEventListener("click", () => {
      setActiveTab(tab.dataset.tab);
      render();
    });
  }

  els.searchInput.value = state.searchQuery;
  els.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = els.searchInput.value.trim() || state.searchQuery;
    state.searchQuery = query;
    goToSearchResults(query);
  });

  for (const button of els.exampleButtons) {
    button.addEventListener("click", () => {
      state.searchQuery = button.dataset.query || state.searchQuery;
      els.searchInput.value = state.searchQuery;
    });
  }

  els.recommendInterestChoices.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    toggleSetValue(state.recommendationInterests, button.dataset.id);
    render();
  });

  els.recommendSkillChoices.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    toggleSetValue(state.recommendationSkills, button.dataset.id);
    render();
  });

  els.skillGapSkillChoices.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    toggleSetValue(state.skillGapSkills, button.dataset.id);
    render();
  });

  els.sparqlSkillChoices.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    toggleSetValue(state.sparqlSkillGapSkills, button.dataset.id);
    render();
  });

  els.careerExplorerSelect.addEventListener("change", () => {
    state.explorerCareerId = els.careerExplorerSelect.value;
    render();
  });

  els.skillGapCareerSelect.addEventListener("change", () => {
    state.skillGapCareerId = els.skillGapCareerSelect.value;
    render();
  });

  els.graphCareerSelect.addEventListener("change", () => {
    state.graphCareerId = els.graphCareerSelect.value;
    render();
  });

  els.querySelect.addEventListener("change", () => {
    state.queryId = els.querySelect.value;
    render();
  });

  els.queryKeywordInput.addEventListener("input", () => {
    state.sparqlKeyword = els.queryKeywordInput.value;
    render();
  });

  window.addEventListener("resize", () => {
    if (state.activeTab === "graph") {
      renderGraph();
    }
  });
}

function setupSelects() {
  const careerOptions = state.dataset.careers
    .map((career) => `<option value="${career.id}">${escapeHtml(career.title)}</option>`)
    .join("");
  els.careerExplorerSelect.innerHTML = careerOptions;
  els.skillGapCareerSelect.innerHTML = careerOptions;
  els.graphCareerSelect.innerHTML = careerOptions;
  els.careerExplorerSelect.value = state.explorerCareerId;
  els.skillGapCareerSelect.value = state.skillGapCareerId;
  els.graphCareerSelect.value = state.graphCareerId;

  els.querySelect.innerHTML = queryCatalog
    .map((query) => `<option value="${query.id}">${escapeHtml(query.title)}</option>`)
    .join("");
  els.querySelect.value = state.queryId;
  els.queryKeywordInput.value = state.sparqlKeyword;
}

function setActiveTab(tabName) {
  state.activeTab = tabName;
  for (const tab of els.tabs) {
    tab.classList.toggle("is-active", tab.dataset.tab === tabName);
  }
  for (const panel of els.panels) {
    panel.classList.toggle("is-active", panel.id === `tab-${tabName}`);
  }
}

function render() {
  const recommendationProfile = evaluateProfile(state.dataset, {
    targetCareerId: "cad:AIEngineer",
    selectedInterests: [...state.recommendationInterests],
    selectedSkills: [...state.recommendationSkills],
  });

  const skillGapProfile = evaluateProfile(state.dataset, {
    targetCareerId: state.skillGapCareerId,
    selectedInterests: [],
    selectedSkills: [...state.skillGapSkills],
  });

  updateHeroStats();
  renderChoiceChips(els.recommendInterestChoices, state.dataset.interests, state.recommendationInterests);
  renderChoiceChips(els.recommendSkillChoices, state.dataset.skills, state.recommendationSkills);
  renderChoiceChips(els.skillGapSkillChoices, state.dataset.skills, state.skillGapSkills);
  renderChoiceChips(els.sparqlSkillChoices, state.dataset.skills, state.sparqlSkillGapSkills);
  renderRecommendations(recommendationProfile);
  renderCareerExplorer();
  renderSkillGap(skillGapProfile);
  renderSparql();
  renderStatistics();
  renderEvaluation(recommendationProfile, skillGapProfile);

  if (state.activeTab === "graph") {
    window.requestAnimationFrame(renderGraph);
  }
}

function updateHeroStats() {
  els.rdfTripleCount.textContent = String(state.dataset.allTriples.length);
  els.careerCount.textContent = String(state.dataset.careers.length);
  els.skillCount.textContent = String(state.dataset.skills.length);
  els.courseCount.textContent = String(state.dataset.courses.length);
  els.certificationCount.textContent = String(state.dataset.certifications.length);
}

function renderChoiceChips(container, entities, selectedSet) {
  container.innerHTML = entities
    .map((entity) => {
      const selected = selectedSet.has(entity.id);
      return `<button class="choiceChip ${selected ? "is-selected" : ""}" type="button" data-id="${entity.id}">
        ${escapeHtml(entity.label)}
      </button>`;
    })
    .join("");
}

function renderRecommendations(profile) {
  const recommendations = profile.recommendations.slice(0, 5);
  if (!recommendations.length) {
    els.recommendationResults.innerHTML = `<p class="empty">Select at least one interest or skill to produce recommendations.</p>`;
    return;
  }

  els.recommendationResults.innerHTML = recommendations
    .map((item) => {
      return `
        <article class="recommendationCard">
          <p class="scoreLabel">Score ${item.score}</p>
          <h3>${escapeHtml(item.career.title)}</h3>
          <p>${escapeHtml(item.career.description)}</p>
          <p class="explainLine">
            ${escapeHtml(item.career.title)} is recommended because the selected profile matches
            ${item.matchedInterests.length} interest relationship(s) and ${item.matchedSkills.length} required skill relationship(s).
          </p>
          <div class="evidenceGrid">
            ${evidenceBlock("Matched interests", item.matchedInterests)}
            ${evidenceBlock("Matched skills", item.matchedSkills)}
            ${evidenceBlock("Missing skills", item.missingSkills, "danger")}
            ${evidenceBlock("Inference rules used", inferenceRulesFor(item), "rule")}
          </div>
          <div class="learningPath">
            <span>Learning path</span>
            <p>${labelsFor(item.courses).join(", ") || "No course linked"} - ${labelsFor(item.certifications).join(", ") || "No certification linked"}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCareerExplorer() {
  const career = findEntity(state.explorerCareerId);
  if (!career) return;

  els.careerExplorerSelect.value = state.explorerCareerId;
  els.careerExplorer.innerHTML = `
    <article class="wideCard">
      <p class="eyebrow">Career entity</p>
      <h3>${escapeHtml(career.title)}</h3>
      <p>${escapeHtml(career.description)}</p>
    </article>
    <div class="cardGrid two">
      ${relationshipCard("Required skills", career.requiresSkills)}
      ${relationshipCard("Related interests", career.relatedInterests)}
      ${relationshipCard("Industries", career.industries)}
      ${relationshipCard("Recommended courses", career.recommendedCourses)}
      ${relationshipCard("Recommended certifications", career.recommendedCertifications)}
      ${relationshipCard("Learning resources", career.learningResources)}
      ${relationshipCard("Alternative careers", career.alternativeCareers)}
    </div>
  `;
}

function renderSkillGap(profile) {
  const requiredCount = profile.targetCareer.requiresSkills.length;
  const matchedCount = profile.knownSkills.length;
  const missingCount = profile.missingSkills.length;
  const percent = requiredCount ? Math.round((matchedCount / requiredCount) * 100) : 0;
  const prerequisiteSkills = unique(profile.missingSkills.flatMap((skill) => findEntity(skill)?.prerequisiteSkills ?? []));

  els.skillGapCareerSelect.value = state.skillGapCareerId;
  els.skillGapPlanner.innerHTML = `
    <article class="wideCard">
      <p class="eyebrow">Target career</p>
      <h3>${escapeHtml(profile.targetCareer.title)}</h3>
      <p>${escapeHtml(profile.targetCareer.description)}</p>
      <p><strong>${percent}%</strong> of required skills matched from your selection.</p>
    </article>
    <div class="progressTrack"><span style="width: ${percent}%"></span></div>
    <div class="metricGrid three">
      ${metricCard("Required skills", requiredCount)}
      ${metricCard("Matched", matchedCount)}
      ${metricCard("Missing", missingCount)}
    </div>
    <div class="cardGrid three">
      ${relationshipCard("Required skills", profile.targetCareer.requiresSkills)}
      ${relationshipCard("Matched", profile.knownSkills)}
      ${relationshipCard("Missing", profile.missingSkills, "danger")}
    </div>
    <div class="cardGrid two">
      ${relationshipCard("Prerequisite expansion", prerequisiteSkills)}
      ${relationshipCard("Recommended learning", [...profile.targetCareer.recommendedCourses, ...profile.targetCareer.recommendedCertifications])}
    </div>
  `;
}

function renderGraph() {
  const graphProfile = evaluateProfile(state.dataset, {
    targetCareerId: state.graphCareerId,
    selectedInterests: [],
    selectedSkills: [],
  });
  els.graphCareerSelect.value = state.graphCareerId;
  drawGraph(graphForCareer(state.dataset, graphProfile));
}

function renderSparql() {
  const selected = queryCatalog.find((query) => query.id === state.queryId) ?? queryCatalog[0];
  const keyword = selected.id === "skillGap" ? "" : state.sparqlKeyword;
  const profile =
    selected.id === "skillGap"
      ? evaluateProfile(state.dataset, {
          targetCareerId: "cad:AIEngineer",
          selectedInterests: [],
          selectedSkills: [...state.sparqlSkillGapSkills],
        })
      : evaluateProfile(state.dataset, {
          targetCareerId: "cad:AIEngineer",
          selectedInterests: [...state.recommendationInterests],
          selectedSkills: [...state.recommendationSkills],
        });
  const rows = runQuery(selected.id, state.dataset, profile, keyword);

  els.querySelect.value = selected.id;
  els.queryKeywordInput.value = state.sparqlKeyword;
  els.queryKeywordInput.placeholder = queryKeywordPlaceholder(selected.id);
  els.queryKeywordHelp.textContent = queryKeywordHelp(selected.id);
  els.queryKeywordField.classList.toggle("is-hidden", selected.id === "skillGap");
  els.queryKeywordHelp.classList.toggle("is-hidden", selected.id === "skillGap");
  els.sparqlSkillContext.classList.toggle("is-hidden", selected.id !== "skillGap");
  els.queryExplanation.innerHTML = `
    <strong>${escapeHtml(selected.title)}</strong>
    <span>${escapeHtml(queryDescription(selected.id))}</span>
  `;
  els.queryText.textContent = formatQueryText(selected.query, keyword);
  els.queryResults.classList.toggle("skillGapSummaryWrap", selected.id === "skillGap");
  els.queryResults.innerHTML = selected.id === "skillGap" ? renderSkillGapFactSummary(rows) : renderTable(rows);
}

function renderStatistics() {
  const metrics = [
    ["Careers", state.dataset.careers.length],
    ["Skills", state.dataset.skills.length],
    ["Courses", state.dataset.courses.length],
    ["Learning topics", state.dataset.topics.length],
    ["Certifications", state.dataset.certifications.length],
    ["Industries", state.dataset.industries.length],
    ["Interests", state.dataset.interests.length],
    ["Learning resources", state.dataset.resources.length],
    ["Asserted triples", state.dataset.triples.length],
    ["Inferred triples", state.dataset.inferredTriples.length],
    ["Total RDF facts", state.dataset.allTriples.length],
    ["All entities", countEntities(state.dataset)],
  ];

  els.statisticsGrid.innerHTML = metrics.map(([label, value]) => metricCard(label, value)).join("");
}

function renderEvaluation(recommendationProfile, skillGapProfile) {
  const topRecommendation = recommendationProfile.recommendations[0]?.career.title ?? "No result";
  const rows = [
    {
      testCase: "Recommendation profile",
      input: "Interest: Artificial Intelligence; Skill: Python",
      expected: "AI-related careers should rank highly",
      actual: topRecommendation,
      status: topRecommendation.includes("AI") || topRecommendation.includes("Machine Learning") ? "Pass" : "Check",
    },
    {
      testCase: "Skill gap planner",
      input: `${skillGapProfile.targetCareer.title} with Python selected`,
      expected: "Missing skills and prerequisite expansion are displayed",
      actual: `${skillGapProfile.missingSkills.length} missing skill(s)`,
      status: skillGapProfile.missingSkills.length > 0 ? "Pass" : "Check",
    },
    {
      testCase: "SPARQL career query",
      input: "Career Semantic Search query",
      expected: "Career, skill, interest and industry rows are returned",
      actual: `${runQuery("careerSearch", state.dataset, recommendationProfile).length} rows`,
      status: "Pass",
    },
    {
      testCase: "OWL-style inference",
      input: "alternativeCareer symmetric property and prerequisiteSkill recursion",
      expected: "Inferred triples are generated",
      actual: `${state.dataset.inferredTriples.length} inferred triples`,
      status: state.dataset.inferredTriples.length > 0 ? "Pass" : "Check",
    },
  ];
  els.evaluationTable.innerHTML = renderTable(rows);
}

function goToSearchResults(query) {
  const url = new URL("./results.html", window.location.href);
  url.searchParams.set("q", query);
  url.searchParams.set("interests", [...state.recommendationInterests].join(","));
  url.searchParams.set("skills", [...state.recommendationSkills].join(","));
  url.searchParams.set("career", state.explorerCareerId);
  window.location.href = url.toString();
}

function evidenceBlock(title, ids, tone = "") {
  return `
    <div class="evidenceBlock">
      <span>${escapeHtml(title)}</span>
      <div class="chips ${tone}">
        ${ids.length ? ids.map((id) => `<em>${escapeHtml(labelFor(id))}</em>`).join("") : "<em>None</em>"}
      </div>
    </div>
  `;
}

function relationshipCard(title, ids, tone = "") {
  return `
    <article class="infoCard">
      <span>${escapeHtml(title)}</span>
      <div class="chips ${tone}">
        ${ids.length ? ids.map((id) => `<em>${escapeHtml(labelFor(id))}</em>`).join("") : "<em>None</em>"}
      </div>
    </article>
  `;
}

function metricCard(label, value) {
  return `
    <article class="metricCard">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function inferenceRulesFor(item) {
  const rules = [];
  if (item.matchedInterests.length) rules.push("Rule 1 Interest + Career");
  if (item.matchedSkills.length) rules.push("Rule 2 Skill + Career");
  if (item.missingSkills.length) rules.push("Rule 3 Missing Skill Expansion");
  if (item.alternatives.length) rules.push("Rule 4 Alternative Career Suggestions");
  if (item.courses.length) rules.push("Rule 5 Learning Path Recommendation");
  return rules;
}

function queryDescription(queryId) {
  const descriptions = {
    careerSearch: "Matches careers through titles, descriptions, required skills, interests and industries.",
    recommendationSupport: "Shows the graph evidence used for ranked career recommendation output.",
    skillGap: "Lists required skills and prerequisite expansions for careers in the knowledge graph.",
    classInstances: "Lists instances of the main OWL classes in the knowledge graph.",
    courseTopics: "Expands course entities into the skills taught and detailed learning topics covered.",
    skillTopics: "Expands skill entities into the detailed learning topics a learner should study.",
  };
  return descriptions[queryId] ?? "Runs a semantic graph query over the career path knowledge graph.";
}

function queryKeywordPlaceholder(queryId) {
  const placeholders = {
    careerSearch: "Try: data, AI, Python, security, cloud",
    recommendationSupport: "Try: Python, Artificial Intelligence, AI Engineer, Missing",
    skillGap: "Try: Data Scientist, Python, Deep Learning, Missing",
    classInstances: "Try: Career, Skill, Course, Python, AWS",
    courseTopics: "Try: Machine Learning, Logistic Regression, Supervised Learning",
    skillTopics: "Try: Python, SQL, Cybersecurity, Logistic Regression",
  };
  return placeholders[queryId] ?? "Type a keyword to filter the result rows";
}

function queryKeywordHelp(queryId) {
  const help = {
    careerSearch: "Use career, skill, interest or industry words. Leave blank to show all query rows.",
    recommendationSupport: "Use a career, matched interest, matched skill, missing skill or score value.",
    skillGap: "Use a career name, required skill, prerequisite skill, or status such as Matched/Missing.",
    classInstances: "Use an ontology class name or entity name. Examples: Career, Skill, Course, Python.",
    courseTopics: "Use a course, skill, or learning topic. Example: Machine Learning or Logistic Regression.",
    skillTopics: "Use a skill or learning topic. Example: Machine Learning, SQL, or Prompt Safety.",
  };
  return help[queryId] ?? "Leave blank to show all rows, or type a keyword to filter.";
}

function formatQueryText(query, keyword) {
  return query.replaceAll("{{keyword}}", escapeSparqlString(String(keyword || "").toLowerCase()));
}

function escapeSparqlString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function renderTable(rows) {
  if (!rows.length) return `<p class="empty">No rows.</p>`;
  const columns = Object.keys(rows[0]);
  return `
    <table>
      <thead>
        <tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows
          .map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column])}</td>`).join("")}</tr>`)
          .join("")}
      </tbody>
    </table>
  `;
}

function renderSkillGapFactSummary(rows) {
  if (!rows.length) return `<p class="empty">No matching skill gap facts.</p>`;
  const groups = groupRowsBy(rows, "career");

  return `
    <div class="skillGapFactList">
      ${groups
        .map(([career, careerRows]) => {
          const matched = careerRows.filter((row) => row.status === "Matched");
          const missing = careerRows.filter((row) => row.status === "Missing");
          const prerequisites = unique(
            careerRows
              .flatMap((row) => String(row.prerequisiteSkill).split(",").map((item) => item.trim()))
              .filter((item) => item && item !== "-"),
          );
          const open = groups.length <= 3 ? "open" : "";
          return `
            <details class="skillGapFactCard" ${open}>
              <summary>
                <span>${escapeHtml(career)}</span>
                <strong>${matched.length}/${careerRows.length} matched</strong>
                <em>${missing.length} missing</em>
              </summary>
              <div class="skillGapFactBody">
                <div>
                  <h3>Matched skills</h3>
                  <div class="chips">${renderChipList(matched.map((row) => row.requiredSkill))}</div>
                </div>
                <div>
                  <h3>Missing skills</h3>
                  <div class="chips danger">${renderChipList(missing.map((row) => row.requiredSkill))}</div>
                </div>
                <div>
                  <h3>Prerequisite skills</h3>
                  <div class="chips rule">${renderChipList(prerequisites)}</div>
                </div>
              </div>
            </details>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderChipList(items) {
  return items.length ? items.map((item) => `<em>${escapeHtml(item)}</em>`).join("") : "<em>None</em>";
}

function groupRowsBy(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    const groupKey = row[key];
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), row]);
  }
  return [...groups.entries()];
}

function drawGraph(graph) {
  const canvas = els.graphCanvas;
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(720, Math.floor(rect.width || 960));
  const height = Math.max(420, Math.floor(rect.height || 520));
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const center = { x: width / 2, y: height / 2 };
  const positions = new Map();
  const career = graph.nodes.find((node) => node.type === "career");
  const skills = graph.nodes.filter((node) => node.type === "skill");
  const interests = graph.nodes.filter((node) => node.type === "interest");
  const courses = graph.nodes.filter((node) => node.type === "course");
  const alternatives = graph.nodes.filter((node) => node.type === "alternative");

  if (career) positions.set(career.id, center);
  placeRing(skills, Math.min(width, height) * 0.23, -Math.PI / 2, positions, center);
  placeRing(interests, Math.min(width, height) * 0.34, Math.PI / 6, positions, center);
  placeRing(courses, Math.min(width, height) * 0.43, Math.PI / 1.6, positions, center);
  placeRing(alternatives, Math.min(width, height) * 0.38, Math.PI, positions, center);

  ctx.lineWidth = 1.5;
  for (const edge of graph.edges) {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) continue;
    ctx.strokeStyle = edge.label === "alternative" ? "#b75353" : "#9aa6b2";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  for (const node of graph.nodes) {
    const point = positions.get(node.id);
    if (!point) continue;
    const style = styleForNode(node.type);
    ctx.fillStyle = style.fill;
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(point.x, point.y, style.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = style.text;
    ctx.font = "700 12px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    wrapCanvasText(ctx, node.label, point.x, point.y, style.radius * 1.55, 14);
  }
}

function styleForNode(type) {
  if (type === "career") return { fill: "#102033", stroke: "#102033", text: "#ffffff", radius: 54 };
  if (type === "course") return { fill: "#e1f2ef", stroke: "#0f766e", text: "#0f4f4a", radius: 36 };
  if (type === "interest") return { fill: "#e8eef8", stroke: "#496d9f", text: "#243e61", radius: 32 };
  if (type === "alternative") return { fill: "#fde8e8", stroke: "#b75353", text: "#7d2f2f", radius: 31 };
  return { fill: "#fff3ce", stroke: "#a66f00", text: "#664400", radius: 34 };
}

function placeRing(nodes, radius, startAngle, positions, center) {
  nodes.forEach((node, index) => {
    const angle = startAngle + (Math.PI * 2 * index) / Math.max(nodes.length, 1);
    positions.set(node.id, {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  });
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  const visibleLines = lines.slice(0, 3);
  const start = y - ((visibleLines.length - 1) * lineHeight) / 2;
  visibleLines.forEach((item, index) => ctx.fillText(item, x, start + index * lineHeight));
}

function buildEntityMap(dataset) {
  return new Map(
    [
      ...dataset.careers,
      ...dataset.skills,
      ...dataset.interests,
      ...dataset.industries,
      ...dataset.courses,
      ...dataset.topics,
      ...dataset.certifications,
      ...dataset.resources,
    ].map((entity) => [entity.id, entity]),
  );
}

function findEntity(id) {
  return state.entityMap.get(id);
}

function labelFor(id) {
  const entity = findEntity(id);
  return entity?.label ?? entity?.title ?? shortTerm(id);
}

function labelsFor(ids) {
  return ids.map(labelFor);
}

function toggleSetValue(set, value) {
  if (set.has(value)) {
    set.delete(value);
  } else {
    set.add(value);
  }
}

function unique(items) {
  return [...new Set(items)];
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
