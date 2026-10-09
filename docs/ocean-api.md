# Offshore ocean API

Implemented in `netlify/functions/ocean.mjs`, Netlify GET route `/api/ocean`.
Ready for Claude's deployment; not deployed by Codex. Plain `server.mjs`
does not execute Netlify functions. No UI files changed.

## Frontend contract

```js
const response = await fetch('/api/ocean');
if (!response.ok) { /* show unavailable, not zero */ }
else {
  const data = await response.json();
  // data.currentHour: { time (ISO with +09:00), temperatureC,
  //                     currentKmh, currentDirectionDeg }
  // data.hours: up to 72 hourly rows in the same shape
  // data.retrievedAt, units, requestedPoint, gridPoint, source,
  // attribution, kind = 'model-forecast', limitations
}
```

Null means unavailable; zero is a valid value. Cached currentHour has an
explicit forecast time: always show that time, and select an appropriate
row from hours when the clock advances. Retrieval time is not model issue
time. Current direction is the direction toward which the water flows.
No local tide height or actual measurement is supplied.

UI labels: 沖合の海面水温（予測） / Offshore sea temperature (forecast);
沖合の海流（予測） / Offshore current (forecast). Show source/valid time and
the offshore distinction. Keep missing-field states. Do not use these
roughly8km model outputs for harbor navigation or departure clearance.

## Provider and configuration

[Marine documentation](https://open-meteo.com/en/docs/marine-weather-api),
[terms](https://open-meteo.com/en/terms). A fixed public offshore point is
sent upstream, not user locations/profile/catch data. Separate best-match
ocean request; existing GWAM weather/waves endpoint unchanged.

Free hosted API is noncommercial only. Commercial deployment needs an
appropriate Open-Meteo subscription; configure OPEN_METEO_API_KEY securely
in Netlify to use customer-marine-api.open-meteo.com. Key stays server-side.
Data attribution: Open-Meteo and applicable model providers; this module
includes Météo-France/Copernicus and the marine documentation's DWD credit.
No key or paid plan was created by this change.

30-minute per-instance cache plus Netlify CDN cache; request deduplication;
8-second upstream timeout; failed/invalid responses503/no-store; POST405.
There is no stale-success fallback. Validate current-hour coverage, Japan
timezone, exact units, matching array lengths and finite values.

Validation: all16 tests passed, including4 new ocean tests. Real function
invocation returned200, grid38.875/141.87502,72 rows and non-null values.
The live provider test did not deploy or integrate a visible Sea card.
