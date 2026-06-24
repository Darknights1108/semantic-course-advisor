# CareerGraph Visual Verification

Reference: `template/Semantic Career Advisor (standalone).html`

Verification viewports:

- Desktop: 1440 × 1000
- Mobile: 390 × 844

## Page Results

| View | Desktop | Mobile | Functionality |
| --- | --- | --- | --- |
| Dashboard | Pass | Pass | Filters, bookmarks and career links tested |
| Career Search | Pass | Pass | Examples, entity filters, industry filters and semantic results tested |
| Recommendations | Pass | Pass | Interest/skill chips, recalculation and pathway links tested |
| Career Explorer | Pass | Pass | Career selector, alternatives and graph link tested |
| Skill Gap & Plan | Pass | Pass | Career selection, skill toggling and plan action tested |
| Knowledge Graph | Pass | Pass | Career selection, SVG graph, zoom and fit controls tested |
| SPARQL Viewer | Pass | Pass | Query tabs, keyword filtering, skill context and copy action tested |
| Statistics & Evaluation | Pass | Pass | Live metrics, inference counts and evaluation table verified |
| Design System | Pass | Pass | Exact palette, local typography and component states verified |
| Mobile Layouts | Pass | Pass | Three template mobile reference flows reproduced |
| Search Results | Pass | Pass | Query submission, result summary and result cards verified |

## Typography and Alignment

- Plus Jakarta Sans and JetBrains Mono are served locally from the template bundle.
- Browser font loading checks pass for both families.
- The desktop shell preserves the template's 248px sidebar and 64px top bar.
- The outer blue margin and rounded frame were intentionally removed as requested; the app now fills the viewport without the large rounded-square border.
- Desktop and mobile checks report no horizontal overflow.
- Shared spacing, border, radius, shadow and color tokens match the template design system.
- LearningTopic data from the newer semantic commit is retained in search, SPARQL and Statistics without replacing the template page layouts.

## Automated Checks

- `node tests/smoke_test.mjs`
- `node tests/ui_smoke_test.mjs`
- Browser console: no errors
- Navigation: all 10 views pass
- Interactive controls: all tested buttons, filters, selectors, bookmarks, graph controls, popovers and mobile navigation pass
- Final captures:
  - `final/desktop/`
  - `final/mobile/`
