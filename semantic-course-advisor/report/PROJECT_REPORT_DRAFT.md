# TSW6223 Semantic Web Technology Project Report

**Term:** 2610  
**Title:** Explainable Semantic Search Engine for Career Path Recommendation Using Knowledge Graphs  
**Group ID:** GroupXX  
**Selected Topics:** Category 2 RDF/RDFS/SPARQL; Category 3 OWL and inference

## Members

| No. | Name / ID | Contributions in the project | Write-up section |
| --- | --- | --- | --- |
| 1 | Student Name / ID | Project coordination, ontology design, report editing | Sections 1, 2, 6 |
| 2 | Student Name / ID | RDF graph design, XML dataset, SPARQL queries | Sections 3.1, 3.2 |
| 3 | Student Name / ID | Application development and testing | Sections 3.3, 4 |
| 4 | Student Name / ID | Presentation, evaluation, references | Sections 4, 5, 7 |

## 1. Introduction

Semantic Web Technology improves data interoperability by representing information in machine-readable structures. Instead of storing information only as isolated text or application-specific records, Semantic Web standards such as RDF, RDFS, OWL and SPARQL allow resources to be connected through explicit relationships. This project applies these technologies to career path recommendation and semantic search.

The proposed application, **Explainable Semantic Search Engine**, models careers, skills, interests, industries, courses, certifications and learning resources as a knowledge graph. A user enters a search query and selects profile context such as interests, existing skills and a target career. The system returns career, skill and course entities with relationship-aware explanations. The application demonstrates how RDF triples, SPARQL-style querying, OWL properties and inference can support semantic querying, relationship-aware information retrieval and entity-based search.

## 2. Problem Statement and Objectives

Students and early-career learners often need guidance that connects interests, existing skills, missing skills and realistic learning steps. A keyword-based search can find career information, but it cannot reliably explain relationships such as "this career requires these skills", "this course supports this career", or "this missing skill has prerequisite skills." This creates a gap between information retrieval and actionable career planning.

The objectives are:

1. To design a Semantic Web knowledge graph for careers, skills, interests, industries, courses, certifications and learning resources.
2. To represent structured career data using XML and RDF-style triples.
3. To define an ontology using OWL/RDFS concepts such as classes, object properties, domains, ranges and a symmetric alternative-career relationship.
4. To support SPARQL-style queries over the knowledge graph.
5. To apply inference rules that generate explainable career recommendations, skill gaps, prerequisite expansion and alternative career suggestions.

## 3. Solution Development

### 3.1 Semantic Web Technologies Used

**RDF/RDFS.** Career data is represented as subject-predicate-object triples. For example, `cad:AIEngineer cad:requiresSkill cad:Python` states that the AI Engineer career requires Python. RDFS labels make career, skill, course, certification, industry, interest and learning resource nodes understandable.

**SPARQL.** The application includes query examples for career semantic search, recommendation evidence, skill gap facts and ontology class instances. These queries demonstrate how graph patterns retrieve data based on meaning rather than simple text matching.

**OWL and inference.** The ontology defines classes such as `cad:Career`, `cad:Skill`, `cad:Course`, `cad:Certification`, `cad:Industry`, `cad:Interest` and `cad:LearningResource`. It also defines properties such as `cad:requiresSkill`, `cad:relatedToInterest`, `cad:recommendedCourse`, `cad:recommendedCertification`, `cad:hasLearningResource`, `cad:prerequisiteSkill` and `cad:alternativeCareer`. The project applies inference rules for symmetric alternative careers, inverse required-skill facts, recommendation scoring and prerequisite expansion.

### 3.2 Data Model

The project uses an XML dataset as the structured source data. Each career includes a title, description, required skills, related interests, industries, recommended courses, recommended certifications, learning resources and alternative careers. Skill entities can also include prerequisite skill relationships. The system transforms this structured data into RDF-style triples and inferred triples.

Main entities:

- Career: target role such as AI Engineer, Data Scientist or Cybersecurity Analyst.
- Skill: required ability such as Python, Machine Learning, SQL or Threat Analysis.
- Interest: user interest area such as Artificial Intelligence or Data Analytics.
- Industry: sector such as Technology, Finance or Healthcare.
- Course: recommended learning course such as Deep Learning Foundations.
- Certification: professional certification such as TensorFlow Developer Certificate.
- Learning Resource: documentation or platform such as OpenAI Documentation or Kaggle Learn.

### 3.3 Application Design

The browser application contains four main views:

- Search: returns ranked career, skill and course entities with semantic explanations.
- Graph: visualizes the selected career subgraph with skills, interests, courses and alternative careers.
- SPARQL: displays query patterns and result tables.
- Inference: lists facts generated by reasoning rules.

The core logic is implemented in JavaScript. The application reads XML data, builds RDF-style triples, applies inference rules and updates the interface interactively.

### 3.4 Inference Rules

The system applies the following rules:

1. If a user-selected interest matches a career through `relatedToInterest`, add recommendation evidence for that career.
2. If a user-selected skill matches a career through `requiresSkill`, add recommendation evidence for that career.
3. If a required skill is not selected by the user, mark it as a missing skill.
4. If a missing skill has prerequisite skills, recursively expand the prerequisite chain through `prerequisiteSkill`.
5. If a career has an `alternativeCareer`, infer the symmetric alternative career relationship.

## 4. Evaluation

The application was evaluated using functional test cases.

| Test case | Input | Expected result | Status |
| --- | --- | --- | --- |
| RDF graph load | Load career_knowledge_graph.xml | Career graph parses and triples are generated | Passed |
| Ontology class coverage | Load dataset | 10 careers, 29 skills, 10 courses, 9 certifications, 6 industries, 9 interests and 11 resources are available | Passed |
| Career search | Query: AI engineer Python machine learning | AI Engineer appears as the top semantic search result | Passed |
| Recommendation | Interests: Artificial Intelligence, Data Analytics; skills: Python, Machine Learning | Ranked careers are returned with explanation evidence | Passed |
| Skill gap planner | Target career: AI Engineer | Missing skills such as Deep Learning and Prompt Engineering are identified | Passed |
| Inference output | Load dataset | Alternative-career, inverse required-skill and prerequisite expansion facts are generated | Passed |

The smoke test script verifies dataset size, inferred triples, top recommendation, semantic search output and query output.

## 5. Future Improvements

Future work can extend the project by connecting the graph to a real RDF triplestore such as Apache Jena Fuseki or GraphDB. The application can also support larger career coverage, real job market data, skill levels, salary ranges, course providers and user progress tracking. Another improvement is to use SHACL validation to detect incomplete graph records. Natural language query expansion can also be added so users can describe goals such as "I enjoy building intelligent applications" and have the system map the sentence to ontology entities.

## 6. Conclusion

The project shows how Semantic Web Technology can solve a real career guidance and search problem. RDF provides a graph-based representation of careers, skills, interests, industries, courses, certifications and learning resources. SPARQL-style queries retrieve meaningful relationships from the graph. OWL-style vocabulary and inference add explainable recommendation evidence, skill gaps, prerequisite expansion and alternative career links. Compared with a normal keyword search, the semantic approach gives more traceable and structured results.

## 7. References

Antoniou, G., & van Harmelen, F. (2008). *A semantic web primer* (2nd ed.). MIT Press.

Berners-Lee, T., Hendler, J., & Lassila, O. (2001). The Semantic Web. *Scientific American, 284*(5), 34-43.

W3C. (2012). *OWL 2 Web Ontology Language document overview*. https://www.w3.org/TR/owl2-overview/

W3C. (2013). *SPARQL 1.1 query language*. https://www.w3.org/TR/sparql11-query/

W3C. (2014). *RDF 1.1 concepts and abstract syntax*. https://www.w3.org/TR/rdf11-concepts/
