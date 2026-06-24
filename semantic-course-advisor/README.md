# Semantic Career Recommendation Platform

Presentation-ready demo for **TSW6223 Semantic Web Technology**.

## Program Description

**Title:** Semantic Career Recommendation Platform

**Selected topics:**

- Category 2: RDF/RDFS and SPARQL
- Category 3: OWL and inference

The program demonstrates a semantic search and recommendation system over a career path knowledge graph. A normal keyword search can find career pages, but it cannot explain relationships such as which skills a career requires, which interests match a career, what skills are missing, which courses or certifications support the path, and which alternative careers are related.

The application solves this by modelling careers, skills, interests, industries, courses, certifications and learning resources as linked entities:

- **XML** stores structured source data for the career knowledge graph.
- **RDF/Turtle** represents the data as subject-predicate-object triples.
- **RDFS/OWL** defines classes and properties such as `Career`, `Skill`, `Course`, `Certification`, `Industry`, `Interest`, `LearningResource`, `requiresSkill`, `relatedToInterest`, `recommendedCourse`, `recommendedCertification`, `hasLearningResource`, `prerequisiteSkill` and `alternativeCareer`.
- **SPARQL-style queries** retrieve semantic graph patterns.
- **Relationship-aware information retrieval** ranks results using skills, interests, industries, learning resources and alternative career links.
- **Entity-based search** returns career, skill and course entities instead of only plain text matches.
- **Inference rules** generate explainable recommendations, inverse required-skill facts, symmetric alternative-career facts and prerequisite skill expansion.

## Demo Views

- **Overview:** explains the project problem, RDF/RDFS, SPARQL, OWL-style inference and entity search.
- **Search:** the home page view; enter a query and the current browser tab changes to a ranked search results page.
- **Recommendations:** score careers from selected interests and existing skills.
- **Career Explorer:** inspect one career entity and its direct graph relationships.
- **Skill Gap Planner:** compare current skills with a target career and view missing/prerequisite skills.
- **Graph Visualization:** view the selected career subgraph with required skills, interests, courses and alternative careers.
- **SPARQL Viewer:** inspect example queries and result tables.
- **Statistics:** show class counts, asserted triples and inferred triples.
- **Evaluation:** show demo test cases for report and presentation evidence.

## Run The Demo

Recommended for Windows:

```powershell
start-demo.cmd
```

Double-click `start-demo.cmd` inside the project folder, or run it from PowerShell/CMD. The script starts the local server using Node.js from the computer's PATH, or from a bundled `runtime\node\node.exe` if one is included.

Or run the server directly from the project folder:

```powershell
node scripts\serve.mjs
```

Then open:

```text
http://127.0.0.1:5173/app/
```

The old project URL is still supported:

```text
http://127.0.0.1:5173/semantic-course-advisor/app/
```

## Verify The Program

Recommended:

```powershell
run-smoke-test.cmd
```

Direct command from the project folder:

```powershell
node tests\smoke_test.mjs
```

Expected result includes:

- `Smoke test passed`
- `Careers: 10`
- `Skills: 29`
- `Courses: 10`
- `Certifications: 9`
- `Industries: 6`
- `Interests: 9`
- `Learning resources: 11`
- `Asserted triples: 423`
- `Inferred triples: 98`
- `Top search result: AI Engineer`

## Folder Structure

```text
semantic-course-advisor/
  app/                 Browser demo
  data/                XML, Turtle/RDF, ontology, SPARQL query samples
  report/              Project report draft
  slides/              Presentation outline
  scripts/             Local static server
  src/                 Semantic graph and inference logic
  tests/               Smoke tests
```

## What To Customize

- Replace the placeholder group ID and member details in `report/PROJECT_REPORT_DRAFT.md`.
- Add your real screenshots after running the demo.
- Adjust career graph data in `data/career_knowledge_graph.xml` if your group needs more entities.
- Export the report to DOCX/PDF and prepare slides before submission.
