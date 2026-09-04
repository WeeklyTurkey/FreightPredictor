# Antigravity Integration Task --- SIH26006 Freight Forecasting Platform

## 1. Project Context

### Problem Statement

**SIH26006 --- Development of an Intelligent Freight Forecasting Model
for Optimized Vessel Chartering and Bulk Cargo Procurement from Overseas
to the East Coast of India.**

This project is a demo-ready prototype that helps users:

-   Analyze historical freight/charter rates.
-   Forecast future freight rates.
-   Identify potentially favorable chartering periods.
-   Generate chartering recommendations.
-   Evaluate charterer reliability/trust scores.
-   Support decision-making for vessel chartering and bulk cargo
    procurement.

The system was developed by different team members and is now being
integrated into one working application.

------------------------------------------------------------------------

# 2. Your Primary Objective

You are acting as an **integration engineer**.

The frontend and backend are already developed separately and are now
located inside the same parent workspace.

Your task is to:

1.  Thoroughly inspect and understand the existing frontend.
2.  Thoroughly inspect and understand the existing backend.
3.  Discover all available backend APIs and capabilities.
4.  Map existing frontend features to their corresponding backend APIs.
5.  Connect the frontend to the backend.
6.  Replace frontend mock/static data with real backend data wherever
    appropriate.
7.  Identify meaningful backend features that are not currently
    represented in the frontend.
8.  Add those missing features to the frontend while preserving the
    existing design language.
9.  Make the complete project runnable and demo-ready.

------------------------------------------------------------------------

# 3. Current Workspace Structure

The workspace currently contains both projects.

Conceptually:

``` text
SIH1/
│
├── Freightcast/                         # Existing frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── ...
│
└── FreightPredictor/
    └── freight-forecast-platform/       # Existing backend
        ├── api/
        │   ├── forecasting/
        │   │   ├── models.py
        │   │   ├── serializers.py
        │   │   ├── views.py
        │   │   ├── urls.py
        │   │   ├── services/
        │   │   │   ├── forecasting.py
        │   │   │   ├── recommendation.py
        │   │   │   └── trust_score.py
        │   │   ├── management/
        │   │   └── migrations/
        │   │
        │   ├── config/
        │   ├── data/
        │   ├── scripts/
        │   ├── tests/
        │   └── manage.py
        │
        ├── requirements.txt
        └── README.md
```

**Important:** The actual repository contents are the source of truth.
Inspect the current files and do not rely solely on this conceptual
structure.

------------------------------------------------------------------------

# 4. CRITICAL RULE: BACKEND BUSINESS LOGIC IS PROTECTED

The backend is considered functionally complete.

Treat it as the **source of truth**.

## Do NOT modify backend business logic.

Specifically, do not unnecessarily modify:

-   Forecasting algorithms.
-   Prophet implementation.
-   Forecast calculations.
-   Recommendation logic.
-   Charter timing logic.
-   Trust/reliability score calculations.
-   Database models.
-   Existing migrations.
-   Synthetic data generation logic.
-   Existing backend services.
-   Existing API business behavior.

Do not refactor backend files simply because you prefer a different
architecture or coding style.

Do not redesign backend response structures merely to make frontend
integration easier.

Do not replace backend calculations with frontend calculations.

------------------------------------------------------------------------

# 5. When Backend Changes Are Allowed

Backend files may be modified **only when absolutely necessary for
integration**.

Examples of potentially acceptable changes:

-   CORS configuration.
-   Allowing the frontend development origin.
-   Environment/configuration changes required for frontend-backend
    communication.
-   A minimal API accessibility fix.
-   A minimal URL configuration fix if an existing endpoint is not
    reachable.
-   Other strictly technical integration requirements.

Before modifying the backend, verify that the problem cannot be solved
from the frontend side.

Prefer:

``` text
Backend API
    ↓
Frontend API layer
    ↓
Frontend data transformation
    ↓
React components
```

Instead of:

``` text
Frontend expectation
    ↓
Modify backend logic
```

The frontend must adapt to the backend contract wherever possible.

------------------------------------------------------------------------

# 6. Mandatory Workflow

Follow this exact order:

## PHASE 1 --- INSPECT

Before implementing changes, inspect both projects.

### Inspect the frontend

Understand:

-   Framework and tooling.
-   Routing.
-   Existing pages.
-   Existing components.
-   Existing charts.
-   Existing API client code.
-   Existing state management.
-   Mock/static data.
-   Hardcoded values.
-   Existing UI flows.
-   TypeScript interfaces/types.
-   Tailwind/design system.
-   Current frontend features.

Do not redesign the frontend during this inspection.

### Inspect the backend

Understand:

-   Django settings.
-   Installed apps.
-   Root URLs.
-   App URLs.
-   Models.
-   Serializers.
-   Views/ViewSets/APIViews.
-   DRF router configuration.
-   Available endpoints.
-   HTTP methods.
-   Query parameters.
-   Request bodies.
-   Response structures.
-   Forecasting services.
-   Recommendation services.
-   Trust-score services.
-   Management commands.
-   Data dependencies.

The goal is to understand exactly what the backend already provides.

------------------------------------------------------------------------

# 7. PHASE 2 --- CREATE A FEATURE AND API MAP

Before implementing integration, create a clear internal mapping between
backend capabilities and frontend features.

Conceptually, build a table like:

  ------------------------------------------------------------------------
  Backend           API Endpoint      Existing Frontend  Required Action
  Capability                          Representation     
  ----------------- ----------------- ------------------ -----------------
  Historical        Inspect actual    Existing           Connect real data
  Freight Rates     endpoint          chart/page         

  Freight Forecast  Inspect actual    Existing forecast  Connect real data
                    endpoint          UI                 

  Chartering        Inspect actual    Existing/partial   Connect or
  Recommendation    endpoint          UI                 enhance

  Charterer Trust   Inspect actual    Existing/missing   Connect or add
  Score             endpoint          UI                 

  Other Backend     Inspect actual    Missing            Add frontend
  Capability        endpoint                             representation if
                                                         meaningful
  ------------------------------------------------------------------------

**Do not assume endpoint names. Read the actual backend URL
configuration.**

------------------------------------------------------------------------

# 8. PHASE 3 --- CONNECT EXISTING FRONTEND FEATURES

For every existing frontend feature that corresponds to backend
functionality:

1.  Find the real backend endpoint.
2.  Understand the exact response structure.
3.  Replace mock/static data where appropriate.
4.  Connect the frontend through a clean API layer.
5.  Transform data in the frontend when required.
6.  Preserve the existing UI design as much as possible.

Examples of things to look for:

-   Hardcoded chart datasets.
-   Dummy freight rates.
-   Fake forecast data.
-   Static recommendation cards.
-   Mock charterer profiles.
-   Hardcoded trust scores.
-   Placeholder metrics.
-   Fake dashboard statistics.

If real backend data exists, use it.

Do not remove useful frontend functionality simply because integration
is difficult.

------------------------------------------------------------------------

# 9. DATA TRANSFORMATION RULE

If the frontend expects one format but the backend returns another
format, transform the data in the frontend.

Example:

Backend returns:

``` json
{
  "ds": "2026-09-01",
  "yhat": 24500
}
```

Frontend chart expects:

``` json
{
  "date": "2026-09-01",
  "predictedRate": 24500
}
```

Preferred solution:

``` text
Backend response
      ↓
Frontend API/data transformation layer
      ↓
Frontend-friendly structure
      ↓
React component/chart
```

Do not change backend forecasting output simply for frontend convenience
unless there is no reasonable frontend-side solution and the change is
strictly required for integration.

------------------------------------------------------------------------

# 10. PHASE 4 --- DISCOVER MISSING FRONTEND FEATURES

This is a major part of the task.

Compare:

``` text
ALL meaningful backend capabilities
            VS
ALL existing frontend capabilities
```

If the backend provides a useful feature that is currently not exposed
in the frontend, add it to the frontend.

Examples may include:

-   Additional forecast information.
-   Forecast confidence/range data.
-   Recommendation details.
-   Suggested chartering timing.
-   Reliability/trust information.
-   Route-related insights.
-   Vessel-related data.
-   Historical rate information.
-   Other decision-support information exposed by the backend.

However:

## Do not blindly create pages for every backend endpoint.

Only expose features that are meaningful to the SIH project and improve
the usability/demo value of the application.

When adding a feature:

1.  Decide where it naturally belongs.
2.  Reuse existing components where possible.
3.  Follow the existing visual style.
4.  Avoid unnecessary duplication.
5.  Connect it to the real API.
6.  Add loading/error/empty states.

The new feature should feel like it was always part of the existing
frontend.

------------------------------------------------------------------------

# 11. FRONTEND DESIGN PRESERVATION RULE

The existing frontend is already developed.

Do not perform a full redesign.

Do not unnecessarily:

-   Replace the entire component architecture.
-   Change the visual identity.
-   Rewrite all pages.
-   Replace Tailwind configuration.
-   Replace existing chart components without a reason.
-   Introduce a new UI library unless absolutely necessary.
-   Delete existing UI functionality.

The goal is:

> **Integration + targeted enhancement**

NOT:

> **Frontend rewrite**

Preserve existing styling, spacing, layout patterns, colors, typography,
cards, navigation, and component conventions wherever practical.

------------------------------------------------------------------------

# 12. API INTEGRATION REQUIREMENTS

Create or improve a clean frontend API layer.

Prefer centralizing:

-   API base URL.
-   Axios configuration.
-   Endpoint calls.
-   Request/response typing.
-   Data transformation.

Do not scatter raw API URLs throughout many React components.

Use environment variables where appropriate for the frontend API base
URL.

For example, use the project's existing conventions and Vite-compatible
environment configuration if applicable.

Do not hardcode production-specific URLs unnecessarily.

------------------------------------------------------------------------

# 13. CORS AND COMMUNICATION

Ensure the React frontend can communicate with the Django backend during
development.

If CORS configuration is required:

-   Make the smallest backend configuration change necessary.
-   Do not touch business logic.
-   Keep allowed origins appropriately scoped.

Verify:

``` text
React Frontend
      ↓ HTTP
Django REST API
      ↓
Backend Services / Database / Forecasting
      ↓
JSON Response
      ↓
React UI
```

------------------------------------------------------------------------

# 14. LOADING, ERROR, AND EMPTY STATES

Integration should not create a brittle demo.

For API-driven features, handle:

### Loading

Show an appropriate loading state while data is being fetched.

### Error

Show a clear, non-breaking error state if the API fails.

### Empty Data

Handle cases where the backend returns no records.

Do not allow charts or pages to crash because data is temporarily
unavailable.

Keep these states visually consistent with the existing frontend.

------------------------------------------------------------------------

# 15. CHART INTEGRATION

The project uses charts for freight trends and forecasting.

When connecting charts:

-   Inspect the existing chart implementation.
-   Understand the backend response.
-   Transform data in the frontend if necessary.
-   Preserve the current visual style.
-   Ensure date fields are correctly formatted.
-   Ensure numeric values are correctly parsed.
-   Avoid chart crashes when arrays are empty.
-   Clearly distinguish historical and forecast data if the existing UI
    supports that.

Do not invent forecast data if the backend already provides it.

------------------------------------------------------------------------

# 16. TYPESCRIPT AND DATA SAFETY

Because the frontend appears to use TypeScript:

-   Add/update interfaces and types where necessary.
-   Avoid excessive `any`.
-   Type API responses based on actual backend responses.
-   Keep transformations explicit.
-   Avoid breaking existing type configuration.

If backend response structures are complex, create appropriate
frontend-side types.

------------------------------------------------------------------------

# 17. BACKEND FEATURES ARE THE SOURCE OF TRUTH

Do not assume the original project architecture fully reflects the
current implementation.

The actual backend files must be inspected.

If documentation says one thing but the backend implementation exposes
something else:

> Trust the actual current implementation.

Similarly, if the frontend UI suggests a feature but there is no backend
endpoint for it:

-   Do not invent fake production behavior.
-   Keep static UI only if it is intentionally present and useful for
    the demo.
-   Clearly prefer real backend data wherever available.

------------------------------------------------------------------------

# 18. DO NOT BREAK EXISTING FUNCTIONALITY

Before changing existing frontend code:

-   Understand what it currently does.
-   Preserve working navigation.
-   Preserve existing routes.
-   Preserve responsive behavior.
-   Preserve working components.
-   Avoid unnecessary dependency changes.

Do not delete functionality just because it is not immediately connected
to an API.

------------------------------------------------------------------------

# 19. IMPLEMENTATION PRIORITIES

Prioritize work in this order:

### Priority 1

Make frontend ↔ backend communication work.

### Priority 2

Connect all major existing frontend features to real backend APIs.

### Priority 3

Replace meaningful mock/static data with backend data.

### Priority 4

Add meaningful backend capabilities missing from the frontend.

### Priority 5

Improve loading, error, and empty states.

### Priority 6

Polish integration issues and verify the complete application.

------------------------------------------------------------------------

# 20. TESTING AND VERIFICATION

Before considering the task complete, verify the following.

## Backend

-   Backend starts successfully.
-   Existing migrations/database are not unnecessarily disturbed.
-   Existing API endpoints still work.
-   Forecasting functionality still works.
-   Recommendation functionality still works.
-   Trust-score functionality still works.

## Frontend

-   Frontend starts successfully.
-   Existing pages still work.
-   Navigation still works.
-   No unnecessary UI redesign occurred.
-   API calls reach the backend.
-   Real backend data appears where expected.
-   Charts render correctly.
-   Loading states work.
-   Error states do not crash the UI.
-   Empty states are handled.

## Integration

Verify the actual complete flow:

``` text
User opens frontend
        ↓
Frontend requests real backend data
        ↓
Django API receives request
        ↓
Existing backend logic executes
        ↓
Response returns to frontend
        ↓
Frontend transforms data if needed
        ↓
UI/charts/cards display real information
```

------------------------------------------------------------------------

# 21. IMPORTANT DECISION RULE

Whenever you encounter a frontend/backend mismatch, follow this order:

1.  Inspect the actual backend response.
2.  Check whether the existing frontend can adapt.
3.  Add a frontend transformation layer if needed.
4.  Modify backend only if strictly required for communication.
5.  Never modify backend business logic simply for convenience.

------------------------------------------------------------------------

# 22. FINAL DELIVERABLE EXPECTATION

The final application should feel like **one unified platform**, not two
separate projects placed in the same folder.

The finished result should:

-   Use the existing Django backend as the real data/logic source.
-   Use the existing React frontend as the primary presentation layer.
-   Replace relevant mock data with real API data.
-   Expose meaningful backend features missing from the frontend.
-   Preserve the existing frontend design.
-   Avoid disturbing backend logic.
-   Be stable enough for an SIH demo/presentation.

------------------------------------------------------------------------

# 23. FINAL REPORT

After completing the implementation, provide a concise report
containing:

## A. Integration Summary

-   What frontend features were connected to which backend capabilities.

## B. New Frontend Features Added

-   Backend features discovered during inspection that were missing from
    the frontend.
-   Where/how they were added.

## C. Backend Changes

Explicitly list every backend file changed.

If no backend business logic was changed, clearly state that.

## D. Configuration Changes

-   CORS changes.
-   Environment variables.
-   API base URL configuration.
-   Commands required to run frontend/backend.

## E. Remaining Limitations

Mention any feature that could not be integrated and explain why.

------------------------------------------------------------------------

# FINAL EXECUTION INSTRUCTION

Do not immediately start rewriting files.

First:

``` text
INSPECT
   ↓
MAP
   ↓
PLAN
   ↓
IMPLEMENT
   ↓
TEST
   ↓
REPORT
```

The backend is **protected and treated as the source of truth**.

The frontend is the main integration area.

Your mission is to connect the two applications cleanly, intelligently
expose meaningful backend capabilities that are currently missing from
the frontend, and produce a polished, unified, demo-ready SIH26006
Freight Forecasting Platform.
