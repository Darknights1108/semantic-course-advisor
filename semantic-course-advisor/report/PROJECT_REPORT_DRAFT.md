# TSW6223 Semantic Web Technology Project Report

**Term:** 2610  
**Project Title:** Semantic Career Recommendation Platform  
**Project Theme:** Knowledge graphs and search engines: semantic querying, relationship-aware information retrieval, entity-based search  
**Selected Topics:** Category 2 - RDF/RDFS/SPARQL; Category 3 - OWL and inference  
**Group ID:** GroupXX  

## Members

| No. | Name / ID | Contribution(s) in the project | Write-up section(s) |
| --- | --- | --- | --- |
| 1 | Student Name / ID | Project planning, problem analysis, report editing | Sections 1, 2, 6 |
| 2 | Student Name / ID | Ontology design, RDF graph design, data modelling | Sections 3.3, 3.4, 3.5 |
| 3 | Student Name / ID | Application implementation, search, recommendation logic | Sections 3.1, 3.2, 3.7, 3.8 |
| 4 | Student Name / ID | Testing, evaluation, references, presentation support | Sections 4, 5, 7 |

## Table of Contents

1. Introduction  
   1.1 Background  
   1.2 Career Recommendation Challenges  
   1.3 Semantic Web Technologies  
   1.4 Project Overview  
2. Problem Statement and Objectives  
   2.1 Problem Statement  
   2.2 Project Objectives  
   2.3 Scope of Project  
3. Solution Development  
   3.1 System Architecture  
   3.2 Technology Stack  
   3.3 Ontology Design  
   3.4 RDF Knowledge Graph Design  
   3.5 OWL Relationships  
   3.6 SPARQL Query Design  
   3.7 Inference and Recommendation Logic  
   3.8 User Interface Design  
4. Evaluation  
   4.1 Testing Environment  
   4.2 Functional Testing  
   4.3 Recommendation Evaluation  
   4.4 SPARQL Evaluation  
   4.5 Discussion  
5. Future Improvements  
   5.1 Larger and More Diverse Knowledge Graph  
   5.2 Advanced OWL Reasoning and Triple Store Deployment  
   5.3 Natural Language Search and Query Expansion  
   5.4 Real Job Market and Learning Data Integration  
   5.5 Personalized Learning Path and Progress Tracking  
   5.6 Evaluation with Users and Ranking Metrics  
   5.7 Deployment, Security, and Maintainability  
6. Conclusion  
7. References  

---

## 1. Introduction

### 1.1 Background

The Semantic Web extends the traditional Web by representing information in a machine-readable and relationship-aware form. Instead of storing information only as web pages or isolated database records, Semantic Web technologies allow resources to be described as connected entities. This makes it possible for software systems to interpret relationships, retrieve data based on meaning, and infer new knowledge from existing facts.

In the previous assignment, the group studied the use of Semantic Web technology in knowledge graphs and search engines, focusing on semantic querying, relationship-aware information retrieval, and entity-based search. That literature review showed that modern search systems increasingly move beyond simple keyword matching. Search engines, digital libraries, biomedical systems, scholarly search platforms, and question answering systems use structured knowledge graphs to identify entities, relationships, and context. This project turns that study into a working prototype by building a career recommendation platform powered by a small domain knowledge graph.

The project is titled **Semantic Career Recommendation Platform**. It applies Semantic Web concepts to the problem of career path recommendation. The application models careers, skills, interests, industries, courses, certifications, and learning resources as linked entities. Users can search for career paths, inspect semantic relationships, view recommendation evidence, plan skill gaps, and inspect SPARQL-style query results.

### 1.2 Career Recommendation Challenges

Career planning is a relationship-heavy problem. A learner does not only need to know the name of a job. The learner also needs to understand which skills are required, which skills are already matched, which skills are missing, what courses or certifications can support the learning path, and what alternative career paths are related.

A normal keyword-based search engine can return pages containing terms such as "AI Engineer" or "Data Scientist". However, keyword search has several limitations in a career guidance context:

- It does not explicitly explain why a career is recommended.
- It does not show structured relationships between careers and required skills.
- It cannot easily compare a user's existing skills with career requirements.
- It usually returns documents or pages instead of career, skill, course, and certification entities.
- It does not naturally support inference, such as prerequisite expansion or alternative career suggestions.

For example, if a user searches for "AI engineer", a keyword system may return web pages containing that phrase. A semantic system can return the `AI Engineer` entity, show that it requires `Python`, `Machine Learning`, `Deep Learning`, `Prompt Engineering`, and `API Development`, and then recommend courses such as `Deep Learning Foundations` and `Software Engineering Practices`. This is more useful for decision making because the returned answer contains structured evidence.

### 1.3 Semantic Web Technologies

This project demonstrates the following Semantic Web technologies:

**XML.** XML is used as the structured source format for the project dataset. It stores career entities, skill entities, course entities, certification entities, interest entities, industry entities, learning resource entities, and relationships between them.

**RDF and RDFS.** RDF represents data as subject-predicate-object triples. In this project, triples such as `cad:AIEngineer cad:requiresSkill cad:Python` are generated from the XML dataset. RDFS-style labels and class declarations are used to make resources readable and classifiable.

**OWL.** OWL concepts are used to define classes and object properties such as `Career`, `Skill`, `Course`, `requiresSkill`, `recommendedCourse`, `prerequisiteSkill`, and `alternativeCareer`. The project also uses OWL-style reasoning ideas, especially the symmetric nature of `alternativeCareer` and inference rules over skill prerequisites.

**SPARQL.** SPARQL-style queries are used to retrieve patterns from the graph. The platform includes a SPARQL Viewer that displays query examples and result outputs for career search, recommendation evidence, skill gap facts, and ontology class instances.

**Inference.** The platform generates inferred facts from explicit graph relationships. Examples include symmetric alternative-career facts, inverse required-skill facts, profile-based recommendation facts, and recursive prerequisite skill expansion.

### 1.4 Project Overview

The **Semantic Career Recommendation Platform** is a browser-based demonstration system. It is designed for presentation and evaluation in TSW6223 Semantic Web Technology. The current application includes the following major views:

- **Overview:** explains the project background and graph statistics.
- **Search:** acts as the home page and lets the user search the career knowledge graph.
- **Recommendations:** ranks careers from selected interests and existing skills.
- **Career Explorer:** displays one career entity and its direct relationships.
- **Skill Gap Planner:** compares selected skills against a target career.
- **Graph Visualization:** draws a career-skill-course knowledge graph.
- **SPARQL Viewer:** displays query examples and query results.
- **Statistics:** lists graph size, entity counts, asserted triples, and inferred triples.
- **Evaluation:** lists test cases for project evaluation.

The application is implemented as a local static web application with JavaScript logic. It can be started by double-clicking `start-demo.cmd` from the project folder. The local server opens the demo at:

```text
http://127.0.0.1:5173/app/
```

---

## 2. Problem Statement and Objectives

### 2.1 Problem Statement

Students and early-career learners often use online search to investigate future careers. However, career information is commonly scattered across different websites, course pages, certification pages, and job descriptions. Even when information is available, it is not always organized as a meaningful learning path.

The central problem is that conventional search is mostly keyword-based. It can retrieve pages containing career-related words, but it does not understand the semantic relationships between careers, skills, interests, industries, courses, certifications, and learning resources. As a result, users may still need to manually answer important questions:

- What skills are required for this career?
- Which of my existing skills already match this career?
- Which skills are missing?
- Which course or certification should I take next?
- What prerequisite skills should I learn first?
- Are there alternative careers with similar skill requirements?
- Why is a career recommended to me?

This project addresses the problem by building a semantic career recommendation platform using a career knowledge graph. Instead of returning only plain text results, the system returns linked entities and explanation evidence.

### 2.2 Project Objectives

The project objectives are:

1. To design a Semantic Web knowledge graph for career path recommendation.
2. To model careers, skills, interests, industries, courses, certifications, and learning resources as linked entities.
3. To represent graph data using RDF-style triples generated from structured XML.
4. To define an ontology with RDFS/OWL-style classes, properties, domains, ranges, and relationship semantics.
5. To implement SPARQL-style query examples for career search, recommendation evidence, skill gap facts, and ontology class instances.
6. To implement inference rules for recommendation evidence, missing skill detection, prerequisite expansion, inverse skill facts, and symmetric alternative career facts.
7. To provide an interactive web interface for semantic search, recommendation, graph exploration, SPARQL inspection, and evaluation.
8. To evaluate the system using functional tests, search tests, recommendation tests, SPARQL tests, and inference validation.

### 2.3 Scope of Project

The project scope is a proof-of-concept semantic web application. It is not intended to replace a real career platform, job portal, or university advising system. Instead, it demonstrates how Semantic Web technologies can be applied to a realistic career recommendation scenario.

The implemented scope includes:

- 10 career entities
- 29 skill entities
- 10 course entities
- 9 certification entities
- 6 industry entities
- 9 interest entities
- 11 learning resource entities
- 423 asserted RDF-style triples
- 98 inferred triples
- 521 total graph facts after inference

The knowledge graph covers technology-related careers such as Data Scientist, AI Engineer, Machine Learning Engineer, Web Developer, Cybersecurity Analyst, Database Administrator, Cloud Engineer, Business Intelligence Analyst, Software Engineer, and NLP Engineer.

The out-of-scope items are:

- Real-time job market scraping
- Real user authentication
- Persistent user profile storage
- Full RDF triple store deployment
- Complete natural language to SPARQL conversion
- Large-scale ranking metrics based on real user feedback

---

## 3. Solution Development

### 3.1 System Architecture

The system is built as a local browser-based application. The architecture is divided into four layers:

1. **Data layer:** stores the career knowledge graph in XML and ontology/query examples in Turtle/SPARQL-style files.
2. **Semantic graph layer:** parses XML, creates RDF-style triples, creates inferred triples, executes SPARQL-style query functions, and performs semantic search.
3. **Application logic layer:** evaluates user profiles, ranks recommendations, calculates skill gaps, and prepares graph visualization data.
4. **User interface layer:** provides browser views for search, recommendation, skill gap planning, graph visualization, SPARQL query viewing, statistics, and evaluation.

The simplified architecture is:

```text
career_knowledge_graph.xml
        |
        v
loadDataset()
        |
        +-- buildTriples()
        +-- inferStaticTriples()
        |
        v
Semantic graph model
        |
        +-- searchKnowledgeGraph()
        +-- evaluateProfile()
        +-- runQuery()
        +-- graphForCareer()
        |
        v
Browser UI views
```

The server is a lightweight Node.js local static server. It serves the application files from the project folder and supports the portable URL `/app/`.

### 3.2 Technology Stack

The technology stack was selected to make the project easy to run during demonstration while still showing the required Semantic Web concepts.

| Component | Technology | Purpose |
| --- | --- | --- |
| Structured source data | XML | Stores careers, skills, courses, certifications, industries, interests, resources, and relationships |
| Ontology documentation | Turtle/RDF style file | Defines classes and properties used by the knowledge graph |
| Query examples | SPARQL-style `.rq` and JavaScript query catalog | Demonstrates semantic graph query patterns |
| Application logic | JavaScript ES modules | Parses data, builds triples, runs inference, performs search and recommendation |
| User interface | HTML, CSS, browser JavaScript | Provides interactive project demo |
| Local server | Node.js HTTP server | Serves the app locally using `start-demo.cmd` |
| Testing | Node.js smoke test | Validates dataset, inference, search, recommendation, and query output |

The project avoids external frameworks so that the demo can run on a local machine without package installation. This is useful for presentation because the project folder can be shared and started with a single command file.

### 3.3 Ontology Design

The ontology defines the main concepts in the career recommendation domain. The namespace used in the project is:

```text
cad: http://example.org/career#
```

The ontology classes are:

| Class | Meaning |
| --- | --- |
| `cad:Career` | A career role such as AI Engineer or Data Scientist |
| `cad:Skill` | A skill required by careers or taught by courses |
| `cad:Course` | A learning course that teaches skills |
| `cad:Certification` | A professional certificate related to a career path |
| `cad:Industry` | Industry sector linked to careers |
| `cad:Interest` | User interest area related to careers |
| `cad:LearningResource` | Online documentation, learning platform, or tutorial resource |
| `cad:UserProfile` | User profile context for recommendation and skill gap analysis |

The main object properties are:

| Property | Domain | Range | Description |
| --- | --- | --- | --- |
| `cad:requiresSkill` | Career | Skill | Connects a career to a required skill |
| `cad:relatedToInterest` | Career | Interest | Connects a career to a user interest area |
| `cad:belongsToIndustry` | Career | Industry | Connects a career to an industry sector |
| `cad:recommendedCourse` | Career | Course | Connects a career to a supporting course |
| `cad:recommendedCertification` | Career | Certification | Connects a career to a certification |
| `cad:hasLearningResource` | Career | LearningResource | Connects a career to a learning resource |
| `cad:prerequisiteSkill` | Skill | Skill | Connects a skill to prerequisite skills |
| `cad:alternativeCareer` | Career | Career | Connects related career alternatives |
| `cad:teachesSkill` | Course | Skill | Connects a course to the skills it teaches |

The ontology includes datatype properties:

| Property | Range | Description |
| --- | --- | --- |
| `cad:title` | string | Career title |
| `cad:description` | string | Career description |
| `rdfs:label` | string | Human-readable label for entities |

The ontology is implemented in `data/ontology.ttl`. It acts as the semantic schema for the application and supports the explanation of the knowledge graph design.

### 3.4 RDF Knowledge Graph Design

The knowledge graph is generated from `data/career_knowledge_graph.xml`. The XML file stores structured entities and relationships. During application loading, the XML is parsed into JavaScript objects, and RDF-style triples are generated.

Example career entity:

```xml
<career id="AIEngineer">
  <title>AI Engineer</title>
  <description>Builds intelligent applications using machine learning, deep learning, APIs and prompt engineering.</description>
  <requiresSkill>Python</requiresSkill>
  <requiresSkill>DeepLearning</requiresSkill>
  <requiresSkill>MachineLearning</requiresSkill>
  <requiresSkill>PromptEngineering</requiresSkill>
  <requiresSkill>APIDevelopment</requiresSkill>
  <relatedToInterest>ArtificialIntelligence</relatedToInterest>
  <relatedToInterest>SoftwareDevelopment</relatedToInterest>
  <recommendedCourse>DeepLearningFoundations</recommendedCourse>
  <recommendedCourse>SoftwareEngineeringPractices</recommendedCourse>
</career>
```

Generated RDF-style triples include:

```text
cad:AIEngineer rdf:type cad:Career
cad:AIEngineer cad:title "AI Engineer"
cad:AIEngineer cad:description "Builds intelligent applications using machine learning..."
cad:AIEngineer cad:requiresSkill cad:Python
cad:AIEngineer cad:requiresSkill cad:DeepLearning
cad:AIEngineer cad:requiresSkill cad:MachineLearning
cad:AIEngineer cad:relatedToInterest cad:ArtificialIntelligence
cad:AIEngineer cad:recommendedCourse cad:DeepLearningFoundations
```

The knowledge graph supports entity-based search because the system does not treat `AI Engineer`, `Python`, and `Deep Learning Foundations` as plain strings. They are represented as connected entities in a graph.

The implemented graph contains:

| Entity type | Count |
| --- | ---: |
| Career | 10 |
| Skill | 29 |
| Course | 10 |
| Certification | 9 |
| Industry | 6 |
| Interest | 9 |
| Learning resource | 11 |
| Asserted triples | 423 |
| Inferred triples | 98 |
| Total triples after inference | 521 |

### 3.5 OWL Relationships

OWL is used conceptually in the project to define semantic meaning for graph relationships. The most important OWL-style relationship is:

```turtle
cad:alternativeCareer a owl:SymmetricProperty ;
  rdfs:domain cad:Career ;
  rdfs:range cad:Career .
```

This means that if career A is an alternative to career B, the reverse relationship can also be inferred. For example:

```text
Asserted: cad:AIEngineer cad:alternativeCareer cad:MachineLearningEngineer
Inferred: cad:MachineLearningEngineer cad:alternativeCareer cad:AIEngineer
```

The project also uses RDFS domain and range definitions to clarify the expected subject and object types of each relationship. For example:

```turtle
cad:requiresSkill a owl:ObjectProperty ;
  rdfs:domain cad:Career ;
  rdfs:range cad:Skill .
```

This provides a formal semantic meaning: `requiresSkill` should connect a career entity to a skill entity. The user interface and query logic rely on this semantic structure.

### 3.6 SPARQL Query Design

The project includes four SPARQL-style queries in the SPARQL Viewer.

#### Query 1: Search careers

This query retrieves career records using titles, descriptions, skills, interests, and industries.

```sparql
PREFIX cad: <http://example.org/career#>
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
}
```

This query supports semantic career search because it retrieves careers through related entities, not only through the career title.

#### Query 2: Recommendation evidence

This query shows graph evidence used by the recommendation system.

```sparql
SELECT ?career ?skill ?interest ?course ?certification ?resource
WHERE {
  ?career a cad:Career ;
          cad:requiresSkill ?skill ;
          cad:relatedToInterest ?interest ;
          cad:recommendedCourse ?course ;
          cad:recommendedCertification ?certification ;
          cad:hasLearningResource ?resource .
}
```

The application uses this evidence to explain why a career is recommended.

#### Query 3: Skill gap facts

This query retrieves the skills required by careers and optional prerequisite skills.

```sparql
SELECT ?career ?requiredSkill ?prerequisiteSkill
WHERE {
  ?career a cad:Career ;
          cad:requiresSkill ?requiredSkill .
  OPTIONAL {
    ?requiredSkill cad:prerequisiteSkill ?prerequisiteSkill .
  }
}
```

In the user interface, this query is shown as grouped cards rather than a long table. Each card summarizes a career's matched skills, missing skills, and prerequisite expansion.

#### Query 4: Ontology class instances

This query lists instances of the main ontology classes.

```sparql
SELECT ?class ?instance
WHERE {
  ?instance a ?class .
  FILTER (?class IN (
    cad:Career,
    cad:Skill,
    cad:Course,
    cad:Certification,
    cad:Industry,
    cad:Interest,
    cad:LearningResource
  ))
}
```

This query is useful for verifying that the ontology classes are populated.

### 3.7 Inference and Recommendation Logic

The platform includes inference rules that transform explicit graph facts into additional useful facts.

#### Rule 1: Interest-career recommendation

If a selected user interest is linked to a career through `relatedToInterest`, the career receives recommendation evidence.

```text
IF userProfile selectedInterest ?interest
AND ?career cad:relatedToInterest ?interest
THEN userProfile cad:recommendedCareer ?career
```

Example:

```text
User selected: Artificial Intelligence
AI Engineer relatedToInterest Artificial Intelligence
Therefore: AI Engineer receives recommendation evidence
```

#### Rule 2: Skill-career recommendation

If a selected user skill is required by a career, the career receives recommendation evidence.

```text
IF userProfile selectedSkill ?skill
AND ?career cad:requiresSkill ?skill
THEN userProfile cad:recommendedCareer ?career
```

Example:

```text
User selected: Python
AI Engineer requiresSkill Python
Therefore: AI Engineer receives recommendation evidence
```

#### Rule 3: Missing skill detection

If a career requires a skill and the user has not selected that skill, the system marks it as missing.

```text
IF ?career cad:requiresSkill ?skill
AND ?skill not in user selected skills
THEN ?skill is a missing skill for the career
```

Example:

```text
Web Developer requiresSkill HTML
User has not selected HTML
Therefore: HTML is Missing
```

#### Rule 4: Prerequisite expansion

If a missing skill has prerequisite skills, the system recursively expands the prerequisite chain.

```text
IF ?skill cad:prerequisiteSkill ?preSkill
THEN ?preSkill is shown as prerequisite evidence
```

Example:

```text
Deep Learning prerequisiteSkill Machine Learning
Machine Learning prerequisiteSkill Python
Therefore: Deep Learning expands to Machine Learning and Python
```

#### Rule 5: Symmetric alternative career

If one career is an alternative to another career, the reverse relationship is inferred.

```text
IF ?careerA cad:alternativeCareer ?careerB
THEN ?careerB cad:alternativeCareer ?careerA
```

This helps the graph visualization and alternative career suggestions.

#### Recommendation scoring

The recommendation score is calculated from selected interests and selected skills:

```text
score = (matched interests * 3) + (matched skills * 2)
```

The formula gives slightly higher weight to interests because the platform is designed for career path exploration, where interest alignment is important. Skills are still important because they represent readiness for the career.

Example recommendation profile:

```text
Selected interest: Artificial Intelligence
Selected skill: Python
```

Top recommendation evidence:

| Career | Score | Matched skills | Missing skills |
| --- | ---: | ---: | ---: |
| AI Engineer | 5 | 1 | 4 |
| Data Scientist | 5 | 1 | 5 |
| Machine Learning Engineer | 5 | 1 | 4 |
| NLP Engineer | 5 | 1 | 4 |
| Software Engineer | 2 | 1 | 4 |

### 3.8 User Interface Design

The user interface was designed to be presentation-ready and easy to understand. All visible program text is written in English.

#### Search view

The Search view is the home page. A user enters a query such as:

```text
AI Engineer
Data Scientist
Machine Learning
Cybersecurity Analyst
```

The result page returns ranked entity results. For `AI Engineer`, the top results include:

| Rank | Type | Entity | Purpose |
| ---: | --- | --- | --- |
| 1 | Career Entity | AI Engineer | Target career entity |
| 2 | Skill Entity | Python | Required skill |
| 3 | Skill Entity | Deep Learning | Required skill |
| 4 | Skill Entity | Machine Learning | Required skill |
| 5 | Course Entity | Deep Learning Foundations | Recommended course |

The search engine includes typo tolerance for career names. For example, `ai enginer` is still matched to `AI Engineer`. When a query clearly refers to one career, results are focused on that career and its direct graph relationships.

#### Recommendations view

The Recommendations view lets users select interests and existing skills. The system ranks careers and explains each recommendation using matched interests, matched skills, missing skills, rules used, courses, and certifications.

#### Career Explorer view

The Career Explorer view allows users to inspect a single career entity and its graph links. It shows required skills, related interests, industries, recommended courses, recommended certifications, learning resources, and alternative careers.

#### Skill Gap Planner view

The Skill Gap Planner compares a target career with the user's current skills. It shows:

- required skills
- matched skills
- missing skills
- percentage matched
- prerequisite expansion
- recommended learning path

#### Graph Visualization view

The Graph Visualization view displays the selected career as the central node and draws related skills, interests, courses, and alternative careers around it. This makes the graph structure visible to the user.

#### SPARQL Viewer view

The SPARQL Viewer shows query examples and results. `Skill gap facts` uses grouped summary cards instead of a long raw table. It also has its own independent existing-skills selection, so its `Matched` and `Missing` status is not mixed with the Recommendations view.

#### Statistics and Evaluation views

The Statistics view summarizes graph size and entity counts. The Evaluation view shows test cases that can be used during project demonstration.

---

## 4. Evaluation

### 4.1 Testing Environment

The project was tested locally on Windows using:

| Item | Description |
| --- | --- |
| Operating system | Windows |
| Runtime | Node.js |
| Browser | Google Chrome / Chromium-based browser |
| Server | Local Node.js static server |
| Project start command | `start-demo.cmd` |
| Test command | `run-smoke-test.cmd` or `node tests/smoke_test.mjs` |
| Main URL | `http://127.0.0.1:5173/app/` |

The smoke test validates parsing, graph size, inference, query output, recommendation output, and semantic search output.

### 4.2 Functional Testing

| No. | Test case | Input / Action | Expected result | Actual result | Status |
| ---: | --- | --- | --- | --- | --- |
| 1 | Start application | Run `start-demo.cmd` | Local server starts and browser opens `/app/` | Server starts successfully | Passed |
| 2 | Load XML graph | Load `career_knowledge_graph.xml` | Dataset parses without error | 10 careers and related entities loaded | Passed |
| 3 | Generate RDF triples | Load dataset | Asserted and inferred triples are generated | 423 asserted and 98 inferred triples | Passed |
| 4 | Search AI Engineer | Query `AI Engineer` | AI Engineer appears as top result | AI Engineer is top career result | Passed |
| 5 | Typo-tolerant search | Query `ai enginer` | AI Engineer still appears as focused result | AI Engineer is returned | Passed |
| 6 | Recommendation ranking | Interest: Artificial Intelligence; Skill: Python | AI-related careers rank highly | AI Engineer, Data Scientist, ML Engineer and NLP Engineer returned | Passed |
| 7 | Skill gap planner | Target: Web Developer; selected skill: HTML | HTML matched, other web skills missing | Correct matched/missing output | Passed |
| 8 | SPARQL Viewer | Select `Skill gap facts` | Query and grouped result cards are displayed | Skill gap facts displayed by career | Passed |
| 9 | Graph visualization | Select AI Engineer | Career graph shows related skills/courses/interests | Graph renders correctly | Passed |
| 10 | Statistics view | Open Statistics | Entity and triple counts shown | Counts match smoke test | Passed |

### 4.3 Recommendation Evaluation

The recommendation system was evaluated based on whether career rankings were explainable and aligned with selected user profile context.

Example profile:

```text
Selected interest: Artificial Intelligence
Selected skill: Python
```

The system recommends careers that are linked to Artificial Intelligence and/or require Python. This produces AI-related careers such as AI Engineer, Data Scientist, Machine Learning Engineer, and NLP Engineer. The result is explainable because each recommendation contains evidence:

- matched interests
- matched skills
- missing skills
- rule explanations
- recommended courses
- recommended certifications

The recommendation logic is simple but transparent. It does not hide the reason for ranking. This is suitable for a Semantic Web project because the goal is explainability, not black-box prediction.

### 4.4 SPARQL Evaluation

The SPARQL Viewer was evaluated by checking whether each query corresponds to a meaningful graph pattern.

| Query | Evaluation purpose | Expected output |
| --- | --- | --- |
| Search careers | Demonstrates semantic search across career properties and linked entities | Career rows with matched entities |
| Recommendation evidence | Shows graph evidence for ranked career recommendations | Career, matched interests, matched skills, missing skills, score |
| Skill gap facts | Shows required skills and prerequisite expansion | Grouped career cards with matched and missing skills |
| Ontology class instances | Verifies ontology population | List of class instances |

The query viewer also helps demonstrate the connection between the application interface and the Semantic Web model. Instead of only showing final recommendations, the project reveals the graph patterns used to produce the outputs.

### 4.5 Discussion

The project successfully demonstrates the selected Semantic Web topics. It shows RDF-style representation, RDFS/OWL ontology modelling, SPARQL-style queries, and inference. It also connects the previous assignment theme to a practical program: knowledge graphs and search engines are applied to career recommendation.

The strongest part of the system is explainability. Every recommendation and skill gap result can be traced back to graph relationships. For example, a Web Developer skill gap is not arbitrary; it is generated from `Web Developer requiresSkill HTML`, `Web Developer requiresSkill CSS`, and other RDF-style facts. The user can also inspect the SPARQL-style query behind the result.

The main limitation is that the project does not use a real RDF triple store. The triples and query behaviour are simulated in JavaScript for demonstration purposes. This makes the project easier to run locally, but a production semantic application should use a proper SPARQL endpoint such as Apache Jena Fuseki or GraphDB.

Another limitation is dataset size. The graph is sufficient for demonstrating semantic relationships, but a real career platform would require many more careers, skills, courses, certifications, job roles, salary ranges, and industry-specific pathways.

---

## 5. Future Improvements

### 5.1 Larger and More Diverse Knowledge Graph

The current graph contains 10 careers and 29 skills. Future work can expand the knowledge graph to include more domains such as business, design, cybersecurity, networking, accounting, marketing, healthcare IT, and education technology. A larger graph would make the recommendation system more realistic and useful.

### 5.2 Advanced OWL Reasoning and Triple Store Deployment

The current project implements OWL-style reasoning in JavaScript. Future work can deploy the RDF data to a real triple store such as Apache Jena Fuseki, GraphDB, or Stardog. This would allow the system to use a real SPARQL endpoint and an ontology reasoner.

Potential improvements include:

- subclass reasoning
- property hierarchy reasoning
- inverse property reasoning
- transitive prerequisite reasoning
- SHACL validation for graph quality

### 5.3 Natural Language Search and Query Expansion

The current search supports keyword queries and basic typo tolerance. Future work can improve natural language search. For example:

```text
I like building intelligent applications
I want a career in data dashboards
I am good at Python and want to work in AI
```

The system can map these sentences to ontology entities such as `ArtificialIntelligence`, `Python`, `AIEngineer`, and `DataScientist`.

### 5.4 Real Job Market and Learning Data Integration

The knowledge graph can be connected to real job market data. Possible data sources include job postings, course catalogs, certification providers, university subject lists, professional skill frameworks, and labour market reports. This would make recommendations more current.

Additional properties could include:

- average salary range
- demand level
- experience level
- common tools
- course duration
- certification cost
- job market trend

### 5.5 Personalized Learning Path and Progress Tracking

Future work can include user accounts and progress tracking. The system can save completed skills, completed courses, certifications earned, and learning goals. It can then generate a personalized learning path.

Example:

```text
Goal: AI Engineer
Current skills: Python, Machine Learning
Missing skills: Deep Learning, Prompt Engineering, API Development
Recommended next step: Deep Learning Foundations
```

### 5.6 Evaluation with Users and Ranking Metrics

The current evaluation is functional testing. Future work should include user evaluation and ranking metrics. Example metrics include:

- precision at top-k
- recall of relevant careers
- mean reciprocal rank
- user satisfaction survey
- explanation usefulness rating
- time needed to understand a career path

This would make evaluation more objective.

### 5.7 Deployment, Security, and Maintainability

Future versions can be deployed as a web application with a backend server, database, RDF store, authentication, and secure API endpoints. Security improvements would be needed if user profiles are stored. Maintainability can be improved with modular data import, automated validation, and continuous testing.

---

## 6. Conclusion

This project developed a **Semantic Career Recommendation Platform** using Semantic Web concepts. The platform represents careers, skills, interests, industries, courses, certifications, and learning resources as a knowledge graph. RDF-style triples provide the graph representation, RDFS/OWL concepts define the ontology, SPARQL-style queries retrieve graph patterns, and inference rules produce recommendation evidence, skill gap analysis, prerequisite expansion, and alternative career facts.

Compared with a normal keyword search, the platform provides relationship-aware and entity-based results. A search for `AI Engineer` returns the career entity together with required skill and course entities. A recommendation result includes matched interests, matched skills, missing skills, and learning path evidence. A skill gap result shows why a skill is missing and which prerequisite skills may be needed.

The project demonstrates the practical value of Semantic Web technology in a career guidance scenario. It also connects directly to the previous assignment topic of knowledge graphs and search engines by implementing semantic querying, relationship-aware information retrieval, and entity-based search in a working application.

---

## 7. References

Abad-Navarro, F., Martínez-Costa, C., & Fernández-Breis, J. T. (2021). Semankey: A semantics-driven approach for querying RDF repositories using keywords. *IEEE Access, 9*, 91282-91301. https://doi.org/10.1109/ACCESS.2021.3091413

Bast, H., Kalmbach, J., Klumpp, T., Kramer, F., & Schnelle, N. (2022). Efficient and effective SPARQL autocompletion on very large knowledge graphs. In *Proceedings of the 31st ACM International Conference on Information & Knowledge Management* (pp. 2893-2902). Association for Computing Machinery. https://doi.org/10.1145/3511808.3557093

Berners-Lee, T., Hendler, J., & Lassila, O. (2001). The Semantic Web. *Scientific American, 284*(5), 34-43.

Gerritse, E. J., Hasibi, F., & de Vries, A. P. (2022). Entity-aware transformers for entity search. In *Proceedings of the 45th International ACM SIGIR Conference on Research and Development in Information Retrieval* (pp. 1455-1465). Association for Computing Machinery. https://doi.org/10.1145/3477495.3531971

Kroll, H., Pirklbauer, J., Kalo, J.-C., Kunz, M., Ruthmann, J., & Balke, W.-T. (2023). A discovery system for narrative query graphs: Entity-interaction-aware document retrieval. *International Journal on Digital Libraries, 24*, 1-22. https://doi.org/10.1007/s00799-023-00356-3

Liang, S., Stockinger, K., de Farias, T. M., Anisimova, M., & Gil, M. (2021). Querying knowledge graphs in natural language. *Journal of Big Data, 8*, Article 3. https://doi.org/10.1186/s40537-020-00383-w

Nikas, C., Fafalios, P., & Tzitzikas, Y. (2021). Open domain question answering over knowledge graphs using keyword search, answer type prediction, SPARQL and pre-trained neural models. In A. Hotho, E. Blomqvist, S. Dietze, A. Fokoue, Y. Ding, P. Barnaghi, A. Haller, M. Dragoni, & H. Alani (Eds.), *The Semantic Web - ISWC 2021* (Lecture Notes in Computer Science, Vol. 12922, pp. 235-251). Springer. https://doi.org/10.1007/978-3-030-88361-4_14

Omar, R., Dhall, I., Kalnis, P., & Mansour, E. (2023). A universal question-answering platform for knowledge graphs. *Proceedings of the ACM on Management of Data, 1*(1), Article 57. https://doi.org/10.1145/3588911

W3C. (2012). *OWL 2 Web Ontology Language document overview*. https://www.w3.org/TR/owl2-overview/

W3C. (2013). *SPARQL 1.1 Query Language*. https://www.w3.org/TR/sparql11-query/

W3C. (2014). *RDF 1.1 Concepts and Abstract Syntax*. https://www.w3.org/TR/rdf11-concepts/
