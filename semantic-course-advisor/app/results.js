import { evaluateProfile, loadDataset, searchKnowledgeGraph } from "../src/semanticGraph.js";

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
    url.searchParams.delete("course");
    url.searchParams.delete("skill");
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
  state.query = params.get("q") || "AI engineer Python machine learning";
  const career = params.get("career");
  const course = params.get("course");
  const skill = params.get("skill");
  const interests = csvParam(params.get("interests"));
  const skills = csvParam(params.get("skills"));
  if (career) state.profile.targetCareerId = career;
  state.detailCourseId = course || "";
  state.detailSkillId = skill || "";
  if (interests.length) state.profile.selectedInterests = interests;
  if (skills.length) state.profile.selectedSkills = skills;
}

function render() {
  const profile = evaluateProfile(state.dataset, state.profile);
  const results = searchKnowledgeGraph(state.dataset, profile, state.query);
  if (state.detailSkillId) {
    renderSkillDetail(profile, results);
    return;
  }

  if (state.detailCourseId) {
    renderCourseDetail(profile, results);
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
  const courseCard = event.target.closest("[data-course-id]");
  const skillCard = event.target.closest("[data-skill-id]");
  if (!courseCard && !skillCard) return;
  event.preventDefault();
  if (courseCard) {
    openCourseDetail(courseCard.dataset.courseId);
  } else {
    openSkillDetail(skillCard.dataset.skillId);
  }
}

function openCourseDetail(courseId) {
  state.detailCourseId = courseId;
  state.detailSkillId = "";
  const url = new URL(window.location.href);
  url.searchParams.set("course", courseId);
  url.searchParams.delete("skill");
  window.history.pushState({ courseId }, "", url.toString());
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openSkillDetail(skillId) {
  state.detailSkillId = skillId;
  state.detailCourseId = "";
  const url = new URL(window.location.href);
  url.searchParams.set("skill", skillId);
  url.searchParams.delete("course");
  window.history.pushState({ skillId }, "", url.toString());
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeCourseDetail() {
  state.detailCourseId = "";
  const url = new URL(window.location.href);
  url.searchParams.delete("course");
  window.history.pushState({}, "", url.toString());
  render();
}

function closeSkillDetail() {
  state.detailSkillId = "";
  const url = new URL(window.location.href);
  url.searchParams.delete("skill");
  window.history.pushState({}, "", url.toString());
  render();
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
      <button class="secondaryBack" type="button" id="backToResults">Back to search results</button>
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
                <article class="topicCard">
                  <span>${String(index + 1).padStart(2, "0")}</span>
                  <h3>${escapeHtml(topic.label)}</h3>
                  <p>${escapeHtml(topic.description || "Course topic linked through the coversTopic relationship.")}</p>
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
      <button class="secondaryBack" type="button" id="backToResults">Back to search results</button>
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
                <article class="topicCard">
                  <span>${String(index + 1).padStart(2, "0")}</span>
                  <h3>${escapeHtml(topic.label)}</h3>
                  <p>${escapeHtml(topic.description || "Skill topic linked through the hasLearningTopic relationship.")}</p>
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
