import { evaluateProfile, loadDataset, searchKnowledgeGraph } from "../src/semanticGraph.js";

const COMPLETED_TOPICS_KEY = "careergraph.completedTopics.v1";
const LAST_TOPIC_KEY = "careergraph.lastTopic.v1";

const state = {
  dataset: null,
  query: "",
  profile: {
    targetCareerId: "cad:AIEngineer",
    selectedInterests: ["cad:ArtificialIntelligence"],
    selectedSkills: ["cad:Python"],
  },
  detailCourseId: "",
  detailSkillId: "",
  detailTopicId: "",
  returnTab: "",
  completedTopics: new Set(),
  outlineExpanded: window.matchMedia("(min-width: 901px)").matches,
};

const els = {
  form: document.querySelector("#resultsSearchForm"),
  input: document.querySelector("#resultsSearchInput"),
  summary: document.querySelector("#resultSummary"),
  list: document.querySelector("#resultList"),
  pageEyebrow: document.querySelector(".pageIntro .eyebrow"),
  pageHeading: document.querySelector(".pageIntro h1"),
  pageDescription: document.querySelector(".pageIntro h1 + p"),
  pageBadge: document.querySelector(".pageIntro .termBadge"),
  breadcrumbTitle: document.querySelector(".breadcrumb strong"),
  mobileTitle: document.querySelector(".mobileHeader strong"),
  mobileBack: document.querySelector(".mobileHeaderButton"),
  topBack: document.querySelector(".resultTopBack"),
};

async function init() {
  readParams();
  const xml = await fetch("../data/career_knowledge_graph.xml").then((response) => response.text());
  state.dataset = loadDataset(xml);
  loadLearningProgress();
  els.input.value = state.query;
  els.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = els.input.value.trim();
    if (!query) return;
    const url = new URL(window.location.href);
    url.searchParams.set("q", query);
    url.searchParams.delete("course");
    url.searchParams.delete("skill");
    url.searchParams.delete("topic");
    window.location.href = url.toString();
  });
  els.list.addEventListener("click", handleResultListClick);
  els.list.addEventListener("keydown", handleResultListKeydown);
  window.addEventListener("popstate", () => {
    readParams();
    render();
  });
  render();
}

function readParams() {
  const params = new URLSearchParams(window.location.search);
  state.query = params.get("q") || "";
  const career = params.get("career");
  const course = params.get("course");
  const skill = params.get("skill");
  const topic = params.get("topic");
  const from = params.get("from");
  const interests = csvParam(params.get("interests"));
  const skills = csvParam(params.get("skills"));
  if (career) state.profile.targetCareerId = career;
  state.detailCourseId = course || "";
  state.detailSkillId = skill || "";
  state.detailTopicId = topic || "";
  state.returnTab = from || "";
  if (interests.length) state.profile.selectedInterests = interests;
  if (skills.length) state.profile.selectedSkills = skills;
}

function render() {
  const profile = evaluateProfile(state.dataset, state.profile);
  const results = searchKnowledgeGraph(state.dataset, profile, state.query);
  if (state.detailTopicId) {
    updatePageChrome("topic", findEntity(state.detailTopicId));
    renderTopicDetail(profile, results);
    return;
  }

  if (state.detailSkillId) {
    updatePageChrome("skill", findEntity(state.detailSkillId));
    renderSkillDetail(profile, results);
    return;
  }

  if (state.detailCourseId) {
    updatePageChrome("course", findEntity(state.detailCourseId));
    renderCourseDetail(profile, results);
    return;
  }

  updatePageChrome("results");
  if (!state.query.trim()) {
    els.summary.innerHTML = [
      metricCard("Query", "Not entered"),
      metricCard("Top entity", "—"),
      metricCard("Entity types", 0),
    ].join("");
    els.list.innerHTML = `<p class="empty">Enter a career, skill or course to begin searching.</p>`;
    return;
  }

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
      (item) => {
        const isCourse = item.type === "Course Entity";
        const isSkill = item.type === "Skill Entity";
        const isClickable = isCourse || isSkill;
        const dataAttrs = isCourse
          ? `role="button" tabindex="0" data-course-id="${escapeHtml(item.id)}" aria-label="Open course detail for ${escapeHtml(item.title)}"`
          : isSkill
            ? `role="button" tabindex="0" data-skill-id="${escapeHtml(item.id)}" aria-label="Open skill detail for ${escapeHtml(item.title)}"`
            : "";
        return `
        <article class="resultCard ${isClickable ? "clickableResult" : ""}" ${dataAttrs}>
          <div class="resultBadge">${escapeHtml(item.type)}</div>
          <div class="resultBody">
            <h2>${escapeHtml(item.title)}</h2>
            <p class="resultSubtitle">${escapeHtml(item.subtitle)}</p>
            <p>${escapeHtml(item.description)}</p>
            <div class="chips">
              ${item.relationships.map((relationship) => `<em>${escapeHtml(relationship)}</em>`).join("")}
            </div>
            <p class="explainLine">${escapeHtml(item.explanation)}</p>
            ${isCourse ? `<p class="courseHint">Click to view course learning topics</p>` : ""}
            ${isSkill ? `<p class="courseHint">Click to view skill learning topics</p>` : ""}
          </div>
          <div class="scoreBox">
            <strong>${Math.round(item.score)}</strong>
            <span>Semantic score</span>
            <small>${item.matchedTerms.length ? item.matchedTerms.map(escapeHtml).join(", ") : "graph match"}</small>
          </div>
        </article>
      `;
      },
    )
    .join("");
}

function handleResultListClick(event) {
  const outlineToggle = event.target.closest("[data-outline-toggle]");
  if (outlineToggle) {
    state.outlineExpanded = !state.outlineExpanded;
    render();
    return;
  }

  const completeButton = event.target.closest("[data-complete-topic]");
  if (completeButton) {
    markTopicComplete(completeButton.dataset.completeTopic);
    render();
    return;
  }

  const topicCard = event.target.closest("[data-topic-id]");
  if (topicCard) {
    openTopicDetail(topicCard.dataset.topicId);
    return;
  }

  const courseCard = event.target.closest("[data-course-id]");
  if (courseCard) {
    openCourseDetail(courseCard.dataset.courseId);
    return;
  }

  const skillCard = event.target.closest("[data-skill-id]");
  if (skillCard) openSkillDetail(skillCard.dataset.skillId);
}

function handleResultListKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") return;
  const topicCard = event.target.closest("[data-topic-id]");
  const courseCard = event.target.closest("[data-course-id]");
  const skillCard = event.target.closest("[data-skill-id]");
  if (!topicCard && !courseCard && !skillCard) return;
  event.preventDefault();
  if (topicCard) {
    openTopicDetail(topicCard.dataset.topicId);
  } else if (courseCard) {
    openCourseDetail(courseCard.dataset.courseId);
  } else {
    openSkillDetail(skillCard.dataset.skillId);
  }
}

function openCourseDetail(courseId) {
  state.detailCourseId = courseId;
  state.detailSkillId = "";
  state.detailTopicId = "";
  const url = new URL(window.location.href);
  url.searchParams.set("course", courseId);
  url.searchParams.delete("skill");
  url.searchParams.delete("topic");
  window.history.pushState({ courseId }, "", url.toString());
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openSkillDetail(skillId) {
  state.detailSkillId = skillId;
  state.detailCourseId = "";
  state.detailTopicId = "";
  const url = new URL(window.location.href);
  url.searchParams.set("skill", skillId);
  url.searchParams.delete("course");
  url.searchParams.delete("topic");
  window.history.pushState({ skillId }, "", url.toString());
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openTopicDetail(topicId) {
  state.detailTopicId = topicId;
  const url = new URL(window.location.href);
  url.searchParams.set("topic", topicId);
  window.history.pushState({ topicId }, "", url.toString());
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeCourseDetail() {
  if (state.returnTab) {
    returnToApp();
    return;
  }
  state.detailCourseId = "";
  const url = new URL(window.location.href);
  url.searchParams.delete("course");
  window.history.pushState({}, "", url.toString());
  render();
}

function closeSkillDetail() {
  if (state.returnTab) {
    returnToApp();
    return;
  }
  state.detailSkillId = "";
  const url = new URL(window.location.href);
  url.searchParams.delete("skill");
  window.history.pushState({}, "", url.toString());
  render();
}

function closeTopicDetail() {
  state.detailTopicId = "";
  const url = new URL(window.location.href);
  url.searchParams.delete("topic");
  window.history.pushState({}, "", url.toString());
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderCourseDetail(profile, results) {
  const course = findEntity(state.detailCourseId);
  if (!course || course.type !== "Course") {
    state.detailCourseId = "";
    render();
    return;
  }

  const relevantCareers = state.dataset.careers.filter((career) => career.recommendedCourses.includes(course.id));
  const topicEntities = (course.coversTopics ?? []).map(findEntity).filter(Boolean);
  const skillLabels = labelsFor(course.teachesSkills ?? []);
  const resultMatch = results.find((item) => item.id === course.id);

  els.summary.innerHTML = [
    metricCard("Course", course.label),
    metricCard("Skills taught", skillLabels.length),
    metricCard("Learning topics", topicEntities.length),
  ].join("");

  els.list.innerHTML = `
    <section class="courseDetail">
      <button class="secondaryBack" type="button" id="backToResults">${escapeHtml(backButtonLabel())}</button>
      <article class="courseHero">
        <p class="eyebrow">Course detail</p>
        <h2>${escapeHtml(course.label)}</h2>
        <p>
          This second-level view expands the selected course entity through
          <strong>teachesSkill</strong> and <strong>coversTopic</strong> relationships in the knowledge graph.
        </p>
        <div class="chips">
          ${renderChipList(skillLabels)}
        </div>
      </article>
      <div class="courseEvidenceGrid">
        <article class="infoCard">
          <span>Recommended for careers</span>
          <div class="chips">${renderChipList(relevantCareers.map((career) => career.title))}</div>
        </article>
        <article class="infoCard">
          <span>Search evidence</span>
          <p>${escapeHtml(resultMatch?.explanation ?? "Retrieved from course-topic graph links.")}</p>
        </article>
      </div>
      <section class="topicPanel">
        <div class="sectionHeader">
          <h2>What You Will Learn</h2>
          <p>These learning topics are connected to the course as semantic topic entities.</p>
        </div>
        <div class="topicGrid">
          ${topicEntities
            .map(
              (topic, index) => `
                <article class="topicCard topicLink" role="button" tabindex="0" data-topic-id="${escapeHtml(topic.id)}" aria-label="Learn ${escapeHtml(topic.label)}">
                  <span>${String(index + 1).padStart(2, "0")}</span>
                  <h3>${escapeHtml(topic.label)}</h3>
                  <p>${escapeHtml(topic.description || "Course topic linked through the coversTopic relationship.")}</p>
                  <b>Open topic →</b>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
    </section>
  `;

  document.querySelector("#backToResults")?.addEventListener("click", closeCourseDetail);
}

function renderSkillDetail(profile, results) {
  const skill = findEntity(state.detailSkillId);
  if (!skill || skill.type !== "Skill") {
    state.detailSkillId = "";
    render();
    return;
  }

  const requiredBy = state.dataset.careers.filter((career) => career.requiresSkills.includes(skill.id));
  const prerequisiteEntities = (skill.prerequisiteSkills ?? []).map(findEntity).filter(Boolean);
  const topicEntities = (skill.learningTopics ?? []).map(findEntity).filter(Boolean);
  const resultMatch = results.find((item) => item.id === skill.id);
  const matchingCourses = state.dataset.courses.filter((course) => (course.teachesSkills ?? []).includes(skill.id));

  els.summary.innerHTML = [
    metricCard("Skill", skill.label),
    metricCard("Required by careers", requiredBy.length),
    metricCard("Learning topics", topicEntities.length),
  ].join("");

  els.list.innerHTML = `
    <section class="courseDetail">
      <button class="secondaryBack" type="button" id="backToResults">${escapeHtml(backButtonLabel())}</button>
      <article class="courseHero">
        <p class="eyebrow">Skill detail</p>
        <h2>${escapeHtml(skill.label)}</h2>
        <p>
          This second-level view expands the selected skill entity through
          <strong>hasLearningTopic</strong>, <strong>prerequisiteSkill</strong> and career requirement relationships.
        </p>
        <div class="chips">
          ${renderChipList(topicEntities.slice(0, 8).map((topic) => topic.label))}
        </div>
      </article>
      <div class="courseEvidenceGrid">
        <article class="infoCard">
          <span>Required by careers</span>
          <div class="chips">${renderChipList(requiredBy.map((career) => career.title))}</div>
        </article>
        <article class="infoCard">
          <span>Prerequisite skills</span>
          <div class="chips rule">${renderChipList(prerequisiteEntities.map((item) => item.label))}</div>
        </article>
        <article class="infoCard">
          <span>Courses teaching this skill</span>
          <div class="chips">${renderChipList(matchingCourses.map((course) => course.label))}</div>
        </article>
        <article class="infoCard">
          <span>Search evidence</span>
          <p>${escapeHtml(resultMatch?.explanation ?? "Retrieved from skill-topic graph links.")}</p>
        </article>
      </div>
      <section class="topicPanel">
        <div class="sectionHeader">
          <h2>What You Need to Learn</h2>
          <p>These learning topics are connected to the skill as semantic topic entities.</p>
        </div>
        <div class="topicGrid">
          ${topicEntities
            .map(
              (topic, index) => `
                <article class="topicCard topicLink" role="button" tabindex="0" data-topic-id="${escapeHtml(topic.id)}" aria-label="Learn ${escapeHtml(topic.label)}">
                  <span>${String(index + 1).padStart(2, "0")}</span>
                  <h3>${escapeHtml(topic.label)}</h3>
                  <p>${escapeHtml(topic.description || "Skill topic linked through the hasLearningTopic relationship.")}</p>
                  <b>Open topic →</b>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
    </section>
  `;

  document.querySelector("#backToResults")?.addEventListener("click", closeSkillDetail);
}

function renderTopicDetail(profile, results) {
  const topic = findEntity(state.detailTopicId);
  if (!topic || topic.type !== "LearningTopic") {
    state.detailTopicId = "";
    render();
    return;
  }

  const context = resolveTopicContext(topic);
  const outlineIds = context?.topicIds ?? [topic.id];
  const currentIndex = Math.max(0, outlineIds.indexOf(topic.id));
  const previousTopic = findEntity(outlineIds[currentIndex - 1]);
  const nextTopic = findEntity(outlineIds[currentIndex + 1]);
  const completedCount = outlineIds.filter((id) => state.completedTopics.has(id)).length;
  const progressPercent = outlineIds.length
    ? Math.round((completedCount / outlineIds.length) * 100)
    : 0;
  const isCompleted = state.completedTopics.has(topic.id);

  const relatedCourses = state.dataset.courses.filter((course) =>
    (course.coversTopics ?? []).includes(topic.id),
  );
  const directlyRelatedSkills = state.dataset.skills.filter((skill) =>
    (skill.learningTopics ?? []).includes(topic.id),
  );
  const relatedSkills = uniqueEntities([
    ...directlyRelatedSkills,
    ...relatedCourses
      .flatMap((course) => course.teachesSkills ?? [])
      .map(findEntity)
      .filter(Boolean),
  ]);
  const relatedCareers = state.dataset.careers.filter(
    (career) =>
      career.recommendedCourses.some((courseId) =>
        relatedCourses.some((course) => course.id === courseId),
      ) || career.requiresSkills.some((skillId) => relatedSkills.some((skill) => skill.id === skillId)),
  );

  recordLastVisitedTopic(topic, context);

  els.summary.innerHTML = [
    metricCard(context?.type === "course" ? "Course" : "Skill pathway", context?.entity.label ?? "Topic learning"),
    metricCard("Topic", `${currentIndex + 1} of ${outlineIds.length}`),
    metricCard("Estimated reading", `${topic.estimatedMinutes || 5} min`),
  ].join("");

  els.list.innerHTML = `
    <section class="courseDetail learningDetail">
      <button class="secondaryBack" type="button" id="backToResults">${escapeHtml(topicBackLabel())}</button>
      <div class="learningProgressCard">
        <div>
          <span>${escapeHtml(context?.entity.label ?? "Topic learning")}</span>
          <strong>${completedCount} of ${outlineIds.length} topics completed</strong>
        </div>
        <b>${progressPercent}%</b>
        <div class="learningProgressTrack" aria-label="${progressPercent}% complete">
          <span style="width:${progressPercent}%"></span>
        </div>
      </div>
      <div class="learningReader">
        <aside class="learningOutline">
          <button class="outlineToggle" type="button" data-outline-toggle aria-expanded="${state.outlineExpanded}">
            <span>Course outline</span>
            <b>${state.outlineExpanded ? "Hide" : "Show"}</b>
          </button>
          <div class="learningOutlineHeader">
            <span>${context?.type === "course" ? "Course curriculum" : "Skill curriculum"}</span>
            <h2>${escapeHtml(context?.entity.label ?? "Topic learning")}</h2>
            <p>${outlineIds.length} reading lessons</p>
          </div>
          <nav class="learningOutlineList ${state.outlineExpanded ? "is-open" : ""}" aria-label="Learning topics">
            ${outlineIds
              .map((id, index) => {
                const item = findEntity(id);
                const complete = state.completedTopics.has(id);
                return `
                  <button class="${id === topic.id ? "is-current" : ""} ${complete ? "is-complete" : ""}" type="button" data-topic-id="${id}">
                    <i>${complete ? "✓" : index + 1}</i>
                    <span><small>Topic ${index + 1}</small><strong>${escapeHtml(item?.label ?? labelFor(id))}</strong></span>
                  </button>
                `;
              })
              .join("")}
          </nav>
        </aside>
        <article class="lessonArticle">
          <header class="lessonArticleHeader">
            <div>
              <p class="eyebrow">Topic ${currentIndex + 1} · ${topic.estimatedMinutes || 5} min read</p>
              <h1>${escapeHtml(topic.label)}</h1>
              <p>${escapeHtml(topic.overview || topic.description)}</p>
            </div>
            <span class="completionBadge ${isCompleted ? "is-complete" : ""}">${isCompleted ? "Completed ✓" : "In progress"}</span>
          </header>

          <section class="lessonObjectives">
            <h2>Learning objectives</h2>
            <p>By the end of this lesson, you should be able to:</p>
            <ul>${topic.objectives.map((objective) => `<li>${escapeHtml(objective)}</li>`).join("")}</ul>
          </section>

          <div class="lessonSections">
            ${topic.sections
              .map(
                (section, index) => `
                  <section>
                    <span class="lessonSectionNumber">${String(index + 1).padStart(2, "0")}</span>
                    <h2>${escapeHtml(section.title)}</h2>
                    ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
                  </section>
                `,
              )
              .join("")}
          </div>

          <section class="lessonCallout example">
            <span>Worked example</span>
            <h2>${escapeHtml(topic.workedExample.title)}</h2>
            ${topic.workedExample.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          </section>

          <section class="lessonCallout practice">
            <span>Optional practice</span>
            <h2>${escapeHtml(topic.practice.title)}</h2>
            ${topic.practice.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          </section>

          <section class="lessonTakeaways">
            <h2>Key takeaways</h2>
            <ul>${topic.takeaways.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </section>

          <details class="semanticEvidence">
            <summary>Knowledge graph connections</summary>
            <div class="courseEvidenceGrid">
              <article class="infoCard">
                <span>Skills connected to this topic</span>
                <div class="chips">${renderChipList(relatedSkills.map((skill) => skill.label))}</div>
              </article>
              <article class="infoCard">
                <span>Relevant career pathways</span>
                <div class="chips orange">${renderChipList(relatedCareers.map((career) => career.title))}</div>
              </article>
              <article class="infoCard">
                <span>Courses teaching this topic</span>
                <div class="chips violet">${renderChipList(relatedCourses.map((course) => course.label))}</div>
              </article>
            </div>
          </details>

          <footer class="lessonNavigation">
            ${previousTopic ? `<button class="lessonNavButton previous" type="button" data-topic-id="${previousTopic.id}"><small>Previous</small><strong>← ${escapeHtml(previousTopic.label)}</strong></button>` : `<span></span>`}
            <button class="completeTopicButton ${isCompleted ? "is-complete" : ""}" type="button" data-complete-topic="${topic.id}" ${isCompleted ? "disabled" : ""}>${isCompleted ? "Completed ✓" : "Mark as complete"}</button>
            ${nextTopic ? `<button class="lessonNavButton next" type="button" data-topic-id="${nextTopic.id}"><small>Next</small><strong>${escapeHtml(nextTopic.label)} →</strong></button>` : `<span></span>`}
          </footer>
        </article>
      </div>
    </section>
  `;

  document.querySelector("#backToResults")?.addEventListener("click", closeTopicDetail);
}

function resolveTopicContext(topic) {
  const requestedCourse = findEntity(state.detailCourseId);
  if (
    requestedCourse?.type === "Course" &&
    (requestedCourse.coversTopics ?? []).includes(topic.id)
  ) {
    return { type: "course", entity: requestedCourse, topicIds: requestedCourse.coversTopics };
  }

  const requestedSkill = findEntity(state.detailSkillId);
  if (
    requestedSkill?.type === "Skill" &&
    (requestedSkill.learningTopics ?? []).includes(topic.id)
  ) {
    return { type: "skill", entity: requestedSkill, topicIds: requestedSkill.learningTopics };
  }

  const relatedCourse = state.dataset.courses.find((course) =>
    (course.coversTopics ?? []).includes(topic.id),
  );
  if (relatedCourse) {
    adoptTopicContext("course", relatedCourse.id);
    return { type: "course", entity: relatedCourse, topicIds: relatedCourse.coversTopics };
  }

  const relatedSkill = state.dataset.skills.find((skill) =>
    (skill.learningTopics ?? []).includes(topic.id),
  );
  if (relatedSkill) {
    adoptTopicContext("skill", relatedSkill.id);
    return { type: "skill", entity: relatedSkill, topicIds: relatedSkill.learningTopics };
  }

  return null;
}

function adoptTopicContext(type, id) {
  const url = new URL(window.location.href);
  if (type === "course") {
    state.detailCourseId = id;
    state.detailSkillId = "";
    url.searchParams.set("course", id);
    url.searchParams.delete("skill");
  } else {
    state.detailSkillId = id;
    state.detailCourseId = "";
    url.searchParams.set("skill", id);
    url.searchParams.delete("course");
  }
  window.history.replaceState({}, "", url.toString());
}

function loadLearningProgress() {
  try {
    const stored = JSON.parse(localStorage.getItem(COMPLETED_TOPICS_KEY) || "[]");
    state.completedTopics = new Set(Array.isArray(stored) ? stored : []);
  } catch {
    state.completedTopics = new Set();
  }
}

function markTopicComplete(topicId) {
  if (!findEntity(topicId)) return;
  state.completedTopics.add(topicId);
  try {
    localStorage.setItem(COMPLETED_TOPICS_KEY, JSON.stringify([...state.completedTopics]));
  } catch {
    // The lesson remains usable if browser storage is unavailable.
  }
}

function recordLastVisitedTopic(topic, context) {
  try {
    localStorage.setItem(
      LAST_TOPIC_KEY,
      JSON.stringify({
        topicId: topic.id,
        contextType: context?.type ?? "",
        contextId: context?.entity.id ?? "",
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // The lesson remains usable if browser storage is unavailable.
  }
}

function metricCard(label, value) {
  return `
    <article class="metricCard">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function backButtonLabel() {
  const labels = {
    dashboard: "Back to dashboard",
    search: "Back to career search",
    recommendations: "Back to recommendations",
    explorer: "Back to career explorer",
    skillgap: "Back to learning plan",
    graph: "Back to knowledge graph",
    sparql: "Back to SPARQL viewer",
    stats: "Back to statistics",
  };
  return labels[state.returnTab] ?? "Back to search results";
}

function topicBackLabel() {
  if (state.detailCourseId) return "Back to course learning";
  if (state.detailSkillId) return "Back to skill learning";
  return backButtonLabel();
}

function updatePageChrome(mode, entity = null) {
  const isCourse = mode === "course";
  const isSkill = mode === "skill";
  const isTopic = mode === "topic";
  const isDetail = isCourse || isSkill || isTopic;
  document.body.classList.toggle("learningMode", isTopic);
  els.form.hidden = isDetail;

  if (!isDetail) {
    document.title = "CareerGraph · Semantic Search Results";
    els.pageEyebrow.textContent = "Semantic search";
    els.pageHeading.textContent = "Knowledge graph results";
    els.pageDescription.textContent =
      "Ranked career, skill and course entities with relationship-aware explanations.";
    els.pageBadge.textContent = "Entity results";
    els.breadcrumbTitle.textContent = "Search Results";
    els.mobileTitle.textContent = "Search Results";
    els.topBack.href = "./index.html?tab=search";
    els.topBack.textContent = "← Back to Career Search";
    els.mobileBack.href = "./index.html?tab=search";
    updateActiveNavigation("search");
    return;
  }

  const detailName = isCourse ? "Course Learning" : isSkill ? "Skill Learning" : "Topic Learning";
  document.title = `CareerGraph · ${entity?.label ?? detailName}`;
  els.pageEyebrow.textContent = "Semantic learning";
  els.pageHeading.textContent = detailName;
  els.pageDescription.textContent = isCourse
    ? "Follow the skills and learning topics linked to this subject in the career knowledge graph."
    : isSkill
      ? "Explore the topics, prerequisites and courses linked to this skill in the career knowledge graph."
      : "Study this topic and trace the courses, skills and careers connected to it in the knowledge graph.";
  els.pageBadge.textContent = "XML-linked syllabus";
  els.breadcrumbTitle.textContent = detailName;
  els.mobileTitle.textContent = detailName;
  els.topBack.href = returnUrl();
  els.topBack.textContent = `← ${backButtonLabel()}`;
  els.mobileBack.href = returnUrl();
  updateActiveNavigation(state.returnTab || "search");
}

function updateActiveNavigation(tabName) {
  document.querySelectorAll(".sideNav .tab, .mobileNav a").forEach((link) => {
    const linkTab = new URL(link.href).searchParams.get("tab");
    link.classList.toggle("is-active", linkTab === tabName);
  });
}

function returnToApp() {
  window.location.href = returnUrl();
}

function returnUrl() {
  const url = new URL("./index.html", window.location.href);
  url.searchParams.set("tab", state.returnTab || "dashboard");
  return url.toString();
}

function csvParam(value) {
  return value ? value.split(",").filter(Boolean) : [];
}

function findEntity(id) {
  return [
    ...state.dataset.careers,
    ...state.dataset.skills,
    ...state.dataset.interests,
    ...state.dataset.industries,
    ...state.dataset.courses,
    ...state.dataset.topics,
    ...state.dataset.certifications,
    ...state.dataset.resources,
  ].find((entity) => entity.id === id);
}

function labelFor(id) {
  const entity = findEntity(id);
  return entity?.label ?? entity?.title ?? id.replace(/^cad:/, "");
}

function labelsFor(ids) {
  return ids.map(labelFor);
}

function renderChipList(items) {
  return items.length ? items.map((item) => `<em>${escapeHtml(item)}</em>`).join("") : "<em>None</em>";
}

function uniqueEntities(items) {
  return [...new Map(items.map((item) => [item.id, item])).values()];
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
