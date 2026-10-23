# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Residents and critical-facility teams in the Cape Fear region checking whether flood conditions could disrupt road access to help.

## Product Purpose

FloodLens Lifelines explores how flooding may interrupt road access to hospitals and fire stations. Its purpose is to help people understand possible access disruption over time.

## Positioning

It relates flood forecasts to road access, crossings, and critical destinations so that users can explore potential changes to routes rather than interpreting water levels alone.

## Operating Context

The pilot region is Cape Fear, North Carolina, including New Hanover, Brunswick, and Pender counties. Hurricane Florence replay is part of the product concept.

## Capabilities and Constraints

- The interface includes an address lookup (route analysis: Now, then the forecast hours), a separate Florence replay mode, a quick emergency finder (/emergency), a resilience summary, and a ranked crossing view.
- Route analysis checks every crossing that has a flow threshold (1,583 of 2,920). The rest are flagged unassessed, never treated as open. 1,333 of the assessed crossings are OpenStreetMap road-stream intersections that may not be bridges; users can leave them out.
- Services: ED hospitals and fire stations (pipeline lists) plus dialysis, nursing homes, urgent care, police, pharmacies (federal / HHS lists, topped up with OpenStreetMap) and EMS (OpenStreetMap only). All incomplete; none confirmed open. No shelter list.
- Routes are flagged when they are long (over the guide time for the kind of service), a long detour, include crossings with no data or unassessed, or when the routing service is slow or times out.
- Forecast language must remain probabilistic. Risk communication uses probabilities, labels, patterns, ranges, and timestamps, and must not imply that a road is safe or all clear.
- The replay still contains placeholder values (marked). The live view (Now + forecast) shows no probabilities: only model flow compared with each stream's recurrence flows. Geocoding is Nominatim, routing is the public Valhalla server, tiles are OpenFreeMap.
- Data modes are separate and labeled: REPLAY (Hurricane Florence hindcast), NOWCAST (observed gauge and coastal water levels, with a stale flag after 3 hours), FORECAST (NWM short-range, unvalidated, river flow only, not a closure probability), and OUTLOOK-PERSISTENCE (placeholder). A replay is never presented as a forecast.
- Closure scenarios use river flow only. Observed coastal water levels are shown separately; wave run-up, rain/drainage flooding, and river-surge interaction are not included.
- No user data is stored.

## Evidence on Hand

The repository contains a working Next.js interface and an illustrative sample map. It does not currently show live forecast or geocoding data integrations.

## Product Principles

- Make possible access disruption understandable over time.
- Preserve uncertainty in every forecast and risk statement.
- Keep residents' and critical-facility teams' needs central.
- Do not imply safety from the absence of a warning.

