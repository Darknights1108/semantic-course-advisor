# Presentation Outline

## Slide 1 - Title

Explainable Semantic Search Engine for Career Path Recommendation Using Knowledge Graphs

## Slide 2 - Problem

Students need career guidance that connects interests, existing skills, missing skills and learning resources, but keyword search does not explain these relationships.

## Slide 3 - Semantic Web Technologies

- RDF triples represent careers, skills, interests, industries, courses, certifications and resources.
- RDFS labels make graph entities understandable.
- OWL properties define domains, ranges and symmetric alternative careers.
- SPARQL-style queries retrieve semantic graph patterns.

## Slide 4 - Knowledge Graph Design

Show the main entities:

- Career
- Skill
- Interest
- Industry
- Course
- Certification
- LearningResource

Show relationships:

- requiresSkill
- relatedToInterest
- belongsToIndustry
- recommendedCourse
- recommendedCertification
- hasLearningResource
- prerequisiteSkill
- alternativeCareer

## Slide 5 - Application Workflow

1. User enters a semantic search query.
2. User selects interests and existing skills.
3. System retrieves careers and related entities from the graph.
4. System applies inference and recommendation rules.
5. System explains matched interests, matched skills, missing skills, courses, certifications, resources and alternatives.

## Slide 6 - Demo

Demo views:

- Semantic search results
- Career recommendation evidence
- Skill gap output
- Career subgraph
- SPARQL query results
- Inferred facts

## Slide 7 - Evaluation

Mention passed test cases:

- AI Engineer returned for AI-related search
- ten careers and twenty-nine skills loaded
- missing skills detected for target career
- recommendation evidence generated
- SPARQL-style query results generated

## Slide 8 - Conclusion

The system demonstrates how Semantic Web technologies provide explainable, structured and reusable knowledge for career recommendation and semantic search.
