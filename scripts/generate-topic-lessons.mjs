import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const dataPath = path.join(projectRoot, "data", "career_knowledge_graph.xml");
const xml = await readFile(dataPath, "utf8");

const skillRecords = readRecords(blockOf(xml, "skills"), "skill");
const courseRecords = readRecords(blockOf(xml, "courses"), "course");
const topicRecords = readRecords(blockOf(xml, "learningTopics"), "topic");

const topicToSkills = new Map();
const topicToCourses = new Map();
const skillById = new Map(skillRecords.map((skill) => [skill.attrs.id, skill]));

for (const skill of skillRecords) {
  for (const topicId of words(skill.attrs.learningTopic)) {
    appendMap(topicToSkills, topicId, skill);
  }
}

for (const course of courseRecords) {
  for (const topicId of words(course.attrs.coversTopic)) {
    appendMap(topicToCourses, topicId, course);
  }
}

const generatedTopics = topicRecords.map((topic, index) => {
  const courses = topicToCourses.get(topic.attrs.id) ?? [];
  const directSkills = topicToSkills.get(topic.attrs.id) ?? [];
  const courseSkills = courses
    .flatMap((course) => words(course.attrs.teachesSkill))
    .map((skillId) => skillById.get(skillId))
    .filter(Boolean);
  const skills = uniqueById([...directSkills, ...courseSkills]);
  const lesson = buildLesson(topic.attrs, skills, courses, index);
  return renderTopic(topic.attrs, lesson);
});

const replacement = `<learningTopics>\n${generatedTopics.join("\n")}\n  </learningTopics>`;
const nextXml = xml.replace(/<learningTopics>[\s\S]*?<\/learningTopics>/, replacement);

if (nextXml === xml) {
  throw new Error("Unable to replace the learningTopics block");
}

await writeFile(dataPath, nextXml, "utf8");
console.log(`Generated structured lessons for ${generatedTopics.length} topics.`);

function buildLesson(topic, skills, courses, index) {
  const label = topic.label;
  const reference = words(label).length > 2 ? "the topic" : label;
  const description = topic.description;
  const skillNames = skills.map((item) => item.attrs.label);
  const courseNames = courses.map((item) => item.attrs.label);
  const primarySkill = skillNames[0] ?? "professional practice";
  const primaryCourse = courseNames[0] ?? `${primarySkill} learning pathway`;
  const guide = chooseGuide(skillNames, label, courseNames);
  const variant = index % 4;

  const overview = [
    `${label} is part of ${primarySkill} because it turns a broad goal into a method learners can explain, apply, and review.`,
    `${description}`,
    `In this lesson, you will study the idea in the context of ${primaryCourse}, connect it to practical decisions, and learn how to judge whether an approach is producing trustworthy results.`,
    `The aim is to build a reusable mental model for later topics and project work.`,
  ].join(" ");

  const objectives = [
    `Explain ${label} in clear language and identify its main purpose.`,
    `Recognize the inputs, decisions, and outputs involved in a typical ${guide.process}.`,
    `Apply ${label} to a small ${guide.context} scenario using an ordered workflow.`,
    `Evaluate results with appropriate ${guide.evidence} instead of relying on appearance alone.`,
    `Identify common mistakes and communicate limitations to technical and non-technical audiences.`,
  ];

  const sections = [
    {
      title: `Understanding ${label}`,
      paragraphs: [
        `${label} should be understood as a way of reasoning, not only as a tool or definition. ${description} Begin by identifying the task, available information, and decision to support. In ${primarySkill}, these elements guide method selection. Without that context, it is easy to copy a familiar technique that does not fit. A strong explanation states what the concept does, its assumptions, and what a useful result looks like.`,
        `Vocabulary matters because similar words can describe different stages of work. Separate the ${guide.input} from the ${guide.output}, and distinguish the method from the evidence used to evaluate it. Ask who will use the result, what constraints apply, and what could make the result misleading. This framing turns ${reference} into a practical capability that another person can inspect, challenge, and repeat.`,
      ],
    },
    {
      title: `A practical ${label} workflow`,
      paragraphs: [
        `A useful workflow starts with a precise question. Write the intended outcome in one sentence, gather the minimum relevant ${guide.input}, and check whether it is complete enough for the task. Next, choose a simple method that matches the question and establish a baseline. Work in small steps so that each change has an observable effect. Record important choices, including settings, exclusions, transformations, or design decisions. This habit is valuable in ${primaryCourse} because it creates a traceable path from the original problem to the final ${guide.output}.`,
        `After producing an initial result, review it with ${guide.evidence}. Compare it with the baseline, inspect unusual cases, and test whether the result remains sensible when conditions change. If it fails, return to the earliest questionable assumption instead of adding complexity. ${variant === 0 ? "Simple approaches are easier to debug and explain." : variant === 1 ? "Small controlled experiments reveal more than simultaneous changes." : variant === 2 ? "Intermediate checks prevent errors from travelling through the workflow." : "Documented decisions make revision faster."} Summarize what worked, what remains uncertain, and what to investigate next.`,
      ],
    },
    {
      title: `Quality, limitations, and responsible use`,
      paragraphs: [
        `Good work with ${reference} is judged by fitness for purpose. A technically correct result may still be weak if it answers the wrong question, uses unrepresentative information, or cannot be maintained. Review correctness, clarity, efficiency, accessibility, security, and reproducibility. The balance depends on the domain, but the reasoning should be explicit. A faster ${guide.output} is not automatically better if it becomes harder to interpret or behaves unreliably in important cases.`,
        `A common mistake is ${guide.mistake}. Another is presenting a result without explaining when it may fail. Reduce these risks by checking edge cases, inviting review, and keeping evidence close to each claim. Separate observation from interpretation: state what the evidence shows, what you infer, and what you recommend. This helps others understand both the value and boundaries of ${reference}.`,
      ],
    },
  ];

  const workedExample = {
    title: `${label} in a small ${guide.context} task`,
    paragraphs: [
      `Imagine a student team working on ${guide.scenario}. The team first defines the goal: ${guide.goal}. They collect a small, representative set of ${guide.input}, note constraints, and choose a straightforward starting method. Before changing anything, they record a baseline using ${guide.evidence}. They then apply ${reference} one step at a time, documenting each decision and checking intermediate results. This prevents the team from confusing a later improvement with an unrelated change.`,
      `The first attempt reveals ${guide.issue}. The team inspects the affected cases and revises the relevant assumption. The second attempt improves the evidence while remaining understandable. The final report includes the method, comparison with the baseline, one limitation, and a next step. This shows that ${reference} works best when action, evaluation, and communication form one connected process.`,
    ],
  };

  const practice = {
    title: `Try ${label} yourself`,
    paragraphs: [
      `Choose a small example related to ${primarySkill}. Write the goal, identify the ${guide.input}, and describe the expected ${guide.output}. Create a baseline, then apply one ${reference} decision. Record why you made it and how you will evaluate it using ${guide.evidence}. Identify one edge case, one limitation, and one improvement to test next. Another learner should be able to follow and explain your reasoning.`,
    ],
  };

  const takeaways = [
    `${reference} connects a clearly defined goal to an explainable method.`,
    `Inputs, assumptions, and expected outputs should be stated before implementation.`,
    `A baseline and relevant evidence make improvement measurable.`,
    `Limitations and edge cases are part of a trustworthy result, not optional details.`,
  ];

  const wordsTotal = countLessonWords({
    overview,
    objectives,
    sections,
    workedExample,
    practice,
    takeaways,
  });
  const estimatedMinutes = Math.max(4, Math.ceil(wordsTotal / 170));

  if (wordsTotal < 600 || wordsTotal > 900) {
    throw new Error(`${label} generated ${wordsTotal} words; expected 600–900`);
  }

  return {
    overview,
    estimatedMinutes,
    wordCount: wordsTotal,
    objectives,
    sections,
    workedExample,
    practice,
    takeaways,
  };
}

function chooseGuide(skillNames, topicLabel, courseNames) {
  const haystack = `${skillNames.join(" ")} ${topicLabel} ${courseNames.join(" ")}`.toLowerCase();
  if (/(machine learning|deep learning|nlp|prompt|mlops|model|neural|tensorflow)/.test(haystack)) {
    return {
      process: "model-development process",
      context: "predictive system",
      input: "data and labels",
      output: "model behavior",
      evidence: "validation measures and error analysis",
      mistake: "optimizing a headline score while ignoring data quality, leakage, or important failure cases",
      scenario: "a model that supports a university service",
      goal: "produce a useful prediction while keeping errors visible and explainable",
      issue: "a group of cases where performance is noticeably weaker than the overall score suggests",
    };
  }
  if (/(statistics|sql|data science|data visualization|data engineering|business analytics|data modeling|database)/.test(haystack)) {
    return {
      process: "data-analysis workflow",
      context: "data investigation",
      input: "records, variables, and business definitions",
      output: "analysis or decision evidence",
      evidence: "data checks, comparisons, and interpretable measures",
      mistake: "drawing a confident conclusion from incomplete, duplicated, biased, or poorly defined data",
      scenario: "an analysis of student engagement and course activity",
      goal: "produce an accurate and understandable finding that supports a real decision",
      issue: "missing values and inconsistent definitions that distort the first summary",
    };
  }
  if (/(cyber|network|threat|linux|cloud|devops|security)/.test(haystack)) {
    return {
      process: "secure systems workflow",
      context: "technology risk",
      input: "assets, configurations, events, and threat information",
      output: "a controlled and observable system",
      evidence: "logs, tests, risk assessments, and recovery checks",
      mistake: "treating one control as complete protection without testing configuration, monitoring, or recovery",
      scenario: "a small online service that stores university information",
      goal: "reduce realistic risk while keeping the service usable and maintainable",
      issue: "an overlooked configuration that creates a path around the intended control",
    };
  }
  if (/(python|html|css|javascript|api|software|architecture|problem solving)/.test(haystack)) {
    return {
      process: "software-development workflow",
      context: "application feature",
      input: "requirements, user actions, and system constraints",
      output: "working and maintainable software",
      evidence: "tests, review feedback, and observable behavior",
      mistake: "implementing the visible happy path while ignoring errors, accessibility, or maintainability",
      scenario: "a feature in a student-facing web application",
      goal: "deliver predictable behavior that users can understand and developers can safely change",
      issue: "an edge case where the interface and underlying state no longer agree",
    };
  }
  if (/(ux|design|accessibility|wireframe|research)/.test(haystack)) {
    return {
      process: "user-centred design workflow",
      context: "digital experience",
      input: "user needs, tasks, constraints, and feedback",
      output: "an understandable interaction design",
      evidence: "usability observations, accessibility checks, and task outcomes",
      mistake: "assuming personal preference represents user needs without observing real tasks",
      scenario: "a redesigned course-selection experience",
      goal: "help students complete an important task with less confusion and fewer errors",
      issue: "a step that looks clear to the team but repeatedly confuses first-time users",
    };
  }
  return {
    process: "professional problem-solving workflow",
    context: "realistic project",
    input: "requirements, observations, and constraints",
    output: "a justified decision or deliverable",
    evidence: "checks, comparisons, and stakeholder feedback",
    mistake: "moving directly to a solution before defining the problem and success criteria",
    scenario: "a multidisciplinary university project",
    goal: "produce a defensible result that meets the stated need",
    issue: "a mismatch between the original requirement and the first proposed solution",
  };
}

function renderTopic(topic, lesson) {
  return `    <topic id="${escapeXml(topic.id)}" label="${escapeXml(topic.label)}" description="${escapeXml(topic.description)}">
      <lesson estimatedMinutes="${lesson.estimatedMinutes}" wordCount="${lesson.wordCount}">
        <overview>${escapeXml(lesson.overview)}</overview>
        <objectives>
${lesson.objectives.map((item) => `          <objective>${escapeXml(item)}</objective>`).join("\n")}
        </objectives>
        <sections>
${lesson.sections
  .map(
    (section) => `          <section title="${escapeXml(section.title)}">
${section.paragraphs.map((paragraph) => `            <paragraph>${escapeXml(paragraph)}</paragraph>`).join("\n")}
          </section>`,
  )
  .join("\n")}
        </sections>
        <workedExample title="${escapeXml(lesson.workedExample.title)}">
${lesson.workedExample.paragraphs.map((paragraph) => `          <paragraph>${escapeXml(paragraph)}</paragraph>`).join("\n")}
        </workedExample>
        <practice title="${escapeXml(lesson.practice.title)}">
${lesson.practice.paragraphs.map((paragraph) => `          <paragraph>${escapeXml(paragraph)}</paragraph>`).join("\n")}
        </practice>
        <takeaways>
${lesson.takeaways.map((item) => `          <takeaway>${escapeXml(item)}</takeaway>`).join("\n")}
        </takeaways>
      </lesson>
    </topic>`;
}

function countLessonWords(lesson) {
  const text = [
    lesson.overview,
    ...lesson.objectives,
    ...lesson.sections.flatMap((section) => section.paragraphs),
    ...lesson.workedExample.paragraphs,
    ...lesson.practice.paragraphs,
    ...lesson.takeaways,
  ].join(" ");
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function readRecords(block, tag) {
  const paired = [...block.matchAll(new RegExp(`<${tag}\\s+([^>]*?)(?<!/)>([\\s\\S]*?)<\\/${tag}>`, "g"))].map(
    (match) => ({ attrs: parseAttributes(match[1]), body: match[2] }),
  );
  const selfClosing = [...block.matchAll(new RegExp(`<${tag}\\s+([^>]*?)\\/>`, "g"))].map(
    (match) => ({ attrs: parseAttributes(match[1]), body: "" }),
  );
  return uniqueById([...paired, ...selfClosing]);
}

function parseAttributes(source) {
  const attrs = {};
  for (const match of source.matchAll(/([A-Za-z0-9_-]+)="([^"]*)"/g)) {
    attrs[match[1]] = decodeXml(match[2]);
  }
  return attrs;
}

function blockOf(source, tag) {
  return source.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1] ?? "";
}

function words(value = "") {
  return value.split(/\s+/).filter(Boolean);
}

function appendMap(map, key, value) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(value);
}

function uniqueById(records) {
  return [...new Map(records.map((record) => [record.attrs.id, record])).values()];
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function decodeXml(value) {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
