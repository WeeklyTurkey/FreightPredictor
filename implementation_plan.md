# Goal Description

The goal is to remove the existing graph features from the `Overview.jsx` page to declutter it, and instead create a dedicated "Graph Details" page. This new page will fetch the graph data (in JSON format from the backend/database via `freightService.js`), display an interactive graph with dates and points, and calculate the growth/fall percentages for three specific time periods: 1 day, 1 week, and 1 month.

## User Review Required

- **1-Day vs Weekly Data:** Currently, the mock data generates *weekly* data points. If the database returns weekly data instead of daily, calculating a "1-day" change will result in comparing against the same point (0% change) or require interpolating the weekly change into a daily average. I will implement logic to search for exact 1-day, 1-week, and 1-month ago data points. If an exact match isn't found, it will pick the closest available prior date within that range. Is this acceptable?
- **MetricCards:** The cards at the top of the Overview page currently have mini sparkline graphs. I plan to remove/hide these on the Overview page as part of "removing the graphs feature". Let me know if you wanted to keep the tiny sparklines and only remove the main "Mini Rate Chart".

## Open Questions

- Where would you like the link to the new "Graph Details" page to be placed? (e.g. in the top Navbar under "Rates", or as a button in the Overview page replacing the old graph?)

## Proposed Changes

### `src/pages/Overview.jsx`
- **[MODIFY]** `Overview.jsx`
  - Remove all Recharts imports (`LineChart`, `Area`, etc.).
  - Remove the "Mini Rate Chart" section from the JSX.
  - Expand the "Route Selector" width or re-layout the lower half since the graph is removed.
  - Pass a `disableGraph={true}` prop to the `MetricCard` components.

### `src/components/MetricCard.jsx`
- **[MODIFY]** `MetricCard.jsx`
  - Add a `disableGraph` prop. If true, hide the sparkline graph and disable the click-to-expand feature.

### `src/pages/GraphDetails.jsx`
- **[NEW]** `GraphDetails.jsx`
  - Fetch graph JSON data from the database using `getRates()` / `getForecast()` in `freightService.js`.
  - Display the Line Chart (Recharts) showing rate over time.
  - Display the current Date and Rate Point.
  - Calculate and display growth/fall percentages for:
    - 1 Day
    - 1 Week
    - 1 Month

### `src/App.jsx`
- **[MODIFY]** `App.jsx`
  - Add a new route `<Route path="/rates/graph" element={<GraphDetails />} />`.

## Verification Plan

### Automated Tests
- N/A

### Manual Verification
- Start the frontend dev server.
- Verify that `Overview.jsx` no longer contains the mini rate chart or expanded metric card graphs.
- Navigate to the new `/rates/graph` page and ensure it successfully fetches data, renders the graph, and correctly displays the calculated 1-day, 1-week, and 1-month changes.
