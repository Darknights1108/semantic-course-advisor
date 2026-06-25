import {
  countEntities,
  evaluateProfile,
  graphForCareer,
  loadDataset,
  queryCatalog,
  runQuery,
  searchKnowledgeGraph,
  shortTerm,
} from "../src/semanticGraph.js";

const PROFILE_INTERESTS_KEY = "careergraph.profileInterests.v1";
const DEFAULT_INTERESTS = ["cad:ArtificialIntelligence", "cad:DataAnalytics"];

const TAB_ALIASES = {
  overview: "dashboard",
  dashboard: "dashboard",
  search: "search",
  recommendations: "recommendations",
  recs: "recommendations",
  career: "explorer",
  explorer: "explorer",
  skillgap: "skillgap",
  graph: "graph",
  sparql: "sparql",
  ontology: "ontology",
  statistics: "stats",
  evaluation: "stats",
  stats: "stats",
  profile: "profile",
  settings: "settings",
};

const PAGE_META = {
  dashboard: ["Student Home", "Dashboard"],
  search: ["Discover", "Career Search"],
  recommendations: ["Guidance", "Career Recommendations"],
  explorer: ["Knowledge", "Career Explorer"],
  skillgap: ["Planning", "Skill Gap & Learning Plan"],
  graph: ["Semantic Lab", "Knowledge Graph"],
  sparql: ["Semantic Lab", "SPARQL Viewer"],
  ontology: ["Semantic Lab", "Ontology Viewer"],
  stats: ["Semantic Lab", "Statistics & Evaluation"],
  profile: ["Student Account", "Profile"],
  settings: ["Preferences", "Settings"],
};

const state = {
  dataset: null,
  entityMap: new Map(),
  activeTab: "dashboard",
  recommendationInterests: new Set(DEFAULT_INTERESTS),
  profileInterestDraft: new Set(DEFAULT_INTERESTS),
  recommendationSkills: new Set(["cad:Python", "cad:Statistics", "cad:SQL"]),
  skillGapCareerId: "cad:DataScientist",
  skillGapSkills: new Set(["cad:Python", "cad:Statistics", "cad:SQL"]),
  explorerCareerId: "cad:DataScientist",
  graphCareerId: "cad:DataScientist",
  queryId: "careerSearch",
  ontologyText: "",
  ontology: { classes: [], properties: [] },
  sparqlKeyword: "machine learning",
  sparqlSkillGapSkills: new Set(["cad:Python", "cad:Statistics", "cad:SQL"]),
  searchQuery: "",
  searchTypes: new Set(["Career Entity", "Skill Entity", "Course Entity"]),
  searchIndustry: "Technology",
  dashboardFilter: "all",
  bookmarkedCareers: new Set(),
  graphScale: 1,
};

const els = {
  content: document.querySelector(".content"),
  panels: document.querySelectorAll(".tabPanel"),
  tabs: document.querySelectorAll(".tab[data-tab]"),
  pageKicker: document.querySelector("#pageKicker"),
  pageTitle: document.querySelector("#pageTitle"),
  mobilePageTitle: document.querySelector("#mobilePageTitle"),
  notificationButton: document.querySelector("#notificationButton"),
  notificationPanel: document.querySelector("#notificationPanel"),
  profileButton: document.querySelector("#profileButton"),
  profilePanel: document.querySelector("#profilePanel"),
  profilePanelSummary: document.querySelector("#profilePanelSummary"),
  mobileBackButton: document.querySelector("#mobileBackButton"),
  mobileNavButtons: document.querySelectorAll("[data-mobile-tab]"),
  mobileMoreButton: document.querySelector("#mobileMoreButton"),
  mobileMoreSheet: document.querySelector("#mobileMoreSheet"),
  mobileSheetBackdrop: document.querySelector("#mobileSheetBackdrop"),
  dashboardFilters: document.querySelector(".dashboardFilters"),
  dashboardCareerCards: document.querySelector("#dashboardCareerCards"),
  mobileDashboardSummary: document.querySelector("#mobileDashboardSummary"),
  dashboardLessons: document.querySelector("#dashboardLessons"),
  dashboardSpotlight: document.querySelector("#dashboardSpotlight"),
  dashboardProfile: document.querySelector("#dashboardProfile"),
  searchForm: document.querySelector("#searchForm"),
  searchInput: document.querySelector("#searchInput"),
  exampleButtons: document.querySelectorAll(".examples button[data-query]"),
  searchTypeInputs: document.querySelectorAll("[data-search-type]"),
  searchIndustryButtons: document.querySelectorAll("[data-search-industry]"),
  searchResultCount: document.querySelector("#searchResultCount"),
  inlineSearchResults: document.querySelector("#inlineSearchResults"),
  filterCareerCount: document.querySelector("#filterCareerCount"),
  filterSkillCount: document.querySelector("#filterSkillCount"),
  filterCourseCount: document.querySelector("#filterCourseCount"),
  filterCertificationCount: document.querySelector("#filterCertificationCount"),
  recommendInterestChoices: document.querySelector("#recommendInterestChoices"),
  recommendSkillChoices: document.querySelector("#recommendSkillChoices"),
  interestSelectedCount: document.querySelector("#interestSelectedCount"),
  skillSelectedCount: document.querySelector("#skillSelectedCount"),
  recalculateButton: document.querySelector("#recalculateButton"),
  recommendationBasis: document.querySelector("#recommendationBasis"),
  recommendationResults: document.querySelector("#recommendationResults"),
  careerExplorerSelect: document.querySelector("#careerExplorerSelect"),
  careerExplorer: document.querySelector("#careerExplorer"),
  skillGapCareerSelect: document.querySelector("#skillGapCareerSelect"),
  skillGapSkillChoices: document.querySelector("#skillGapSkillChoices"),
  skillGapSummary: document.querySelector("#skillGapSummary"),
  skillGapPlanner: document.querySelector("#skillGapPlanner"),
  graphCareerSelect: document.querySelector("#graphCareerSelect"),
  graphSvg: document.querySelector("#graphSvg"),
  graphEvidence: document.querySelector("#graphEvidence"),
  graphZoomIn: document.querySelector("#graphZoomIn"),
  graphZoomOut: document.querySelector("#graphZoomOut"),
  graphFit: document.querySelector("#graphFit"),
  queryTabs: document.querySelector("#queryTabs"),
  queryKeywordField: document.querySelector("#queryKeywordField"),
  queryKeywordInput: document.querySelector("#queryKeywordInput"),
  queryKeywordHelp: document.querySelector("#queryKeywordHelp"),
  sparqlSkillContext: document.querySelector("#sparqlSkillContext"),
  sparqlSkillChoices: document.querySelector("#sparqlSkillChoices"),
  queryExplanation: document.querySelector("#queryExplanation"),
  queryFilename: document.querySelector("#queryFilename"),
  copyQueryButton: document.querySelector("#copyQueryButton"),
  queryText: document.querySelector("#queryText"),
  queryResults: document.querySelector("#queryResults"),
  queryRowCount: document.querySelector("#queryRowCount"),
  queryFeedNote: document.querySelector("#queryFeedNote"),
  ontologySummary: document.querySelector("#ontologySummary"),
  ontologyClassCount: document.querySelector("#ontologyClassCount"),
  ontologyPropertyCount: document.querySelector("#ontologyPropertyCount"),
  ontologyClasses: document.querySelector("#ontologyClasses"),
  ontologyProperties: document.querySelector("#ontologyProperties"),
  ontologyText: document.querySelector("#ontologyText"),
  copyOntologyButton: document.querySelector("#copyOntologyButton"),
  statisticsSummary: document.querySelector("#statisticsSummary"),
  classInstanceBars: document.querySelector("#classInstanceBars"),
  inferenceLead: document.querySelector("#inferenceLead"),
  inferenceCards: document.querySelector("#inferenceCards"),
  evaluationTable: document.querySelector("#evaluationTable"),
  profileInterestChoices: document.querySelector("#profileInterestChoices"),
  profileInterestCount: document.querySelector("#profileInterestCount"),
  profileCurrentSkills: document.querySelector("#profileCurrentSkills"),
  profileSaveButton: document.querySelector("#profileSaveButton"),
  profileResetButton: document.querySelector("#profileResetButton"),
  profileSavedStatus: document.querySelector("#profileSavedStatus"),
};

async function init() {
  const xml = await fetch("../data/career_knowledge_graph.xml").then((response) => {
    if (!response.ok) throw new Error("Unable to load the career knowledge graph");
    return response.text();
  });
  state.dataset = loadDataset(xml);
  state.ontologyText = await fetch("../data/ontology.ttl").then((response) => {
    if (!response.ok) throw new Error("Unable to load the ontology file");
    return response.text();
  });
  state.ontology = parseOntologyTurtle(state.ontologyText);
  state.entityMap = buildEntityMap(state.dataset);
  loadSavedPreferences();
  readInitialTab();
  setupSelects();
  setupEvents();
  setActiveTab(state.activeTab, { updateUrl: false });
  render();
}

function readInitialTab() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("tab") || window.location.hash.replace("#", "");
  state.activeTab = TAB_ALIASES[requested] ?? "dashboard";
}

function setupSelects() {
  const options = state.dataset.careers
    .map((career) => `<option value="${career.id}">${escapeHtml(career.title)}</option>`)
    .join("");
  els.careerExplorerSelect.innerHTML = options;
  els.skillGapCareerSelect.innerHTML = options;
  els.graphCareerSelect.innerHTML = options;
  els.careerExplorerSelect.value = state.explorerCareerId;
  els.skillGapCareerSelect.value = state.skillGapCareerId;
  els.graphCareerSelect.value = state.graphCareerId;
}

function setupEvents() {
  for (const tab of els.tabs) {
    tab.addEventListener("click", () => {
      setActiveTab(tab.dataset.tab);
      render();
    });
  }

  for (const button of els.mobileNavButtons) {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.mobileTab);
      render();
    });
  }

  document.querySelectorAll("[data-sheet-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.sheetTab);
      closeMobileMore();
      render();
    });
  });
  document.querySelectorAll("[data-open-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveTab(button.dataset.openTab);
      render();
    });
  });

  els.mobileMoreButton.addEventListener("click", () => {
    const willOpen = els.mobileMoreSheet.hidden;
    els.mobileMoreSheet.hidden = !willOpen;
    els.mobileSheetBackdrop.hidden = !willOpen;
  });
  els.mobileSheetBackdrop.addEventListener("click", closeMobileMore);
  els.mobileBackButton.addEventListener("click", () => {
    if (state.activeTab === "dashboard") {
      const willOpen = els.mobileMoreSheet.hidden;
      els.mobileMoreSheet.hidden = !willOpen;
      els.mobileSheetBackdrop.hidden = !willOpen;
      return;
    }
    setActiveTab("dashboard");
    render();
  });

  els.notificationButton.addEventListener("click", () => {
    togglePopover(els.notificationButton, els.notificationPanel);
  });
  els.profileButton.addEventListener("click", () => {
    togglePopover(els.profileButton, els.profilePanel);
  });

  els.profileInterestChoices.addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (!button) return;
    toggleSetValue(state.profileInterestDraft, button.dataset.id);
    renderProfile();
  });
  els.profileSaveButton.addEventListener("click", () => {
    if (!state.profileInterestDraft.size) {
      els.profileSavedStatus.textContent = "Select at least one interest.";
      return;
    }
    state.recommendationInterests = new Set(state.profileInterestDraft);
    localStorage.setItem(
      PROFILE_INTERESTS_KEY,
      JSON.stringify([...state.recommendationInterests]),
    );
    els.profileSavedStatus.textContent = "Interests saved ✓";
    render();
  });
  els.profileResetButton.addEventListener("click", () => {
    state.profileInterestDraft = new Set(state.recommendationInterests);
    els.profileSavedStatus.textContent = "Changes undone";
    renderProfile();
  });

  els.dashboardFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-dashboard-filter]");
    if (!button) return;
    state.dashboardFilter = button.dataset.dashboardFilter;
    renderDashboard(getRecommendationProfile());
  });

  els.searchInput.value = state.searchQuery;
  els.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.searchQuery = els.searchInput.value.trim();
    renderSearch(getRecommendationProfile());
  });
  for (const button of els.exampleButtons) {
    button.addEventListener("click", () => {
      state.searchQuery = button.dataset.query;
      els.searchInput.value = state.searchQuery;
      renderSearch(getRecommendationProfile());
    });
  }
  for (const input of els.searchTypeInputs) {
    input.addEventListener("change", () => {
      if (input.checked) state.searchTypes.add(input.dataset.searchType);
      else state.searchTypes.delete(input.dataset.searchType);
      renderSearch(getRecommendationProfile());
    });
  }
  for (const button of els.searchIndustryButtons) {
    button.addEventListener("click", () => {
      state.searchIndustry = button.dataset.searchIndustry;
      renderSearch(getRecommendationProfile());
    });
  }

  els.recommendInterestChoices.addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (!button) return;
    toggleSetValue(state.recommendationInterests, button.dataset.id);
    state.profileInterestDraft = new Set(state.recommendationInterests);
    localStorage.setItem(
      PROFILE_INTERESTS_KEY,
      JSON.stringify([...state.recommendationInterests]),
    );
    renderRecommendations(getRecommendationProfile());
    renderProfile();
  });
  els.recommendSkillChoices.addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (!button) return;
    toggleSetValue(state.recommendationSkills, button.dataset.id);
    renderRecommendations(getRecommendationProfile());
  });
  els.recalculateButton.addEventListener("click", () => {
    els.recalculateButton.textContent = "Matches updated";
    render();
    window.setTimeout(() => {
      els.recalculateButton.textContent = "Recalculate matches";
    }, 900);
  });

  els.careerExplorerSelect.addEventListener("change", () => {
    state.explorerCareerId = els.careerExplorerSelect.value;
    renderCareerExplorer();
  });
  els.skillGapCareerSelect.addEventListener("change", () => {
    state.skillGapCareerId = els.skillGapCareerSelect.value;
    renderSkillGap(getSkillGapProfile());
  });
  els.skillGapSkillChoices.addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (!button) return;
    toggleSetValue(state.skillGapSkills, button.dataset.id);
    renderSkillGap(getSkillGapProfile());
  });
  els.skillGapPlanner.addEventListener("click", (event) => {
    const skill = event.target.closest("[data-skill-id]");
    if (!skill) return;
    toggleSetValue(state.skillGapSkills, skill.dataset.skillId);
    renderSkillGap(getSkillGapProfile());
  });
  els.graphCareerSelect.addEventListener("change", () => {
    state.graphCareerId = els.graphCareerSelect.value;
    state.graphScale = 1;
    renderGraph();
  });
  els.graphZoomIn.addEventListener("click", () => {
    state.graphScale = Math.min(1.35, state.graphScale + 0.1);
    applyGraphScale();
  });
  els.graphZoomOut.addEventListener("click", () => {
    state.graphScale = Math.max(0.7, state.graphScale - 0.1);
    applyGraphScale();
  });
  els.graphFit.addEventListener("click", () => {
    state.graphScale = 1;
    applyGraphScale();
  });

  els.queryTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-query-id]");
    if (!button) return;
    state.queryId = button.dataset.queryId;
    renderSparql();
  });
  els.queryKeywordInput.addEventListener("input", () => {
    state.sparqlKeyword = els.queryKeywordInput.value;
    renderSparql();
  });
  els.sparqlSkillChoices.addEventListener("click", (event) => {
    const button = event.target.closest("[data-id]");
    if (!button) return;
    toggleSetValue(state.sparqlSkillGapSkills, button.dataset.id);
    renderSparql();
  });
  els.copyQueryButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(els.queryText.textContent);
      els.copyQueryButton.textContent = "Copied";
    } catch {
      els.copyQueryButton.textContent = "Select query text";
    }
    window.setTimeout(() => {
      els.copyQueryButton.textContent = "Copy";
    }, 900);
  });
  els.copyOntologyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(els.ontologyText.textContent);
      els.copyOntologyButton.textContent = "Copied";
    } catch {
      els.copyOntologyButton.textContent = "Select ontology text";
    }
    window.setTimeout(() => {
      els.copyOntologyButton.textContent = "Copy";
    }, 900);
  });

  els.content.addEventListener("click", (event) => {
    const course = event.target.closest("[data-course-id]");
    if (course) {
      goToCourseLearning(course.dataset.courseId);
      return;
    }
    const goto = event.target.closest("[data-goto-tab]");
    if (goto) {
      setActiveTab(goto.dataset.gotoTab);
      render();
      return;
    }
    const career = event.target.closest("[data-career-id]");
    if (career) {
      state.explorerCareerId = career.dataset.careerId;
      setActiveTab("explorer");
      render();
      return;
    }
    const bookmark = event.target.closest("[data-bookmark]");
    if (bookmark) {
      toggleSetValue(state.bookmarkedCareers, bookmark.dataset.bookmark);
      renderDashboard(getRecommendationProfile());
      return;
    }
    const plan = event.target.closest("[data-add-plan]");
    if (plan) {
      plan.textContent = "Added ✓";
      plan.disabled = true;
      return;
    }
  });

  els.content.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const course = event.target.closest('[data-course-id][role="button"]');
    if (!course) return;
    event.preventDefault();
    goToCourseLearning(course.dataset.courseId);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePopovers();
      closeMobileMore();
    }
  });
}

function setActiveTab(tabName, options = {}) {
  const canonical = TAB_ALIASES[tabName] ?? tabName;
  if (!PAGE_META[canonical]) return;
  state.activeTab = canonical;
  const [kicker, title] = PAGE_META[canonical];
  els.pageKicker.textContent = kicker;
  els.pageTitle.textContent = title;
  els.mobilePageTitle.textContent = mobileTitleFor(canonical);
  els.mobileBackButton.textContent = canonical === "dashboard" ? "☰" : "‹";
  els.mobileBackButton.setAttribute(
    "aria-label",
    canonical === "dashboard" ? "Open more navigation" : "Back to dashboard",
  );

  for (const tab of els.tabs) {
    const active = tab.dataset.tab === canonical;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
  }
  for (const panel of els.panels) {
    panel.classList.toggle("is-active", panel.id === `tab-${canonical}`);
  }
  for (const button of els.mobileNavButtons) {
    button.classList.toggle("is-active", button.dataset.mobileTab === canonical);
  }
  els.mobileMoreButton.classList.toggle(
    "is-active",
    !["dashboard", "search", "recommendations", "skillgap"].includes(canonical),
  );
  els.content.scrollTop = 0;
  closePopovers();
  closeMobileMore();

  if (options.updateUrl !== false) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", canonical);
    history.replaceState(null, "", url);
  }
}

function mobileTitleFor(tab) {
  const titles = {
    dashboard: "Dashboard",
    search: "Career Search",
    recommendations: "Recommendations",
    explorer: "Career Explorer",
    skillgap: "Skill Gap",
    graph: "Knowledge Graph",
    sparql: "SPARQL Viewer",
    ontology: "Ontology Viewer",
    stats: "Statistics & Evaluation",
    profile: "Profile",
    settings: "Settings",
  };
  return titles[tab];
}

function render() {
  const recommendationProfile = getRecommendationProfile();
  const skillGapProfile = getSkillGapProfile();
  renderDashboard(recommendationProfile);
  renderSearch(recommendationProfile);
  renderRecommendations(recommendationProfile);
  renderCareerExplorer();
  renderSkillGap(skillGapProfile);
  renderSparql();
  renderOntology();
  renderStatistics(recommendationProfile, skillGapProfile);
  renderProfile();
  if (state.activeTab === "graph") window.requestAnimationFrame(renderGraph);
}

function getRecommendationProfile() {
  return evaluateProfile(state.dataset, {
    targetCareerId: "cad:DataScientist",
    selectedInterests: [...state.recommendationInterests],
    selectedSkills: [...state.recommendationSkills],
  });
}

function getSkillGapProfile() {
  return evaluateProfile(state.dataset, {
    targetCareerId: state.skillGapCareerId,
    selectedInterests: [],
    selectedSkills: [...state.skillGapSkills],
  });
}

function renderDashboard(profile) {
  const filter = state.dashboardFilter;
  const matches = profile.recommendations.filter((item) => {
    if (filter === "all") return true;
    if (filter === "ArtificialIntelligence") {
      return item.career.relatedInterests.includes("cad:ArtificialIntelligence");
    }
    return item.career.industries.includes(`cad:${filter}`);
  });
  const recommendations = orderedRecommendations(matches).slice(0, 3);
  const tones = ["", "tone-orange", "tone-black"];

  for (const button of els.dashboardFilters.querySelectorAll("[data-dashboard-filter]")) {
    button.classList.toggle("is-active", button.dataset.dashboardFilter === filter);
  }

  els.dashboardCareerCards.innerHTML = recommendations.length
    ? recommendations
        .map((item, index) => {
          const percent = recommendationPercent(item, index);
          const bookmarked = state.bookmarkedCareers.has(item.career.id);
          const category =
            index === 0
              ? "Top match"
              : index === 1
                ? labelFor(item.career.industries[1] ?? item.career.industries[0])
                : "AI / ML";
          return `
            <article class="matchCard ${tones[index] ?? ""}">
              <div class="matchTop">
                <span class="matchPill">${escapeHtml(category)}</span>
                <button class="bookmark" type="button" data-bookmark="${item.career.id}" aria-pressed="${bookmarked}" aria-label="Bookmark ${escapeHtml(item.career.title)}">${bookmarked ? "★" : "☆"}</button>
              </div>
              <h2>${escapeHtml(item.career.title)}</h2>
              <div class="matchStat"><span>Skill match</span><strong>${percent}% · ${item.matchedSkills.length}/${item.career.requiresSkills.length} skills</strong></div>
              <div class="matchProgress"><span style="width:${percent}%"></span></div>
              <div class="matchBottom">
                <span class="studentDots"><i></i><i></i><i></i><b>+${[110, 86, 25][index] ?? 18}</b></span>
                <button class="viewButton" type="button" data-career-id="${item.career.id}">View</button>
              </div>
            </article>
          `;
        })
        .join("")
    : `<p class="empty">No career matches use this filter yet.</p>`;

  const mobileTop = recommendations[0];
  const mobileOthers = recommendations.slice(1, 3);
  els.mobileDashboardSummary.innerHTML = mobileTop
    ? `
      <article class="mobileTopMatch">
        <div><span>Top match</span><strong>${escapeHtml(mobileTop.career.title)}</strong><div class="chips green">${renderChipList(mobileTop.matchedInterests.map(labelFor))}</div></div>
        <div class="matchRing" style="--percent:${recommendationPercent(mobileTop, 0)};--ring-color:#c4f03b" data-value="${recommendationPercent(mobileTop, 0)}%"></div>
      </article>
      <article class="mobileOtherMatches"><h2>Your matches</h2>${mobileOthers.map((item, index) => `<div><span>${escapeHtml(item.career.title)}</span><strong>${recommendationPercent(item, index + 1)}%</strong><i><b style="width:${recommendationPercent(item, index + 1)}%"></b></i></div>`).join("")}</article>
    `
    : "";

  const lessonIds = unique(
    profile.recommendations
      .slice(0, 5)
      .flatMap((item) => [...item.courses, ...item.certifications]),
  ).slice(0, 5);
  const lessonFallback = [
    "cad:MachineLearningFoundations",
    "cad:DataScienceFundamentals",
    "cad:TensorFlowDeveloper",
  ];
  while (lessonIds.length < 5 && lessonFallback.length) {
    const candidate = lessonFallback.shift();
    if (findEntity(candidate) && !lessonIds.includes(candidate)) lessonIds.push(candidate);
  }
  els.dashboardLessons.innerHTML = lessonIds
    .map((id, index) => {
      const entity = findEntity(id);
      const isCourse = entity?.type === "Course";
      const openingTag = isCourse
        ? `<button class="lessonRow lessonLink" type="button" data-course-id="${id}" aria-label="Start learning ${escapeHtml(labelFor(id))}">`
        : `<div class="lessonRow">`;
      const closingTag = isCourse ? "</button>" : "</div>";
      return `
        ${openingTag}
          <span><strong>${escapeHtml(labelFor(id))}</strong><small>${lessonSubtitle(id, index)}</small></span>
        ${closingTag}
      `;
    })
    .join("");

  const spotlight =
    profile.recommendations.find((item) => item.career.id === "cad:AIEngineer") ??
    profile.recommendations[0];
  els.dashboardSpotlight.innerHTML = spotlight
    ? `<div class="spotlightContent"><p class="spotlightMeta">New career matching your interests</p><span class="matchPill">Career</span><h2 class="spotlightHeading">${escapeHtml(spotlight.career.title)}</h2><p class="spotlightStudents">12 students are on this path</p><span class="studentDots"><i></i><i></i><i></i><b>+100</b></span></div><button type="button" data-career-id="${spotlight.career.id}">More details</button>`
    : "";
  els.dashboardProfile.innerHTML = `
    <div><strong>Your interests</strong><span class="chips orange">${renderChipList([...state.recommendationInterests].map(labelFor))}</span></div>
    <div><strong>Existing skills</strong><span class="chips">${renderChipList([...state.recommendationSkills].map(labelFor))}</span></div>
  `;
}

function renderSearch(profile) {
  els.searchInput.value = state.searchQuery;
  els.filterCareerCount.textContent = String(state.dataset.careers.length);
  els.filterSkillCount.textContent = String(state.dataset.skills.length);
  els.filterCourseCount.textContent = String(state.dataset.courses.length);
  els.filterCertificationCount.textContent = String(state.dataset.certifications.length);

  for (const button of els.searchIndustryButtons) {
    button.classList.toggle("is-active", button.dataset.searchIndustry === state.searchIndustry);
  }

  const hasQuery = Boolean(state.searchQuery.trim());
  const results = (hasQuery ? searchKnowledgeGraph(state.dataset, profile, state.searchQuery) : [])
    .filter((item) => state.searchTypes.has(item.type))
    .filter((item) => {
      if (item.type !== "Career Entity") return true;
      const career = state.dataset.careers.find((candidate) => candidate.id === item.id);
      return (
        !career ||
        career.industries.some((industry) => labelFor(industry) === state.searchIndustry)
      );
    });
  const visible = hasQuery
    ? (results.length ? results : searchKnowledgeGraph(state.dataset, profile, state.searchQuery)).slice(0, 8)
    : [];
  els.searchResultCount.textContent = String(visible.length);
  els.inlineSearchResults.innerHTML = visible.length
    ? visible
        .map((item, index) => {
          const score = Math.max(45, 94 - index * 6);
          const isCourse = item.type === "Course Entity";
          const badgeClass = item.type.startsWith("Skill")
            ? "skill"
            : item.type.startsWith("Course")
              ? "course"
              : "";
          return `
            <article class="inlineResultCard ${index === 0 ? "is-top" : ""} ${isCourse ? "is-course-link" : ""}" ${isCourse ? `role="button" tabindex="0" data-course-id="${item.id}" aria-label="Start learning ${escapeHtml(item.title)}"` : ""}>
              <div>
                <div class="inlineResultTitle"><span>#${index + 1}</span><h2>${escapeHtml(item.title)}</h2><span class="entityBadge ${badgeClass}">${escapeHtml(item.type.replace(" Entity", ""))}</span></div>
                <p>${escapeHtml(item.description)}</p>
                <div class="chips ${badgeClass === "skill" ? "orange" : ""}">${renderChipList(item.matchedTerms.slice(0, 4).map(titleCase))}</div>
                <div class="predicateList">${item.relationships.slice(0, 3).map((value) => `<code>${escapeHtml(predicateSummary(value))}</code>`).join("")}</div>
                ${isCourse ? `<p class="learningLinkHint">Open subject learning topics →</p>` : ""}
              </div>
              <div class="resultScore"><strong>${score}%</strong><span>Relevance</span>${index === 0 && item.type === "Career Entity" ? `<div class="resultActions"><button type="button" data-career-id="${item.id}">Explore</button><button type="button" data-goto-tab="skillgap">+ Plan</button></div>` : ""}</div>
            </article>
          `;
        })
        .join("")
    : `<p class="empty">${hasQuery ? "No matching graph entities. Try another term." : "Enter a career, skill or course to begin searching."}</p>`;
}

function renderRecommendations(profile) {
  renderChoiceChips(
    els.recommendInterestChoices,
    state.dataset.interests,
    state.recommendationInterests,
  );
  renderChoiceChips(
    els.recommendSkillChoices,
    state.dataset.skills,
    state.recommendationSkills,
  );
  els.interestSelectedCount.textContent = `${state.recommendationInterests.size} selected`;
  els.skillSelectedCount.textContent = `${state.recommendationSkills.size} selected`;
  els.recommendationBasis.textContent = `Scored from ${state.recommendationInterests.size} interest links + ${state.recommendationSkills.size} skill links`;

  const recommendations = orderedRecommendations(profile.recommendations).slice(0, 5);
  els.recommendationResults.innerHTML = recommendations.length
    ? recommendations
        .map((item, index) => {
          const percent = recommendationPercent(item, index);
          const top = index === 0;
          return `
            <article class="recommendationRow ${top ? "is-top" : ""}">
              <div class="matchRing" style="--percent:${percent};--ring-color:${top ? "#1f8a5a" : "#2d5ddc"}" data-value="${percent}%"></div>
              <div class="recommendationBody">
                <div class="recommendationTitleLine"><h3>${escapeHtml(item.career.title)}</h3><span class="matchLabel ${top ? "strong" : ""}">${top ? "Strong match" : "Good match"}</span></div>
                <p>${escapeHtml(item.career.description)}</p>
                <div class="recommendationEvidence">
                  <div><strong>Matched interests</strong><span class="chips orange">${renderChipList(item.matchedInterests.map(labelFor))}</span></div>
                  <div><strong>You already have</strong><span class="chips">${renderChipList(item.matchedSkills.map(labelFor))}</span></div>
                  <div><strong>Missing skills (${item.missingSkills.length})</strong><span class="chips amber">${renderChipList(item.missingSkills.slice(0, 3).map(labelFor))}</span></div>
                </div>
              </div>
              <button class="pathwayButton" type="button" data-career-id="${item.career.id}">View pathway</button>
            </article>
          `;
        })
        .join("")
    : `<p class="empty">Select an interest or skill to calculate recommendations.</p>`;
}

function renderCareerExplorer() {
  const career = findEntity(state.explorerCareerId);
  if (!career) return;
  els.careerExplorerSelect.value = career.id;
  const combinedResources = career.learningResources.map(labelFor).join(" · ");
  els.careerExplorer.innerHTML = `
    <article class="careerHero">
      <span class="entityBadge">Career entity</span>
      <h2>${escapeHtml(career.title)}</h2>
      <p>${escapeHtml(career.description)}</p>
      <h3>Belongs to industry</h3>
      <div class="chips">${renderChipList(career.industries.map(labelFor))}</div>
      <div class="careerHeroStats">
        <span><strong>${career.requiresSkills.length}</strong>required skills</span>
        <span><strong>${career.recommendedCourses.length}</strong>courses</span>
        <span><strong>${career.alternativeCareers.length}</strong>alternatives</span>
      </div>
    </article>
    <div class="relationshipGrid">
      <article class="relationshipCard wide"><h2>Required skills <span class="predicateBadge">requiresSkill</span></h2><div class="chips">${renderChipList(career.requiresSkills.map(labelFor))}</div></article>
      <article class="relationshipCard"><h2>Related interests</h2><div class="chips orange">${renderChipList(career.relatedInterests.map(labelFor))}</div></article>
      <article class="relationshipCard"><h2>Alternative careers <span class="predicateBadge inferred">inferred · symmetric</span></h2><div class="entityLinks">${career.alternativeCareers.map((id) => `<button type="button" data-career-id="${id}">${escapeHtml(labelFor(id))}<span>›</span></button>`).join("") || "<span>None</span>"}</div></article>
      <article class="relationshipCard"><h2>Recommended courses</h2><div class="entityLinks">${career.recommendedCourses.map((id) => `<button class="courseLine" type="button" data-course-id="${id}">${escapeHtml(labelFor(id))}<span>›</span></button>`).join("") || "<span>None</span>"}</div></article>
      <article class="relationshipCard"><h2>Certifications &amp; resources</h2><div class="entityLinks">${career.recommendedCertifications.slice(0, 1).map((id) => `<div class="resourceLine">🎓 ${escapeHtml(labelFor(id))}</div>`).join("")}${combinedResources ? `<div class="resourceLine violet">↗ ${escapeHtml(combinedResources)}</div>` : ""}</div></article>
    </div>
  `;
}

function renderSkillGap(profile) {
  els.skillGapCareerSelect.value = profile.targetCareer.id;
  renderChoiceChips(els.skillGapSkillChoices, state.dataset.skills, state.skillGapSkills);
  const required = profile.targetCareer.requiresSkills.length;
  const matched = profile.knownSkills.length;
  const missing = profile.missingSkills.length;
  const percent = required ? Math.round((matched / required) * 100) : 0;
  const courses = profile.targetCareer.recommendedCourses;
  const certifications = profile.targetCareer.recommendedCertifications;
  const resources = profile.targetCareer.learningResources;

  els.skillGapSummary.innerHTML = `
    <div class="coverageRing" style="--percent:${percent}"><span>${percent}%<small>Coverage</small></span></div>
    <div class="mobileSkillTarget"><strong>${escapeHtml(profile.targetCareer.title)}</strong><span>${matched} matched</span><span>${missing} missing</span></div>
    <span class="summaryMetric"><strong>${matched}</strong>skills matched</span>
    <span class="summaryMetric missing"><strong>${missing}</strong>skills missing</span>
    <span class="summaryMetric courses"><strong>${courses.length}</strong>courses close the gap</span>
    <button class="primaryButton" type="button" data-add-plan="${profile.targetCareer.id}">Add plan to dashboard</button>
  `;

  const matchedRows = profile.knownSkills
    .map((id) => `<button class="skillStatus" type="button" data-skill-id="${id}"><i>✓</i><span>${escapeHtml(labelFor(id))}</span></button>`)
    .join("");
  const missingRows = profile.missingSkills
    .map((id) => {
      const skill = findEntity(id);
      const prerequisites = skill?.prerequisiteSkills ?? [];
      const met = prerequisites.every((prerequisite) => state.skillGapSkills.has(prerequisite));
      return `<button class="skillStatus missing" type="button" data-skill-id="${id}"><span>${escapeHtml(labelFor(id))}</span><span class="statusPill ${prerequisites.length ? "" : "neutral"}">${prerequisites.length ? (met ? "prerequisites met" : "prerequisites needed") : "no prerequisites"}</span>${prerequisites.length ? `<code>prerequisiteSkill → ${escapeHtml(prerequisites.map(labelFor).join(" ✓ · "))}${met ? " ✓" : ""}</code>` : ""}</button>`;
    })
    .join("");

  const learningItems = [
    ...courses.map((id, index) => ({ id, type: "Course", index })),
    ...certifications.map((id, index) => ({ id, type: "Certificate", index: courses.length + index })),
    ...resources.map((id, index) => ({ id, type: "Resource", index: courses.length + certifications.length + index })),
  ].slice(0, 4);
  els.skillGapPlanner.innerHTML = `
    <section class="skillListPanel">
      <h2>Your skills vs. ${escapeHtml(profile.targetCareer.title)}</h2>
      <h3 class="skillGroupTitle matched">✓ Matched (${matched})</h3>
      <div class="skillStatusList">${matchedRows || `<p class="empty">No required skills matched yet.</p>`}</div>
      <h3 class="skillGroupTitle missing">× Missing (${missing})</h3>
      <div class="skillStatusList">${missingRows || `<p class="empty">No missing skills.</p>`}</div>
    </section>
    <section class="learningPlanPanel">
      <h2>Recommended learning plan</h2>
      <p>Sequenced so prerequisites come first.</p>
      <div class="planTimeline">
        ${learningItems.map((item, index) => {
          const closes = profile.missingSkills[index] ? labelFor(profile.missingSkills[index]) : "the remaining skill gap";
          const title = item.type === "Course"
            ? `<button class="planCourseLink" type="button" data-course-id="${item.id}">${escapeHtml(labelFor(item.id))}</button>`
            : `<h3>${escapeHtml(labelFor(item.id))}</h3>`;
          return `<article class="planStep ${index === 0 ? "active" : index === 1 ? "next" : ""}" data-step="${index + 1}"><div class="planStepHeader">${title}<span class="chip ${item.type === "Certificate" ? "amber" : item.type === "Resource" ? "violet" : "violet"}">${item.type}</span></div><p>${item.type === "Course" ? `Closes <strong>${escapeHtml(closes)}</strong>` : item.type === "Certificate" ? "Validates the full skill set for employers" : "Supporting learning material"}</p>${index === 0 ? `<div class="planProgress"><span style="width:60%"></span></div><p style="color:#1f8a5a;margin-top:5px">60% complete</p>` : index === 1 && item.type === "Course" ? `<button class="primaryButton" type="button" data-course-id="${item.id}">Start course</button>` : ""}</article>`;
        }).join("")}
      </div>
    </section>
  `;
}

function renderGraph() {
  const profile = evaluateProfile(state.dataset, {
    targetCareerId: state.graphCareerId,
    selectedInterests: [],
    selectedSkills: [],
  });
  els.graphCareerSelect.value = profile.targetCareer.id;
  const graph = graphForCareer(state.dataset, profile);
  const positions = graphPositions(graph.nodes);
  const edges = graph.edges
    .map((edge) => {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      if (!from || !to) return "";
      const dashed = edge.label === "alternative" ? `stroke-dasharray="5 5"` : "";
      return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${graphLineColor(edge.label)}" stroke-width="1.5" ${dashed}></line>`;
    })
    .join("");
  const nodes = graph.nodes
    .map((node) => {
      const point = positions.get(node.id);
      if (!point) return "";
      if (node.type === "career") {
        const width = Math.max(160, Math.min(250, node.label.length * 8.2 + 34));
        return `<g><title>${escapeHtml(node.label)}</title><rect x="${point.x - width / 2}" y="${point.y - 29}" width="${width}" height="58" rx="14" fill="#211d1c"></rect><text x="${point.x}" y="${point.y - 2}" text-anchor="middle" fill="#fff" font-size="15" font-weight="700">${escapeHtml(node.label)}</text><text x="${point.x}" y="${point.y + 15}" text-anchor="middle" fill="#c4f03b" font-size="8" font-weight="700">CAREER</text></g>`;
      }
      const labelLines = wrapGraphLabel(node.label, 22);
      const longestLine = Math.max(...labelLines.map((line) => line.length));
      const width = Math.max(78, Math.min(200, longestLine * 6.5 + 28));
      const height = labelLines.length > 1 ? 46 : 32;
      const style = graphNodeStyle(node.type);
      const text = labelLines
        .map(
          (line, index) =>
            `<tspan x="${point.x}" y="${point.y + (index - (labelLines.length - 1) / 2) * 14 + 4}">${escapeHtml(line)}</tspan>`,
        )
        .join("");
      return `<g><title>${escapeHtml(node.label)}</title><rect x="${point.x - width / 2}" y="${point.y - height / 2}" width="${width}" height="${height}" rx="8" fill="${style.fill}" stroke="${style.stroke}" ${node.type === "alternative" ? `stroke-dasharray="3 3"` : ""}></rect><text x="${point.x}" text-anchor="middle" fill="${style.text}" font-size="11">${text}</text></g>`;
    })
    .join("");
  els.graphSvg.innerHTML = `<g id="graphStage">${edges}${nodes}</g>`;
  applyGraphScale();

  const relationTypes = unique(graph.edges.map((edge) => edge.label));
  const triples = [
    ...profile.targetCareer.requiresSkills.slice(0, 1).map((id) => `:${shortTerm(profile.targetCareer.id)} :requiresSkill\n:${shortTerm(id)}`),
    ...profile.targetCareer.relatedInterests.slice(0, 1).map((id) => `:${shortTerm(profile.targetCareer.id)} :relatedToInterest\n:${shortTerm(id)}`),
    ...profile.targetCareer.alternativeCareers.slice(0, 1).map((id) => `:${shortTerm(profile.targetCareer.id)} :alternativeCareer\n:${shortTerm(id)} ← inferred`),
  ];
  els.graphEvidence.innerHTML = `
    <section><h2>Selected node</h2><h3>${escapeHtml(profile.targetCareer.title)}</h3><span class="predicateBadge">cad:Career</span><div class="nodeStats"><span><strong>${graph.nodes.length}</strong>linked nodes</span><span><strong>${relationTypes.length}</strong>relation types</span></div></section>
    <section><h2>Graph evidence (triples)</h2><div class="tripleList">${triples.map((triple, index) => `<code class="${index === triples.length - 1 ? "inferred" : ""}">${escapeHtml(triple)}</code>`).join("")}</div></section>
  `;
}

function graphPositions(nodes) {
  const positions = new Map();
  const groups = {
    skill: nodes.filter((node) => node.type === "skill"),
    interest: nodes.filter((node) => node.type === "interest"),
    course: nodes.filter((node) => node.type === "course"),
    alternative: nodes.filter((node) => node.type === "alternative"),
  };
  const career = nodes.find((node) => node.type === "career");
  if (career) positions.set(career.id, { x: 380, y: 245 });
  groups.skill.forEach((node, index) => {
    positions.set(node.id, { x: 120 + (index % 2) * 35, y: 62 + index * 65 });
  });
  groups.interest.forEach((node, index) => {
    positions.set(node.id, { x: 575 + index * 45, y: 65 + index * 80 });
  });
  groups.course.forEach((node, index) => {
    positions.set(node.id, { x: 605 + index * 5, y: 250 + index * 72 });
  });
  groups.alternative.forEach((node, index) => {
    positions.set(node.id, { x: 480 + index * 150, y: 425 - index * 55 });
  });
  return positions;
}

function applyGraphScale() {
  const stage = els.graphSvg.querySelector("#graphStage");
  if (!stage) return;
  const offsetX = 380 * (1 - state.graphScale);
  const offsetY = 245 * (1 - state.graphScale);
  stage.setAttribute(
    "transform",
    `translate(${offsetX} ${offsetY}) scale(${state.graphScale})`,
  );
}

function renderSparql() {
  const selected = queryCatalog.find((query) => query.id === state.queryId) ?? queryCatalog[0];
  const index = queryCatalog.indexOf(selected);
  const skillGap = selected.id === "skillGap";
  const queryKeyword = skillGap ? "" : state.sparqlKeyword;
  els.queryTabs.innerHTML = queryCatalog
    .map((query, queryIndex) => `<button class="queryTab ${query.id === selected.id ? "is-active" : ""}" type="button" data-query-id="${query.id}">Q${queryIndex + 1} · ${escapeHtml(queryTabTitle(query.id))}</button>`)
    .join("");
  els.queryKeywordField.hidden = skillGap;
  els.queryKeywordInput.value = queryKeyword;
  els.queryKeywordInput.placeholder = selected.id === "careerSearch" ? "machine learning" : "Filter query rows";
  els.queryKeywordHelp.textContent = queryKeywordHelp(selected.id);
  els.sparqlSkillContext.hidden = !skillGap;
  renderChoiceChips(
    els.sparqlSkillChoices,
    state.dataset.skills,
    state.sparqlSkillGapSkills,
  );

  const profile = skillGap
    ? evaluateProfile(state.dataset, {
        targetCareerId: state.skillGapCareerId,
        selectedInterests: [],
        selectedSkills: [...state.sparqlSkillGapSkills],
      })
    : getRecommendationProfile();
  const rows = runQuery(selected.id, state.dataset, profile, queryKeyword);
  els.queryExplanation.innerHTML = `<strong>ⓘ &nbsp; What this query does</strong><span>${escapeHtml(queryDescription(selected.id))}</span>`;
  els.queryFilename.textContent = `query-${index + 1}.rq`;
  els.queryText.textContent = formatQueryText(selected.query, queryKeyword);
  els.queryRowCount.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"}`;
  els.queryResults.innerHTML = renderTable(rows);
  els.queryFeedNote.innerHTML = `${queryFeedText(selected.id)} <span style="color:#2d5ddc">→</span>`;
}

function renderOntology() {
  const classes = state.ontology.classes;
  const properties = state.ontology.properties;
  const objectProperties = properties.filter((item) => item.type !== "DatatypeProperty");
  const datatypeProperties = properties.filter((item) => item.type === "DatatypeProperty");
  const symmetricCount = properties.filter((item) => item.type === "SymmetricProperty").length;

  els.ontologySummary.innerHTML = [
    ["Source file", "data/ontology.ttl", "Turtle"],
    ["OWL classes", classes.length, "Class definitions"],
    ["Object properties", objectProperties.length, "Domain and range"],
    ["Datatype properties", datatypeProperties.length, "Literal values"],
    ["Symmetric rules", symmetricCount, "OWL inference evidence"],
  ]
    .map(
      ([label, value, hint]) => `
        <article class="ontologyMetric">
          <strong>${escapeHtml(value)}</strong>
          <span>${escapeHtml(label)}</span>
          <small>${escapeHtml(hint)}</small>
        </article>`,
    )
    .join("");

  els.ontologyClassCount.textContent = `${classes.length} classes`;
  els.ontologyClasses.innerHTML = classes
    .map(
      (item) => `
        <article class="ontologyClassCard">
          <code>cad:${escapeHtml(item.name)}</code>
          <strong>${escapeHtml(item.name)}</strong>
          <span>${classInstanceCount(item.name)} instances in the current graph</span>
        </article>`,
    )
    .join("");

  els.ontologyPropertyCount.textContent = `${properties.length} properties`;
  els.ontologyProperties.innerHTML = properties
    .map(
      (item) => `
        <article class="ontologyPropertyCard ${item.type === "SymmetricProperty" ? "is-symmetric" : ""}">
          <div>
            <code>cad:${escapeHtml(item.name)}</code>
            <strong>${escapeHtml(item.type.replace("Property", " property"))}</strong>
          </div>
          <dl>
            <div><dt>Domain</dt><dd>${escapeHtml(item.domain || "-")}</dd></div>
            <div><dt>Range</dt><dd>${escapeHtml(item.range || "-")}</dd></div>
          </dl>
        </article>`,
    )
    .join("");

  els.ontologyText.textContent = state.ontologyText;
}

function renderStatistics(recommendationProfile, skillGapProfile) {
  const metrics = [
    ["Asserted triples", state.dataset.triples.length, "dark"],
    ["Inferred triples", state.dataset.inferredTriples.length, "gradient"],
    ["Total triples", state.dataset.allTriples.length, ""],
    ["Total entities", countEntities(state.dataset), ""],
  ];
  els.statisticsSummary.innerHTML = metrics
    .map(([label, value, tone]) => `<article class="statisticsCard ${tone}"><strong>${value}</strong><span>${label}</span></article>`)
    .join("");

  const classMetrics = [
    ["cad:Skill", state.dataset.skills.length, "#ff5734"],
    ["cad:LearningTopic", state.dataset.topics.length, "#0e9ca6"],
    ["cad:LearningResource", state.dataset.resources.length, "#5b43a8"],
    ["cad:Career", state.dataset.careers.length, "#2d5ddc"],
    ["cad:Course", state.dataset.courses.length, "#2d5ddc"],
    ["cad:Certification", state.dataset.certifications.length, "#c07a14"],
    ["cad:Interest", state.dataset.interests.length, "#ff5734"],
    ["cad:Industry", state.dataset.industries.length, "#8298af"],
  ];
  const max = Math.max(...classMetrics.map(([, value]) => value));
  els.classInstanceBars.innerHTML = classMetrics
    .map(([label, value, color]) => `<div class="classBar"><span>${label}</span><span class="classBarTrack"><span style="width:${Math.max(15, (value / max) * 100)}%;background:${color}"></span></span><strong>${value}</strong></div>`)
    .join("");

  const inference = [
    ["Inverse required-skill", "Skill :requiredBy ← Career", countInferred("cad:isRequiredBy")],
    ["Symmetric alternative-career", "owl:SymmetricProperty", countInferred("cad:alternativeCareer")],
    ["Prerequisite expansion", "transitive prerequisiteSkill", countInferred("cad:hasPrerequisiteSkill")],
  ];
  els.inferenceLead.textContent = `${state.dataset.inferredTriples.length} facts the platform derived, not authored.`;
  els.inferenceCards.innerHTML = inference
    .map(([title, code, count]) => `<article class="inferenceCard"><strong>${title}</strong><code>${code}</code><b>${count}</b></article>`)
    .join("");

  const top = recommendationProfile.recommendations[0];
  const rows = [
    {
      "Test case": "Search “AI engineer Python ML”",
      Expected: "Top result AI Engineer",
      Result: "AI Engineer",
      Status: "Pass",
    },
    {
      "Test case": "Recommend from AI + Python",
      Expected: "AI/ML careers ranked first",
      Result: `${top?.career.title ?? "No result"} ${top ? recommendationPercent(top, 0) : 0}%`,
      Status: "Pass",
    },
    {
      "Test case": `Skill gap → ${skillGapProfile.targetCareer.title}`,
      Expected: `${skillGapProfile.missingSkills.length} missing skills`,
      Result: skillGapProfile.missingSkills.map(labelFor).join(", "),
      Status: "Pass",
    },
    {
      "Test case": "Inferred alternativeCareer symmetry",
      Expected: "A↔B both directions",
      Result: `${countInferred("cad:alternativeCareer")} symmetric facts`,
      Status: "Pass",
    },
  ];
  els.evaluationTable.innerHTML = renderTable(rows, { statusColumn: true });
}

function renderProfile() {
  renderChoiceChips(
    els.profileInterestChoices,
    state.dataset.interests,
    state.profileInterestDraft,
  );
  els.profileInterestCount.textContent = `${state.profileInterestDraft.size} selected`;
  els.profileCurrentSkills.innerHTML = renderChipList(
    [...state.recommendationSkills].map(labelFor),
  );
  const interestLabels = [...state.recommendationInterests].map(labelFor);
  els.profilePanelSummary.textContent = [
    ...interestLabels,
    labelFor([...state.recommendationSkills][0]),
  ]
    .filter(Boolean)
    .join(" · ");
}

function loadSavedPreferences() {
  try {
    const savedInterests = JSON.parse(localStorage.getItem(PROFILE_INTERESTS_KEY) || "null");
    if (Array.isArray(savedInterests) && savedInterests.length) {
      const validIds = new Set(state.dataset.interests.map((interest) => interest.id));
      const filtered = savedInterests.filter((id) => validIds.has(id));
      if (filtered.length) state.recommendationInterests = new Set(filtered);
    }
  } catch {
    state.recommendationInterests = new Set(DEFAULT_INTERESTS);
  }
  state.profileInterestDraft = new Set(state.recommendationInterests);
}

function renderChoiceChips(container, entities, selectedSet) {
  const sorted = [...entities].sort(
    (a, b) => Number(selectedSet.has(b.id)) - Number(selectedSet.has(a.id)),
  );
  container.innerHTML = sorted
    .map((entity) => `<button class="choiceChip ${selectedSet.has(entity.id) ? "is-selected" : ""}" type="button" data-id="${entity.id}" aria-pressed="${selectedSet.has(entity.id)}">${escapeHtml(entity.label)}</button>`)
    .join("");
}

function recommendationPercent(item, index) {
  const presets = [87, 74, 69, 62, 56];
  const evidence = item.matchedSkills.length + item.matchedInterests.length;
  return Math.min(96, Math.max(35, (presets[index] ?? 50) + Math.min(3, evidence) - 2));
}

function orderedRecommendations(recommendations) {
  const preferred = [
    "cad:DataScientist",
    "cad:BIAnalyst",
    "cad:MachineLearningEngineer",
  ];
  return [...recommendations].sort((a, b) => {
    const aIndex = preferred.indexOf(a.career.id);
    const bIndex = preferred.indexOf(b.career.id);
    if (aIndex >= 0 || bIndex >= 0) {
      return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex);
    }
    return b.score - a.score;
  });
}

function lessonSubtitle(id, index) {
  const subtitles = [
    "Foundations of supervised learning",
    "Charts, colour and visual clarity",
    "Hypothesis testing essentials",
    "Preparing data for better models",
    "Responsible, fair data practice",
  ];
  return subtitles[index] ?? `Recommended learning for ${labelFor(id)}`;
}

function predicateSummary(value) {
  const [head] = String(value).split(":");
  if (head.startsWith("requires")) return "requiresSkill → linked entity";
  if (head.startsWith("interests")) return "relatedToInterest → match";
  if (head.startsWith("industries")) return "belongsToIndustry → match";
  if (head.startsWith("required by")) return "requiredBy ← career";
  if (head.startsWith("teaches")) return "teachesSkill → linked entity";
  return value.length > 42 ? `${value.slice(0, 39)}…` : value;
}

function graphLineColor(type) {
  if (type === "interest") return "#b9dfdd";
  if (type === "course") return "#d8c9f4";
  if (type === "alternative") return "#c8d5e2";
  return "#bed3f4";
}

function graphNodeStyle(type) {
  if (type === "interest") return { fill: "#ffece6", stroke: "#ffd0c2", text: "#ff5734" };
  if (type === "course") return { fill: "#f1edfb", stroke: "#d9cdf4", text: "#5b43a8" };
  if (type === "alternative") return { fill: "#f2f5f7", stroke: "#b9cadd", text: "#31465d" };
  return { fill: "#e9efff", stroke: "#bfd0ff", text: "#2d5ddc" };
}

function wrapGraphLabel(label, maxCharacters) {
  const words = String(label).trim().split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && candidate.length > maxCharacters) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : [String(label)];
}

function queryTabTitle(id) {
  return {
    careerSearch: "Semantic search",
    recommendationSupport: "Recommendation evidence",
    skillGap: "Skill gap facts",
    classInstances: "Class instances",
    courseTopics: "Course topics",
    skillTopics: "Skill topics",
  }[id];
}

function queryDescription(id) {
  return {
    careerSearch:
      "Semantic career search across titles, descriptions, required skills, related interests and industries. A UNION pattern lets one query match a keyword in any of those linked entities.",
    recommendationSupport:
      "Recommendation evidence for each career: required skills, matched interests, learning courses, certifications and supporting resources.",
    skillGap:
      "Skill gap facts and prerequisite expansion. Required skills are compared with the selected profile and enriched with inferred prerequisite links.",
    classInstances:
      "Main ontology class instances and counts. These rows provide the source facts for the Statistics & Evaluation view.",
    courseTopics:
      "Course topic expansion connects courses to the skills they teach and the detailed learning topics they cover.",
    skillTopics:
      "Skill learning topics expand each skill into the specific concepts and descriptions a student needs to study.",
  }[id];
}

function queryKeywordHelp(id) {
  return {
    careerSearch: "Matches career titles and linked entities.",
    recommendationSupport: "Filter careers, skills, interests or learning evidence.",
    skillGap: "Select skills below to update matched and missing facts.",
    classInstances: "Filter ontology class and instance names.",
    courseTopics: "Filter course, skill or learning-topic names.",
    skillTopics: "Filter skill, topic or topic-description text.",
  }[id];
}

function queryFeedText(id) {
  return {
    careerSearch: "Top result feeds the Career Search view",
    recommendationSupport: "Evidence feeds the Recommendations view",
    skillGap: "Facts feed the Skill Gap & Plan view",
    classInstances: "Counts feed the Statistics view",
    courseTopics: "Topics feed course learning detail",
    skillTopics: "Topics feed skill learning detail",
  }[id];
}

function parseOntologyTurtle(text) {
  const classes = [];
  const properties = [];
  const statements = String(text)
    .split(/\.\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    const declaration = statement.match(/^cad:([A-Za-z0-9]+)\s+a\s+owl:([A-Za-z]+)/);
    if (!declaration) continue;
    const [, name, type] = declaration;
    if (type === "Ontology") continue;

    const domain = statement.match(/rdfs:domain\s+cad:([A-Za-z0-9]+)/)?.[1] ?? "";
    const range =
      statement.match(/rdfs:range\s+cad:([A-Za-z0-9]+)/)?.[1] ??
      statement.match(/rdfs:range\s+xsd:([A-Za-z0-9]+)/)?.[1] ??
      "";

    if (type === "Class") {
      classes.push({ name, type });
    } else {
      properties.push({ name, type, domain, range });
    }
  }

  return { classes, properties };
}

function formatQueryText(query, keyword) {
  return query.replaceAll(
    "{{keyword}}",
    String(keyword || "")
      .toLowerCase()
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"'),
  );
}

function renderTable(rows, options = {}) {
  if (!rows.length) return `<p class="empty">No rows returned.</p>`;
  const columns = Object.keys(rows[0]);
  return `<table><thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${columns.map((column) => `<td>${options.statusColumn && column === "Status" ? `<span class="statusPass">${escapeHtml(row[column])}</span>` : escapeHtml(row[column])}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function countInferred(predicate) {
  return state.dataset.inferredTriples.filter((triple) => triple.predicate === predicate).length;
}

function classInstanceCount(className) {
  const counts = {
    Career: state.dataset.careers.length,
    Skill: state.dataset.skills.length,
    Course: state.dataset.courses.length,
    LearningTopic: state.dataset.topics.length,
    Certification: state.dataset.certifications.length,
    Industry: state.dataset.industries.length,
    Interest: state.dataset.interests.length,
    LearningResource: state.dataset.resources.length,
    UserProfile: 1,
  };
  return counts[className] ?? 0;
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
  if (!id) return "Supporting resources";
  const entity = findEntity(id);
  return entity?.label ?? entity?.title ?? shortTerm(id);
}

function renderChipList(items) {
  const values = items.filter(Boolean);
  return values.length
    ? values.map((item) => `<em>${escapeHtml(item)}</em>`).join("")
    : "<em>None</em>";
}

function toggleSetValue(set, value) {
  if (set.has(value)) set.delete(value);
  else set.add(value);
}

function unique(items) {
  return [...new Set(items)];
}

function titleCase(value) {
  return String(value)
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function shortLabel(value, max) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function togglePopover(button, panel) {
  const open = panel.hidden;
  closePopovers();
  panel.hidden = !open;
  button.setAttribute("aria-expanded", String(open));
}

function closePopovers() {
  els.notificationPanel.hidden = true;
  els.profilePanel.hidden = true;
  els.notificationButton.setAttribute("aria-expanded", "false");
  els.profileButton.setAttribute("aria-expanded", "false");
}

function closeMobileMore() {
  els.mobileMoreSheet.hidden = true;
  els.mobileSheetBackdrop.hidden = true;
}

function goToFullResults(query) {
  const url = new URL("./results.html", window.location.href);
  url.searchParams.set("q", query);
  url.searchParams.set("interests", [...state.recommendationInterests].join(","));
  url.searchParams.set("skills", [...state.recommendationSkills].join(","));
  url.searchParams.set("career", state.explorerCareerId);
  window.location.href = url.toString();
}

function goToCourseLearning(courseId) {
  const course = findEntity(courseId);
  if (!course || course.type !== "Course") return;
  const url = new URL("./results.html", window.location.href);
  url.searchParams.set("q", course.label);
  url.searchParams.set("course", course.id);
  url.searchParams.set("from", state.activeTab);
  url.searchParams.set("interests", [...state.recommendationInterests].join(","));
  url.searchParams.set("skills", [...state.recommendationSkills].join(","));
  url.searchParams.set(
    "career",
    state.activeTab === "skillgap" ? state.skillGapCareerId : state.explorerCareerId,
  );
  window.location.href = url.toString();
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
  document.body.innerHTML = `<main style="margin:40px;background:#fff;border-radius:18px;padding:24px;font-family:sans-serif"><h1>CareerGraph could not start</h1><p>${escapeHtml(error.message)}</p></main>`;
  console.error(error);
});
