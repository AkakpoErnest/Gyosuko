# Online data snapshots for Gyosoku

Fetched October10,2026 Japan time. These are downloaded model forecasts,
not synthetic app scenarios, catch reports, port observations or validated
landing forecasts. Files are development snapshots and do not auto-refresh.
Each JSON contains its exact retrieval timestamp and forecast dates.

| Files | Contents | Units |
|---|---|---|
| kesennuma-ocean.json / .csv |72 hourly offshore sea temperatures, current speeds/directions|°C,km/h,degrees flowing toward|
| kesennuma-weather-waves.json / .csv |3 daily wind maxima, rain totals and offshore wave maxima|m/s,mm,m|

JSON carries locations and timestamps; CSV blanks mean unavailable, not zero.
Land weather request38.90112/141.57745; offshore request38.90/141.90.
See JSON for actual model grid. Daily maxima are not simultaneous readings.

Refresh from project root: `node tools/fetch-public-data.mjs`.
For app integration use /api/conditions and /api/ocean after deploying their
Netlify functions, rather than presenting static snapshots as live data.

Sources: [Open-Meteo weather](https://open-meteo.com/en/docs),
[marine API](https://open-meteo.com/en/docs/marine-weather-api).
Weather comes through Open-Meteo best-match; waves use DWD GWAM;
ocean fields use best-match Météo-France/Copernicus Marine model data.
Retain provider attribution. [Terms](https://open-meteo.com/en/terms):
free hosted API noncommercial only; commercial use needs an appropriate
subscription. Data licence CC BY4.0. See docs/ocean-api.md for configuration.

No live Kesennuma fish prices or daily actual landings were acquired. Public
historical fish-statistics candidates and their verification gaps are documented
in docs/claude-data-research.md. These ocean forecasts are not a fishing-yield
prediction or navigation/departure clearance.
