import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateProfile, loadDataset, runQuery, searchKnowledgeGraph } from "../src/semanticGraph.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const xml = await readFile(path.join(root, "data", "career_knowledge_graph.xml"), "utf8");
const dataset = loadDataset(xml);

assert(dataset.careers.length === 10, "expected 10 careers");
assert(dataset.skills.length === 29, "expected 29 skills");
assert(dataset.courses.length === 10, "expected 10 courses");
assert(dataset.topics.length === 146, "expected 146 learning topics");
assert(dataset.skills.every((skill) => skill.learningTopics.length > 0), "expected every skill to have learning topics");
assert(
  dataset.topics.every(
    (topic) =>
      topic.overview &&
      topic.estimatedMinutes > 0 &&
      topic.lessonWordCount >= 600 &&
      topic.lessonWordCount <= 900 &&
      topic.objectives.length >= 4 &&
      topic.objectives.length <= 6 &&
      topic.sections.length >= 3 &&
      topic.sections.length <= 4 &&
      topic.workedExample.paragraphs.length > 0 &&
      topic.practice.paragraphs.length > 0 &&
      topic.takeaways.length >= 4 &&
      topic.takeaways.length <= 6,
  ),
  "expected every learning topic to have a complete 600-900 word lesson",
);
const topicIds = new Set(dataset.topics.map((topic) => topic.id));
assert(
  dataset.courses.every((course) => course.coversTopics.every((topicId) => topicIds.has(topicId))),
  "expected every course topic relationship to resolve",
);
assert(
  dataset.skills.every((skill) => skill.learningTopics.every((topicId) => topicIds.has(topicId))),
  "expected every skill topic relationship to resolve",
);
assert(dataset.certifications.length === 9, "expected 9 certifications");
assert(dataset.industries.length === 6, "expected 6 industries");
assert(dataset.interests.length === 9, "expected 9 interests");
assert(dataset.resources.length === 11, "expected 11 learning resources");
assert(dataset.triples.length >= 250, "expected at least 250 asserted triples");
assert(
  dataset.inferredTriples.some((triple) => triple.predicate === "cad:alternativeCareer"),
  "expected symmetric alternative career inference",
);
assert(
  dataset.inferredTriples.some((triple) => triple.predicate === "cad:hasPrerequisiteSkill"),
  "expected recursive prerequisite inference",
);

const profile = evaluateProfile(dataset, {
  targetCareerId: "cad:AIEngineer",
  selectedInterests: ["cad:ArtificialIntelligence", "cad:DataAnalytics"],
  selectedSkills: ["cad:Python", "cad:MachineLearning"],
});

assert(profile.missingSkills.includes("cad:DeepLearning"), "expected Deep Learning to be missing for AI Engineer");
assert(profile.recommendations[0].career.id === "cad:DataScientist" || profile.recommendations[0].career.id === "cad:AIEngineer", "expected a data or AI career as top recommendation");
assert(profile.profileTriples.some((triple) => triple.object === "cad:AIEngineer"), "expected AI Engineer profile recommendation inference");

const rows = runQuery("careerSearch", dataset, profile);
assert(rows.length >= 30, "expected career search query rows");

const recommendationRows = runQuery("recommendationSupport", dataset, profile);
assert(recommendationRows.length > 0, "expected recommendation evidence query rows");

const courseTopicRows = runQuery("courseTopics", dataset, profile, "Logistic Regression");
assert(courseTopicRows.length === 1, "expected Logistic Regression course topic row");

const skillTopicRows = runQuery("skillTopics", dataset, profile, "Logistic Regression");
assert(skillTopicRows.length === 1, "expected Logistic Regression skill topic row");

const mlCourse = dataset.courses.find((course) => course.id === "cad:MachineLearningFoundations");
assert(mlCourse?.coversTopics.includes("cad:LogisticRegression"), "expected Machine Learning course to cover Logistic Regression");
assert(mlCourse?.coversTopics.includes("cad:SupervisedLearning"), "expected Machine Learning course to cover Supervised Learning");
assert(mlCourse?.coversTopics.includes("cad:UnsupervisedLearning"), "expected Machine Learning course to cover Unsupervised Learning");

const mlSkill = dataset.skills.find((skill) => skill.id === "cad:MachineLearning");
assert(mlSkill?.learningTopics.includes("cad:LogisticRegression"), "expected Machine Learning skill to include Logistic Regression");
assert(mlSkill?.learningTopics.includes("cad:SupervisedLearning"), "expected Machine Learning skill to include Supervised Learning");
assert(mlSkill?.learningTopics.includes("cad:UnsupervisedLearning"), "expected Machine Learning skill to include Unsupervised Learning");

const searchResults = searchKnowledgeGraph(dataset, profile, "AI engineer Python machine learning");
assert(searchResults.length >= 5, "expected semantic search results");
assert(searchResults[0].title.includes("AI Engineer"), "expected AI Engineer as top semantic search result");
assert(
  searchResults.some((result) => result.type === "Skill Entity" && result.topicIds?.length),
  "expected skill search results to expose learning topics",
);
assert(
  searchResults.some((result) => result.type === "Course Entity" && result.topicIds?.length),
  "expected course search results to expose learning topics",
);

const typoSearchResults = searchKnowledgeGraph(dataset, profile, "ai enginer");
assert(typoSearchResults[0].title === "AI Engineer", "expected typo search to focus on AI Engineer");
assert(
  typoSearchResults
    .filter((result) => result.type === "Career Entity")
    .every((result) => result.title === "AI Engineer"),
  "expected typo search to exclude unrelated career entities",
);

console.log("Smoke test passed");
console.log(`Careers: ${dataset.careers.length}`);
console.log(`Skills: ${dataset.skills.length}`);
console.log(`Courses: ${dataset.courses.length}`);
console.log(`Learning topics: ${dataset.topics.length}`);
console.log(`Certifications: ${dataset.certifications.length}`);
console.log(`Industries: ${dataset.industries.length}`);
console.log(`Interests: ${dataset.interests.length}`);
console.log(`Learning resources: ${dataset.resources.length}`);
console.log(`Asserted triples: ${dataset.triples.length}`);
console.log(`Inferred triples: ${dataset.inferredTriples.length}`);
console.log(`Top recommendation: ${profile.recommendations[0].career.title}`);
console.log(`Top search result: ${searchResults[0].title}`);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
