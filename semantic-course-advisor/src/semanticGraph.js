export const NS = {
  cad: "http://example.org/career#",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  owl: "http://www.w3.org/2002/07/owl#",
};

export const queryCatalog = [
  {
    id: "careerSearch",
    title: "Search careers",
    query: `PREFIX cad: <http://example.org/career#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?career ?title ?matchedEntity
WHERE {
  ?career a cad:Career ;
          cad:title ?title .
  {
    ?career cad:description ?matchedEntity .
  } UNION {
    ?career cad:requiresSkill ?skill .
    ?skill rdfs:label ?matchedEntity .
  } UNION {
    ?career cad:relatedToInterest ?interest .
    ?interest rdfs:label ?matchedEntity .
  } UNION {
    ?career cad:belongsToIndustry ?industry .
    ?industry rdfs:label ?matchedEntity .
  }
  FILTER (
    CONTAINS(LCASE(STR(?title)), "{{keyword}}") ||
    CONTAINS(LCASE(STR(?matchedEntity)), "{{keyword}}")
  )
}`,
  },
  {
    id: "recommendationSupport",
    title: "Recommendation evidence",
    query: `PREFIX cad: <http://example.org/career#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?career ?skill ?interest ?course ?certification ?resource
WHERE {
  ?career a cad:Career ;
          cad:requiresSkill ?skill ;
          cad:relatedToInterest ?interest ;
          cad:recommendedCourse ?course ;
          cad:recommendedCertification ?certification ;
          cad:hasLearningResource ?resource .
}`,
  },
  {
    id: "skillGap",
    title: "Skill gap facts",
    query: `PREFIX cad: <http://example.org/career#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?career ?requiredSkill ?prerequisiteSkill
WHERE {
  ?career a cad:Career ;
          cad:title ?careerTitle ;
          cad:requiresSkill ?requiredSkill .
  ?requiredSkill rdfs:label ?requiredSkillLabel .
  OPTIONAL {
    ?requiredSkill cad:prerequisiteSkill ?prerequisiteSkill .
    ?prerequisiteSkill rdfs:label ?prerequisiteSkillLabel .
  }
  FILTER (
    CONTAINS(LCASE(STR(?careerTitle)), "{{keyword}}") ||
    CONTAINS(LCASE(STR(?requiredSkillLabel)), "{{keyword}}") ||
    (BOUND(?prerequisiteSkillLabel) && CONTAINS(LCASE(STR(?prerequisiteSkillLabel)), "{{keyword}}"))
  )
}`,
  },
  {
    id: "classInstances",
    title: "Ontology class instances",
    query: `PREFIX cad: <http://example.org/career#>

SELECT ?class ?instance
WHERE {
  ?instance a ?class .
  FILTER (?class IN (cad:Career, cad:Skill, cad:Course, cad:Certification, cad:Industry, cad:Interest, cad:LearningResource))
}`,
  },
];

const CLASS_CONFIG = {
  skills: { tag: "skill", type: "Skill", idPrefix: "cad:" },
  interests: { tag: "interest", type: "Interest", idPrefix: "cad:" },
  industries: { tag: "industry", type: "Industry", idPrefix: "cad:" },
  courses: { tag: "course", type: "Course", idPrefix: "cad:" },
  certifications: { tag: "certification", type: "Certification", idPrefix: "cad:" },
  learningResources: { tag: "resource", type: "LearningResource", idPrefix: "cad:" },
};

export function loadDataset(xmlText) {
  const dataset = parseCareerKnowledgeGraphXml(xmlText);
  const triples = buildTriples(dataset);
  const inferredTriples = inferStaticTriples(dataset);
  return {
    ...dataset,
    triples,
    inferredTriples,
    allTriples: [...triples, ...inferredTriples],
  };
}

export function parseCareerKnowledgeGraphXml(xmlText) {
  const collections = {};

  for (const [collectionName, config] of Object.entries(CLASS_CONFIG)) {
    const block = between(xmlText, `<${collectionName}>`, `</${collectionName}>`);
    const paired = [...block.matchAll(new RegExp(`<${config.tag}\\s+([^>/]*?)>([\\s\\S]*?)<\\/${config.tag}>`, "g"))].map((match) =>
      parseSimpleEntity(match[1], match[2], config.type),
    );
    const selfClosing = [...block.matchAll(new RegExp(`<${config.tag}\\s+([^>]*?)\\/>`, "g"))].map((match) =>
      parseSimpleEntity(match[1], "", config.type),
    );
    collections[collectionName] = uniqueBy([...paired, ...selfClosing], "id");
  }

  const careersBlock = between(xmlText, "<careers>", "</careers>");
  const careers = [...careersBlock.matchAll(/<career\s+([^>]*)>([\s\S]*?)<\/career>/g)].map((match) => {
    const attrs = parseAttributes(match[1]);
    const body = match[2];
    return {
      id: idFor(attrs.id),
      rawId: attrs.id,
      type: "Career",
      title: textOf(body, "title"),
      label: textOf(body, "title"),
      description: textOf(body, "description"),
      requiresSkills: listOf(body, "requiresSkill").map(idFor),
      relatedInterests: listOf(body, "relatedToInterest").map(idFor),
      industries: listOf(body, "belongsToIndustry").map(idFor),
      recommendedCourses: listOf(body, "recommendedCourse").map(idFor),
      recommendedCertifications: listOf(body, "recommendedCertification").map(idFor),
      learningResources: listOf(body, "hasLearningResource").map(idFor),
      alternativeCareers: listOf(body, "alternativeCareer").map(idFor),
    };
  });

  return {
    careers,
    skills: collections.skills,
    interests: collections.interests,
    industries: collections.industries,
    courses: collections.courses,
    certifications: collections.certifications,
    resources: collections.learningResources,
  };
}

function parseSimpleEntity(attrSource, body, type) {
  const attrs = parseAttributes(attrSource);
  return {
    id: idFor(attrs.id),
    rawId: attrs.id,
    label: attrs.label ?? attrs.id,
    type,
    teachesSkills: attrList(attrs.teachesSkill).map(idFor),
    prerequisiteSkills: listOf(body, "prerequisiteSkill").map(idFor),
  };
}

export function buildTriples(dataset) {
  const triples = [];

  for (const className of ["Career", "Skill", "Course", "Certification", "Industry", "Interest", "LearningResource"]) {
    triples.push(uriTriple(`cad:${className}`, "rdf:type", "owl:Class"));
  }

  const objectProperties = [
    ["requiresSkill", "Career", "Skill"],
    ["relatedToInterest", "Career", "Interest"],
    ["belongsToIndustry", "Career", "Industry"],
    ["recommendedCourse", "Career", "Course"],
    ["recommendedCertification", "Career", "Certification"],
    ["hasLearningResource", "Career", "LearningResource"],
    ["prerequisiteSkill", "Skill", "Skill"],
    ["alternativeCareer", "Career", "Career"],
  ];

  for (const [property, domain, range] of objectProperties) {
    triples.push(uriTriple(`cad:${property}`, "rdf:type", property === "alternativeCareer" ? "owl:SymmetricProperty" : "owl:ObjectProperty"));
    triples.push(uriTriple(`cad:${property}`, "rdfs:domain", `cad:${domain}`));
    triples.push(uriTriple(`cad:${property}`, "rdfs:range", `cad:${range}`));
  }

  for (const entity of [
    ...dataset.skills,
    ...dataset.interests,
    ...dataset.industries,
    ...dataset.courses,
    ...dataset.certifications,
    ...dataset.resources,
  ]) {
    triples.push(uriTriple(entity.id, "rdf:type", `cad:${entity.type}`));
    triples.push(literalTriple(entity.id, "rdfs:label", entity.label));
    for (const skill of entity.teachesSkills ?? []) {
      triples.push(uriTriple(entity.id, "cad:teachesSkill", skill));
    }
    for (const prerequisite of entity.prerequisiteSkills ?? []) {
      triples.push(uriTriple(entity.id, "cad:prerequisiteSkill", prerequisite));
    }
  }

  for (const career of dataset.careers) {
    triples.push(uriTriple(career.id, "rdf:type", "cad:Career"));
    triples.push(literalTriple(career.id, "cad:title", career.title));
    triples.push(literalTriple(career.id, "cad:description", career.description));
    for (const skill of career.requiresSkills) triples.push(uriTriple(career.id, "cad:requiresSkill", skill));
    for (const interest of career.relatedInterests) triples.push(uriTriple(career.id, "cad:relatedToInterest", interest));
    for (const industry of career.industries) triples.push(uriTriple(career.id, "cad:belongsToIndustry", industry));
    for (const course of career.recommendedCourses) triples.push(uriTriple(career.id, "cad:recommendedCourse", course));
    for (const certification of career.recommendedCertifications) triples.push(uriTriple(career.id, "cad:recommendedCertification", certification));
    for (const resource of career.learningResources) triples.push(uriTriple(career.id, "cad:hasLearningResource", resource));
    for (const alternative of career.alternativeCareers) triples.push(uriTriple(career.id, "cad:alternativeCareer", alternative));
  }

  return dedupeTriples(triples);
}

export function inferStaticTriples(dataset) {
  const inferred = [];

  for (const career of dataset.careers) {
    for (const alternative of career.alternativeCareers) {
      inferred.push(uriTriple(alternative, "cad:alternativeCareer", career.id, "OWL symmetric property"));
    }

    for (const skill of career.requiresSkills) {
      inferred.push(uriTriple(skill, "cad:isRequiredBy", career.id, "inverse requiresSkill rule"));
      for (const prerequisite of prerequisiteClosure(dataset, skill)) {
        inferred.push(uriTriple(career.id, "cad:hasPrerequisiteSkill", prerequisite, "recursive prerequisite rule"));
      }
    }
  }

  return dedupeTriples(inferred);
}

export function evaluateProfile(dataset, profile) {
  const targetCareer = dataset.careers.find((career) => career.id === profile.targetCareerId) ?? dataset.careers[0];
  const selectedInterests = new Set(profile.selectedInterests ?? []);
  const selectedSkills = new Set(profile.selectedSkills ?? []);

  const missingSkills = targetCareer.requiresSkills.filter((skill) => !selectedSkills.has(skill));
  const matchedTargetSkills = targetCareer.requiresSkills.filter((skill) => selectedSkills.has(skill));
  const profileTriples = [];

  for (const career of dataset.careers) {
    const matchedInterests = career.relatedInterests.filter((interest) => selectedInterests.has(interest));
    const matchedSkills = career.requiresSkills.filter((skill) => selectedSkills.has(skill));
    if (matchedInterests.length || matchedSkills.length) {
      profileTriples.push(uriTriple("cad:CurrentUserProfile", "cad:recommendedCareer", career.id, "interest-skill recommendation rule"));
    }
  }

  const recommendations = dataset.careers
    .map((career) => buildCareerRecommendation(dataset, career, selectedInterests, selectedSkills))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.career.title.localeCompare(b.career.title));

  return {
    targetCareer,
    selectedInterests: [...selectedInterests],
    selectedSkills: [...selectedSkills],
    knownSkills: [...matchedTargetSkills],
    missingSkills,
    recommendations,
    profileTriples,
  };
}

export function searchKnowledgeGraph(dataset, profileResult, query) {
  const baseTokens = baseQueryTokens(query || profileResult.targetCareer.title);
  const tokens = expandQueryTokens(baseTokens);
  const focusedCareer = findFocusedCareer(dataset, baseTokens);
  const recommendationByCareer = new Map(profileResult.recommendations.map((item) => [item.career.id, item]));
  const results = [];

  for (const career of dataset.careers) {
    if (focusedCareer && career.id !== focusedCareer.id) continue;
    const recommendation = recommendationByCareer.get(career.id);
    const text = [
      career.title,
      career.description,
      "career entity",
      ...labelsFor(dataset, career.requiresSkills),
      ...labelsFor(dataset, career.relatedInterests),
      ...labelsFor(dataset, career.industries),
      ...labelsFor(dataset, career.recommendedCourses),
      ...labelsFor(dataset, career.recommendedCertifications),
      ...labelsFor(dataset, career.learningResources),
    ].join(" ");
    const lexical = scoreText(text, tokens);
    const titleScore = scoreCareerTitle(career.title, baseTokens) * 18;
    const recommendationBoost = focusedCareer ? 0 : Math.min(recommendation?.score ?? 0, 6);
    const score = lexical + titleScore + recommendationBoost;
    if (score > 0 || focusedCareer) {
      results.push({
        id: career.id,
        type: "Career Entity",
        title: career.title,
        subtitle: `${career.requiresSkills.length} required skills - ${career.relatedInterests.length} interests - ${career.industries.length} industries`,
        description: career.description,
        score,
        matchedTerms: matchingTerms(text, tokens),
        relationships: compact([
          `requires ${labelsFor(dataset, career.requiresSkills).join(", ")}`,
          `interests: ${labelsFor(dataset, career.relatedInterests).join(", ")}`,
          `industries: ${labelsFor(dataset, career.industries).join(", ")}`,
          recommendation ? `matched evidence: ${recommendation.reasons.join("; ")}` : "",
        ]),
        explanation:
          "Retrieved as a career entity through semantic querying over titles, descriptions, skills, interests and industries.",
      });
    }
  }

  for (const skill of dataset.skills) {
    const requiredBy = dataset.careers.filter((career) => career.requiresSkills.includes(skill.id));
    if (focusedCareer && !focusedCareer.requiresSkills.includes(skill.id)) continue;
    const text = [skill.label, "skill entity", ...requiredBy.map((career) => career.title)].join(" ");
    const focusBoost = focusedCareer ? 10 : 0;
    const gapBoost = !focusedCareer && profileResult.missingSkills.includes(skill.id) ? 8 : 0;
    const score = scoreText(text, tokens) + focusBoost + gapBoost;
    if (score > 0 || focusedCareer) {
      results.push({
        id: skill.id,
        type: "Skill Entity",
        title: skill.label,
        subtitle: `Required by ${requiredBy.length} career${requiredBy.length === 1 ? "" : "s"}`,
        description: "A skill node links user abilities to career requirements and prerequisite chains.",
        score,
        matchedTerms: matchingTerms(text, tokens),
        relationships: compact([
          requiredBy.length ? `required by ${requiredBy.map((career) => career.title).join(", ")}` : "",
          skill.prerequisiteSkills.length ? `prerequisites: ${labelsFor(dataset, skill.prerequisiteSkills).join(", ")}` : "no prerequisite skill",
          profileResult.missingSkills.includes(skill.id) ? "missing for selected target career" : "",
        ]),
        explanation: "Retrieved as a skill entity by linking career requirements and prerequisiteSkill relationships.",
      });
    }
  }

  for (const course of dataset.courses) {
    const taughtSkills = course.teachesSkills ?? [];
    const relevantCareers = dataset.careers.filter((career) => career.recommendedCourses.includes(course.id));
    if (focusedCareer && !focusedCareer.recommendedCourses.includes(course.id)) continue;
    const text = [course.label, "course entity", ...labelsFor(dataset, taughtSkills), ...relevantCareers.map((career) => career.title)].join(" ");
    const focusBoost = focusedCareer ? 8 : 0;
    const targetBoost = !focusedCareer ? relevantCareers.filter((career) => career.id === profileResult.targetCareer.id).length * 6 : 0;
    const score = scoreText(text, tokens) + focusBoost + targetBoost;
    if (score > 0 || focusedCareer) {
      results.push({
        id: course.id,
        type: "Course Entity",
        title: course.label,
        subtitle: `Recommended for ${relevantCareers.length} career${relevantCareers.length === 1 ? "" : "s"}`,
        description: "A learning course connected to careers and the skills it teaches.",
        score,
        matchedTerms: matchingTerms(text, tokens),
        relationships: compact([
          taughtSkills.length ? `teaches ${labelsFor(dataset, taughtSkills).join(", ")}` : "",
          relevantCareers.length ? `recommended for ${relevantCareers.map((career) => career.title).join(", ")}` : "",
        ]),
        explanation: "Retrieved as a course entity through recommendedCourse and teachesSkill graph links.",
      });
    }
  }

  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, focusedCareer ? 10 : 15);
}

export function runQuery(queryId, dataset, profileResult, keyword = "") {
  if (queryId === "careerSearch") {
    return filterRowsByKeyword(dataset.careers.flatMap((career) => [
      ...career.requiresSkills.map((skill) => ({ career: career.title, title: career.title, matchedEntity: labelFor(dataset, skill) })),
      ...career.relatedInterests.map((interest) => ({ career: career.title, title: career.title, matchedEntity: labelFor(dataset, interest) })),
      ...career.industries.map((industry) => ({ career: career.title, title: career.title, matchedEntity: labelFor(dataset, industry) })),
    ]), keyword);
  }

  if (queryId === "recommendationSupport") {
    return filterRowsByKeyword(profileResult.recommendations.slice(0, 8).map((item) => ({
      career: item.career.title,
      matchedInterests: labelsFor(dataset, item.matchedInterests).join(", ") || "-",
      matchedSkills: labelsFor(dataset, item.matchedSkills).join(", ") || "-",
      missingSkills: labelsFor(dataset, item.missingSkills).join(", "),
      score: item.score,
    })), keyword);
  }

  if (queryId === "skillGap") {
    return filterRowsByKeyword(dataset.careers.flatMap((career) =>
      career.requiresSkills.map((skill) => ({
        career: career.title,
        requiredSkill: labelFor(dataset, skill),
        prerequisiteSkill: labelsFor(dataset, prerequisiteClosure(dataset, skill)).join(", ") || "-",
        status: profileResult.selectedSkills.includes(skill) ? "Matched" : "Missing",
      })),
    ), keyword);
  }

  if (queryId === "classInstances") {
    return filterRowsByKeyword([
      ...dataset.careers.map((item) => ({ class: "Career", instance: item.title })),
      ...dataset.skills.map((item) => ({ class: "Skill", instance: item.label })),
      ...dataset.courses.map((item) => ({ class: "Course", instance: item.label })),
      ...dataset.certifications.map((item) => ({ class: "Certification", instance: item.label })),
      ...dataset.industries.map((item) => ({ class: "Industry", instance: item.label })),
      ...dataset.interests.map((item) => ({ class: "Interest", instance: item.label })),
      ...dataset.resources.map((item) => ({ class: "LearningResource", instance: item.label })),
    ], keyword);
  }

  return [];
}

function filterRowsByKeyword(rows, keyword) {
  const normalizedKeyword = String(keyword ?? "").trim().toLowerCase();
  if (!normalizedKeyword) return rows;
  const terms = normalizedKeyword.split(/[^a-z0-9]+/).filter(Boolean);
  return rows.filter((row) => {
    const haystack = Object.values(row).join(" ").toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export function graphForCareer(dataset, profileResult) {
  const career = profileResult.targetCareer;
  const nodes = [{ id: career.id, label: career.title, type: "career" }];
  const edges = [];

  for (const skill of career.requiresSkills) {
    nodes.push({ id: skill, label: labelFor(dataset, skill), type: "skill" });
    edges.push({ from: career.id, to: skill, label: "requires" });
  }
  for (const interest of career.relatedInterests) {
    nodes.push({ id: interest, label: labelFor(dataset, interest), type: "interest" });
    edges.push({ from: career.id, to: interest, label: "interest" });
  }
  for (const course of career.recommendedCourses) {
    nodes.push({ id: course, label: labelFor(dataset, course), type: "course" });
    edges.push({ from: career.id, to: course, label: "course" });
  }
  for (const alternative of career.alternativeCareers) {
    nodes.push({ id: alternative, label: labelFor(dataset, alternative), type: "alternative" });
    edges.push({ from: career.id, to: alternative, label: "alternative" });
  }

  return {
    nodes: uniqueBy(nodes, "id"),
    edges,
  };
}

export function countEntities(dataset) {
  return (
    dataset.careers.length +
    dataset.skills.length +
    dataset.courses.length +
    dataset.certifications.length +
    dataset.industries.length +
    dataset.interests.length +
    dataset.resources.length
  );
}

export function shortTerm(value) {
  return String(value).replace(/^cad:/, "");
}

export function humanize(value) {
  return labelText(shortTerm(value));
}

export function idFor(value) {
  return `cad:${String(value).trim().replace(/[^A-Za-z0-9_]/g, "")}`;
}

export function skillId(value) {
  return idFor(value);
}

function buildCareerRecommendation(dataset, career, selectedInterests, selectedSkills) {
  const matchedInterests = career.relatedInterests.filter((interest) => selectedInterests.has(interest));
  const matchedSkills = career.requiresSkills.filter((skill) => selectedSkills.has(skill));
  const missingSkills = career.requiresSkills.filter((skill) => !selectedSkills.has(skill));
  const prerequisiteExpansions = uniqueBy(
    missingSkills.flatMap((skill) => prerequisiteClosure(dataset, skill).map((pre) => ({ id: pre }))),
    "id",
  ).map((item) => item.id);
  const score = matchedInterests.length * 3 + matchedSkills.length * 2;
  const reasons = compact([
    matchedInterests.length ? `matched interests: ${labelsFor(dataset, matchedInterests).join(", ")}` : "",
    matchedSkills.length ? `matched skills: ${labelsFor(dataset, matchedSkills).join(", ")}` : "",
    missingSkills.length ? `missing skills: ${labelsFor(dataset, missingSkills).join(", ")}` : "",
    prerequisiteExpansions.length ? `prerequisite expansion: ${labelsFor(dataset, prerequisiteExpansions).join(", ")}` : "",
  ]);

  return {
    career,
    score,
    matchedInterests,
    matchedSkills,
    missingSkills,
    prerequisiteExpansions,
    courses: career.recommendedCourses,
    certifications: career.recommendedCertifications,
    resources: career.learningResources,
    alternatives: career.alternativeCareers,
    reasons,
  };
}

function prerequisiteClosure(dataset, skillIdValue, seen = new Set()) {
  const skill = dataset.skills.find((item) => item.id === skillIdValue);
  if (!skill) return [];
  const results = [];
  for (const prerequisite of skill.prerequisiteSkills) {
    if (seen.has(prerequisite)) continue;
    seen.add(prerequisite);
    results.push(prerequisite, ...prerequisiteClosure(dataset, prerequisite, seen));
  }
  return [...new Set(results)];
}

function uriTriple(subject, predicate, object, source = "asserted") {
  return { subject, predicate, object, objectType: "uri", source };
}

function literalTriple(subject, predicate, object, source = "asserted") {
  return { subject, predicate, object: String(object), objectType: "literal", source };
}

function dedupeTriples(triples) {
  const seen = new Set();
  return triples.filter((triple) => {
    const key = `${triple.subject}|${triple.predicate}|${triple.object}|${triple.objectType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseAttributes(source) {
  const attrs = {};
  for (const match of source.matchAll(/([A-Za-z0-9_-]+)="([^"]*)"/g)) {
    attrs[match[1]] = decodeXml(match[2]);
  }
  return attrs;
}

function attrList(value) {
  return value ? value.split(/\s+/).filter(Boolean) : [];
}

function between(source, start, end) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) return "";
  return source.slice(startIndex + start.length, endIndex);
}

function textOf(source, tag) {
  const match = source.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? decodeXml(match[1].trim()) : "";
}

function listOf(source, tag) {
  return [...source.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "g"))].map((match) =>
    decodeXml(match[1].trim()),
  );
}

function decodeXml(value) {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function labelsFor(dataset, ids) {
  return ids.map((id) => labelFor(dataset, id));
}

function labelFor(dataset, id) {
  return findEntity(dataset, id)?.label ?? findEntity(dataset, id)?.title ?? shortTerm(id);
}

function findEntity(dataset, id) {
  return [
    ...dataset.careers,
    ...dataset.skills,
    ...dataset.interests,
    ...dataset.industries,
    ...dataset.courses,
    ...dataset.certifications,
    ...dataset.resources,
  ].find((entity) => entity.id === id);
}

function labelText(value) {
  return String(value).replace(/([a-z])([A-Z])/g, "$1 $2");
}

const STOP_WORDS = new Set(["a", "an", "and", "for", "in", "of", "the", "to", "with"]);

function tokenize(value) {
  return expandQueryTokens(baseQueryTokens(value));
}

function baseQueryTokens(value) {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function expandQueryTokens(baseTokens) {
  const expanded = new Set(baseTokens);

  for (const token of baseTokens) {
    const synonyms = QUERY_SYNONYMS[token] ?? [];
    for (const synonym of synonyms) expanded.add(synonym);
  }

  return [...expanded];
}

function findFocusedCareer(dataset, queryTokens) {
  if (queryTokens.length < 2) return null;

  const ranked = dataset.careers
    .map((career) => {
      const titleTokens = baseQueryTokens(career.title);
      const matchedTitleTokens = scoreCareerTitle(career.title, queryTokens);
      const orderedTitleTokens = scoreCareerTitleInOrder(career.title, queryTokens);
      const fullOrderedTitleMatch = orderedTitleTokens === titleTokens.length;
      return { career, matchedTitleTokens, titleTokenCount: titleTokens.length, fullOrderedTitleMatch };
    })
    .sort(
      (a, b) =>
        Number(b.fullOrderedTitleMatch) - Number(a.fullOrderedTitleMatch) ||
        b.matchedTitleTokens - a.matchedTitleTokens ||
        a.career.title.localeCompare(b.career.title),
    );

  const best = ranked[0];
  const second = ranked[1];
  if (!best) return null;

  const minimumTitleMatches = Math.min(2, best.titleTokenCount);
  const hasStrongMatch = best.fullOrderedTitleMatch || best.matchedTitleTokens >= minimumTitleMatches;
  const isClearWinner = !second || best.matchedTitleTokens > second.matchedTitleTokens || best.matchedTitleTokens === best.titleTokenCount;
  return hasStrongMatch && (best.fullOrderedTitleMatch || isClearWinner) ? best.career : null;
}

function scoreCareerTitle(title, queryTokens) {
  const titleTokens = baseQueryTokens(title);
  return titleTokens.filter((titleToken) =>
    queryTokens.some((queryToken) => titleTokenMatchesQuery(titleToken, queryToken)),
  ).length;
}

function scoreCareerTitleInOrder(title, queryTokens) {
  const titleTokens = baseQueryTokens(title);
  let queryIndex = 0;
  let matched = 0;

  for (const titleToken of titleTokens) {
    while (queryIndex < queryTokens.length) {
      const queryToken = queryTokens[queryIndex];
      queryIndex += 1;
      if (titleTokenMatchesQuery(titleToken, queryToken)) {
        matched += 1;
        break;
      }
    }
  }

  return matched;
}

function titleTokenMatchesQuery(titleToken, queryToken) {
  if (tokenMatches(queryToken, titleToken)) return true;
  if (queryToken === "ai") return titleToken === "artificial" || titleToken === "intelligence";
  return (QUERY_SYNONYMS[queryToken] ?? []).some((synonym) => tokenMatches(synonym, titleToken));
}

const QUERY_SYNONYMS = {
  ai: ["artificial", "intelligence", "machine", "learning"],
  ml: ["machine", "learning"],
  engineer: ["engineering", "software", "cloud", "machine"],
  search: ["retrieval", "query"],
  engine: ["search", "retrieval"],
  semantic: ["rdf", "sparql", "ontology", "knowledge"],
  graph: ["knowledge", "rdf"],
  kg: ["knowledge", "graph"],
  cyber: ["cybersecurity", "security"],
  bi: ["business", "intelligence"],
};

function scoreText(text, tokens) {
  const haystackTokens = baseQueryTokens(text);
  return tokens.reduce((score, token) => {
    const exact = haystackTokens.includes(token);
    const fuzzy = !exact && haystackTokens.some((haystackToken) => tokenMatches(token, haystackToken));
    if (!exact && !fuzzy) return score;
    return score + (exact ? 6 : 3);
  }, 0);
}

function matchingTerms(text, tokens) {
  const haystackTokens = baseQueryTokens(text);
  return [...new Set(tokens.filter((token) => haystackTokens.some((haystackToken) => tokenMatches(token, haystackToken))))];
}

function tokenMatches(left, right) {
  if (left === right) return true;
  if (Math.min(left.length, right.length) <= 2) return false;
  if (Math.abs(left.length - right.length) > 1) return false;
  return editDistanceAtMostOne(left, right);
}

function editDistanceAtMostOne(left, right) {
  let i = 0;
  let j = 0;
  let edits = 0;

  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      i += 1;
      j += 1;
      continue;
    }

    edits += 1;
    if (edits > 1) return false;

    if (left.length > right.length) {
      i += 1;
    } else if (right.length > left.length) {
      j += 1;
    } else {
      i += 1;
      j += 1;
    }
  }

  return edits + (left.length - i) + (right.length - j) <= 1;
}

function compact(items) {
  return items.filter(Boolean);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uniqueBy(items, key) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item[key])) return false;
    seen.add(item[key]);
    return true;
  });
}
