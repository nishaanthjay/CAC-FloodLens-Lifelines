# How to edit this file

Every piece of user-facing text on the site lives here. Change the text under a `## key` line; never rename a key, because the code looks text up by key.
`npm run copy` checks this file (it also runs before `npm run dev` and `npm run build`). A key the code needs but this file lacks is an error; a key nothing uses is a warning.

- `{curly}` words are placeholders the code fills in. Each entry that has them has a `placeholders:` comment above it. Keep every placeholder that is listed, and do not invent new ones.
- Plurals are separate keys ending `.one` and `.other`.
- A few entries allow light markup: `**bold**`, backtick code, and `[link text](/path)`.
- A `keep meaning:` comment marks a legal or scientific claim. You may reword it, but not change what it claims.
- Entries are grouped by page, in page order. Only the `## key` lines and the text under them matter; `#` headings and comments are for you.

# Site-wide: page chrome, metadata, share cards

## site.skip
Skip to content

## site.brand.second
Lifelines

## site.name
Lifelines

<!-- the browser-tab title of an inner page; %s is replaced by that page's own title, for example "About and limits" -->
## site.title.template
%s · Lifelines

## site.share.title
Lifelines: can you still get to help?

<!-- keep meaning: says it is not a forecast and not for emergency use -->
## site.description
If the roads flood, can your neighborhood still reach a hospital or fire station? Flood scenarios for Cape Fear, NC. Not a forecast, not for emergency use.

## site.og.alt
Lifelines: can you still get to help when the roads flood?

## site.og.kicker
LIFELINES · CAPE FEAR, NC

## site.og.headline
Can you still get to help?

<!-- keep meaning: says it is not a forecast and not for emergency use -->
## site.og.subhead
Flood scenarios for road access to hospitals and fire stations. Not a forecast. Not for emergency use.

# Site-wide: top banner and navigation (masthead)

<!-- keep meaning: the not-for-emergency-use banner shown on every page -->
## masthead.notice.strong
Not for emergency use.

<!-- keep meaning: tells people to call 911 in an emergency (phone-width version) -->
## masthead.notice.short
Call 911 in an emergency

<!-- keep meaning: unvalidated forecast, replay kept separate, call 911 (wide-screen version) -->
## masthead.notice.long
Unvalidated river-flow forecast preview · Florence 2018 replay kept separate · call 911 in an emergency

## masthead.home.label
Lifelines home

## masthead.nav.primary
Primary

## masthead.nav.mobile
Mobile

## masthead.menu.open
Open menu

## masthead.menu.close
Close menu

## masthead.link.emergency
Emergency finder

## masthead.link.workspace
Map workspace

## masthead.link.address
Address check

## masthead.link.breaks
What breaks first?

## masthead.link.how
How it works

## masthead.link.limits
About and limits

# Site-wide: footer

## footer.tagline
Exploring how flooding may change access to help across Cape Fear.

## footer.explore.title
Explore

## footer.explore.replay
Florence replay

## footer.explore.address
Address check

## footer.explore.breaks
What breaks first

## footer.about.title
About

## footer.about.how
How it works

## footer.about.limits
About and limits

## footer.about.status
Data status

## footer.privacy.title
Privacy

<!-- keep meaning: what is and is not stored or collected -->
## footer.privacy.body
No user data is stored. Address searches go to OpenStreetMap Nominatim; cookie-free page-view counts are collected.

## footer.place
Cape Fear, North Carolina

## footer.credit
Built for the Congressional App Challenge

# Common words reused across the app

<!-- placeholders: hour; meaning: an hour of the scenario, where H+0 is the first hour -->
## common.hour
H+{hour}

## common.pending
…

<!-- placeholders: phone; meaning: a phone number to call -->
## common.call
Call {phone}

## common.noroute
no route

<!-- placeholders: a, b; meaning: "a of b", for example 3 of 12 -->
## common.of
{a} of {b}

## common.reload
Reload

## common.all
All

# Workspace (the map page at /): page, rail, mobile menu, mobile sheet

## workspace.meta.description
A full-screen map of how flooding could change road access to hospitals and fire stations across Cape Fear, NC. Replay, nowcast and forecast preview. Not for emergency use.

## workspace.heading
Lifelines map workspace: how flooding could change road access to help in Cape Fear

## workspace.print.title
Lifelines: address check

## workspace.print.live
Now and forecast preview (unvalidated NWM river flow).

## workspace.print.replay
Florence 2018 replay scenario. Not a forecast.

<!-- keep meaning: not for emergency use, call 911 -->
## workspace.print.warning
Not for emergency use. Call 911 in an emergency. lifelines-nc.vercel.app

## rail.nav
Primary

## rail.logo
Lifelines: about

## rail.map
Map

## rail.address
Address check

## rail.breaks
What breaks first

## rail.status
Status

## rail.about
About

## rail.menu.title
Menu

## rail.menu.close
Close menu

## sheet.aria
Summary and network insights

<!-- placeholders: snap; meaning: the current size of the mobile panel: peek, half or full -->
## sheet.resize
Resize panel. Now {snap}. Drag, or press up and down arrows.

<!-- keep meaning: not for emergency use, call 911 (mobile panel handle) -->
## sheet.notice
Not for emergency use · call 911

## sheet.menu
Open menu

## sheet.peek.hint
Drag the handle up for details

## sheet.peek.address
Check an address

# Plain words: risk levels, water, names

## tier.normal
Normal

<!-- keep meaning: Normal is not flagged in this scenario and is NOT an all-clear -->
## tier.normal.note
Not flagged in this scenario. That is not an all-clear.

## tier.watch
Watch

## tier.watch.note
Water is higher than a flood that happens about every 2 years.

## tier.high
High

## tier.high.note
Water is higher than a flood that happens about every 5 years.

## tier.closed
Likely closed

<!-- keep meaning: at this level the road is treated as closed in the scenario (flow above the 10-year level) -->
## tier.closed.note
Water is higher than a flood that happens about every 10 years, so the road is treated as closed in this scenario.

<!-- placeholders: pct; meaning: a percentage, for example 30% -->
## plain.share.pct
{pct}% of

## plain.share.under1
Under 1% of

<!-- placeholders: n; meaning: a share written as "1 in n", for example 1 in 3 -->
## plain.share.oneIn
1 in {n}

<!-- A "typical big flood" means the flow that is reached about once in 10 years. -->
<!-- placeholders: x; meaning: how many times the water flow is the typical big-flood flow, for example 7 -->
## plain.water.high
Water is about {x}× higher than a typical big flood

<!-- placeholders: x; meaning: the water flow as a multiple of the typical big-flood flow, between 1 and 1.5 -->
## plain.water.near
Water is at about a typical big-flood level ({x}×)

<!-- placeholders: pct; meaning: the water flow as a percentage of the typical big-flood flow -->
## plain.water.part
Water is about {pct}% of a typical big flood

## plain.water.low
Water is well below a typical big flood

## plain.water.none
No water reading for this hour

<!-- placeholders: x; meaning: short form for hover tips, for example 7 -->
## plain.water.short
{x}× a typical big flood

<!-- placeholders: ratio; meaning: the technical figure shown in small type, for example 6.95 -->
## plain.water.figure
{ratio}× 10-yr flow

<!-- placeholders: road; meaning: a road name, for example "Pine Road" -->
## names.road
{road} stream crossing

<!-- placeholders: road; meaning: the nearest road that has a name -->
## names.near
Small stream crossing near {road}

## names.small
Small stream crossing

<!-- placeholders: road, stream; meaning: a road and the stream it crosses -->
## names.over
{road} over {stream}

## access.state.lost
Lost access

## access.state.gt10
Slowed more than 10 min

## access.state.s1_10
Slowed 1 to 10 min

## access.state.none
Not flagged in this scenario

## access.state.na
Not assessed

# Workspace: first-visit welcome card

## welcome.title
Can you still reach help when the roads flood?

## welcome.label
Your address

## welcome.placeholder
Enter an address in Cape Fear

## welcome.submit
Check

## welcome.example
Try: Leland, NC

<!-- the address the "Try: Leland, NC" link checks -->
## welcome.example.address
113 Village Rd NE, Leland NC

## welcome.explore
Just explore the map

<!-- keep meaning: this uses a past storm as a replay; not for emergencies; call 911 -->
## welcome.notice
Uses Hurricane Florence (2018) as a replay. Not for emergencies: call 911.

# Workspace: quick tour

## rail.tour
Take the quick tour

## tour.aria
Quick tour

<!-- placeholders: n, total; meaning: which step of the tour this is -->
## tour.step
Step {n} of {total}

## tour.addr
Start here: type an address to see how you would reach an ER.

## tour.addr.tab
Start here: the “Can I get to help?” tab checks an address.

## tour.tabs
Three questions. Switch between them to see where the water is high, how you would get to help, and what breaks first.

## tour.time
Drag the time bar, or press play, to watch the storm hour by hour.

## tour.how
Every caveat, source and definition is under “How to read this”.

## tour.next
Next

## tour.skip
Skip

## tour.done
Done

# Workspace: top bar (tabs, Mode and Layer menus)

## tabs.label
Map view

## tabs.water
Where is water high?

## tabs.water.short
Water

## tabs.water.explain
Shows how high each river is compared with a typical big flood.

## tabs.access
Can I get to help?

## tabs.access.short
Get help

## tabs.access.explain
Enter an address to see how you would reach an ER and a fire station.

## tabs.consequence
What breaks first?

## tabs.consequence.short
What breaks

## tabs.consequence.explain
Ranks the crossings where a closure would affect the most people.

## topbar.mode.label
Storm

## topbar.mode.replay.badge
REPLAY

## topbar.mode.nowcast.badge
NOWCAST

## topbar.mode.forecast.badge
FORECAST

## topbar.mode.replay.value
Florence 2018

## topbar.mode.nowcast.value
Live now

## topbar.mode.forecast.value
Preview

## topbar.mode.replay.label
Florence 2018 (replay)

## topbar.mode.replay.sub
Past storm, fixed data

## topbar.mode.nowcast.label
Right now (live)

## topbar.mode.nowcast.sub
Observed gauges and tide stations

## topbar.mode.forecast.label
Next 18 hours (preview, unvalidated)

<!-- keep meaning: the forecast preview is unvalidated -->
## topbar.mode.forecast.sub
NWM short-range, unvalidated

<!-- placeholders: age; meaning: how long ago a live data file was last updated, for example "25 h ago" -->
## topbar.stale
Last updated {age}

## topbar.layer.label
Which crossings to show

## topbar.layer.rivers.label
Rivers

## topbar.layer.rivers.sub
Crossings on non-tidal streams

## topbar.layer.coastal.label
Coastal

## topbar.layer.coastal.sub
Tidal-influenced crossings

## topbar.layer.both.label
Both

## topbar.layer.both.sub
All assessed crossings

# Workspace: time control (bottom centre)

## timepill.group
Time control

## timepill.pause
Pause

## timepill.play
Play one hour every 0.7 seconds

## timepill.jump
Jump to now, hour 0

## timepill.now
Now

## timepill.slider
Hour of the scenario

<!-- placeholders: hour, caption; meaning: spoken value of the time slider, for example "H+3, Sat Sep 15, 2018" -->
## timepill.valuetext.caption
H+{hour}, {caption}

<!-- placeholders: when; meaning: the date and time of the replay hour, for example "Sat Sep 15, 2018, 8:00 AM ET" -->
## timepill.caption.replay
Florence replay: {when}

<!-- placeholders: when; meaning: the forecast step and its time, for example "+3 h · Sun 2 PM" -->
## timepill.caption.forecast
Forecast preview: {when}

## timepill.hint
Drag to watch the storm hour by hour

# Workspace: legend and map buttons

## legend.aria
Map key

## legend.hospital
Hospital

## legend.fire
Fire station

## legend.route
Your route

## legend.size.people
Bubble size = people affected

## legend.size.water
Bubble size = how high the water is

# Workspace: map buttons and map region

## mapcontrols.group
Map controls

## mapcontrols.zoomin
Zoom in

## mapcontrols.zoomout
Zoom out

## mapcontrols.reset
Reset view to Cape Fear

## mapcontrols.facilities
Hospitals and fire stations

## mapcontrols.options
Map options

## map.region
Map of crossings and services in the Cape Fear region

## map.loading
Loading map…

## map.error.timeout
the basemap did not answer in time

## map.error.title
The map could not load

<!-- placeholders: error; meaning: the reason the map failed, for example "the basemap did not answer in time" -->
## map.error.text
{error}. The summary and charts do not need the map and still work. Check the connection (the basemap comes from OpenFreeMap) and reload.

# Workspace: map hover tooltips

## tip.crossing.flow
Flow vs 10-year

## tip.crossing.novalue
no model value

## tip.crossing.people
People affected

## tip.crossing.tier
Risk

## tip.crossing.tier.novalue
No model value

<!-- placeholders: n, worst; meaning: how many crossings a map cluster holds and the worst risk level among them -->
## tip.cluster.title
{n} crossings, worst: {worst}

<!-- placeholders: n; meaning: people behind a cluster of crossings, summed per crossing so one person may be counted twice -->
## tip.cluster.people
{n} (summed)

## tip.unassessed.title
Stream crossing

## tip.unassessed.status
Status

## tip.unassessed.status.value
Not assessed

## tip.open
Open?

<!-- keep meaning: a crossing the model could not assess is never treated as open -->
## tip.unassessed.open.value
Not assumed open

## tip.service.type
Type

<!-- keep meaning: a listed service is not confirmed to be open -->
## tip.service.open.value
Not confirmed

## tip.route.name
Route

## tip.route.status
Status

## tip.route.base
Normal route (no closures)

## tip.route.alt
Alternative

## tip.route.scen
Scenario route

## tip.route.backup
Backup route

## tip.route.detour
Detour

# Workspace: route drawn on the map

## routemap.state.none
No crossing flagged

## routemap.state.risk
At risk

## routemap.state.flagged
Crossing flagged

## routemap.crossing.unassessed
Stream crossing (not assessed)

<!-- keep meaning: unassessed crossings are not assumed open -->
## routemap.status.unassessed
Not assessed by the model: not assumed open

<!-- keep meaning: a crossing with no flow value is not assumed open -->
## routemap.status.novalue
No flow value for this step: not assumed open

<!-- keep meaning: above the 10-year flow means closed in the scenario -->
## routemap.status.closed
Closed in scenario (above 10-year flow)

<!-- placeholders: label; meaning: the address or place the route starts from -->
## routemap.pin.label
Starting point: {label}

<!-- placeholders: name; meaning: the name of a crossing closed in the scenario -->
## routemap.closed.label
Closed in scenario: {name}

<!-- placeholders: name; meaning: the name of a crossing closed in the scenario -->
## routemap.closed.title
{name}: closed in scenario

## routemap.closed.marker
Closed in scenario

<!-- placeholders: m; meaning: extra minutes the detour takes compared with the normal route -->
## routemap.chip.detour
+{m} min detour

## routemap.chip.rerouted
Rerouted

<!-- placeholders: m, via; meaning: m = extra minutes compared with the fastest route, via = the main roads of that route -->
## routemap.chip.alt
+{m} min · via {via}

<!-- placeholders: name; meaning: the crossing this backup route stays clear of -->
## routemap.chip.backup
Backup if {name} closes

# Workspace: left panel (Water / Access / Consequence summary)

## leftpanel.aria
Summary

## leftpanel.title.water
Water Summary

## leftpanel.title.access
Access Summary

## leftpanel.title.consequence
Consequence Summary

## leftpanel.loading
Loading summary

## leftpanel.stale
STALE

<!-- placeholders: generated; meaning: when the data was generated -->
## leftpanel.generated
Generated {generated}

<!-- placeholders: source; meaning: where the data comes from -->
## leftpanel.source
Source: {source}

## leftpanel.error.title
The data failed to load

<!-- placeholders: error; meaning: the technical reason the data failed to load -->
## leftpanel.error.text
{error}. The map still works, but nothing here is computed. Try reloading.

## leftpanel.section.hazards
At a glance

## leftpanel.tile.flagged
Crossings likely closed

## leftpanel.tile.tidal
Coastal crossings likely closed

## leftpanel.tile.gauges
River gauges on alert

## leftpanel.tile.gauges.now
River gauges on alert (now)

<!-- keep meaning: crossings the model could not assess are not assumed open -->
## leftpanel.tile.unassessed
Crossings we could not assess

## leftpanel.section.top.flow
Where the water is highest

## leftpanel.section.top.people
Where a closure would affect the most people

## leftpanel.table.crossing
Crossing

## leftpanel.table.risk
Risk

## leftpanel.table.caption.flow
Crossings with the highest water compared with a typical big flood at this hour.

## leftpanel.table.caption.people
Crossings ranked by the people behind them, flagged crossings first.

## leftpanel.table.select
Select a row to fly the map to that crossing.

## leftpanel.table.empty.replay
No crossing to list for this layer.

<!-- keep meaning: a crossing with no model value is not assumed open -->
## leftpanel.table.empty.live
No crossing has a model value for this step, so none can be ranked. They are not assumed open.

<!-- keep meaning: what "flagged" and "people" mean in the consequence ranking -->
## leftpanel.table.note.people
Flagged = above the 10-year flow, which closes the crossing in this scenario. People are the people who lose a route or are slowed by more than a minute if this crossing alone closes.

## leftpanel.more
More

<!-- placeholders: n; meaning: people who would be affected if this crossing closed -->
## leftpanel.row.people
{n} people affected if it closes

## howto.title
How to read this

## howto.colors
What the colors mean

## howto.info
More about this number

<!-- placeholders: n; meaning: how many crossings the model could not assess -->
<!-- keep meaning: crossings the model could not assess are not assumed open -->
## howto.unassessed
{n} crossings could not be assessed (no matching stream or flow threshold). They are not assumed open.

## leftpanel.section.about
About the crossings counted

<!-- placeholders: nOsm, nStructures; meaning: nOsm = crossings mapped from OpenStreetMap, nStructures = crossings from NCDOT / NBI bridge records -->
<!-- keep meaning: OpenStreetMap crossings may not be bridges, so they are less certain -->
## leftpanel.osm.label
Count the {nOsm} OpenStreetMap-mapped crossings. They are road-stream intersections that may not be bridges, so they are less certain than the {nStructures} NCDOT / NBI structures.

<!-- keep meaning: the Layer chip only filters the display; address route checks always use every crossing -->
## leftpanel.layer.note
The “Which crossings to show” map option (the sliders button on the map) filters what is drawn and listed here. Address route checks always use every crossing.

<!-- placeholders: n; meaning: how many caveats are listed -->
## leftpanel.caveats
Caveats ({n})

<!-- placeholders: error; meaning: an error message from the live data file -->
## leftpanel.caveat.error
Data error: {error}

# Workspace: Access tab (address check)

## access.address.label
Starting address

## access.address.placeholder
Enter an address in Cape Fear

## access.address.go
Go

<!-- placeholders: example; meaning: an example address such as "e.g. 1029 N Howe St, Southport NC" -->
## access.address.hint
Use a street address with the town name, {example}. Nothing you type is stored.

<!-- placeholders: error; meaning: the technical reason the data failed to load -->
## access.error.data
Data failed to load ({error}).

<!-- placeholders: last; meaning: how long the last routing answer took, for example "3 s" or "850 ms" -->
<!-- keep meaning: routes may be late; 911 is the emergency number -->
## access.slow.plain
The routing service is slow right now ({last} for the last answer). Routes may arrive late or not at all. Call 911 in an emergency.

<!-- placeholders: last, timeouts; meaning: last = how long the last routing answer took, timeouts = how many requests timed out -->
<!-- keep meaning: routes may be late; 911 is the emergency number -->
## access.slow.timeouts
The routing service is slow right now ({last} for the last answer, {timeouts} timed out). Routes may arrive late or not at all. Call 911 in an emergency.

<!-- placeholders: n; meaning: a number of seconds -->
## access.slow.seconds
{n} s

<!-- placeholders: n; meaning: a number of milliseconds -->
## access.slow.ms
{n} ms

## access.routing.slow
Still routing. This is taking longer than usual; the public routing service may be busy.

## access.routing
Routing…

## access.routing.aria
Routing

## access.starting
Starting at

## access.place.default
Selected place

## access.copy
Copy link

## access.copied
Link copied

## access.print
Print

## access.emergency
Emergency finder

## access.services.hint
Tap to add or remove a route

## access.services.filter
Filter services

<!-- placeholders: kind; meaning: how many are shown when one kind is picked -->
<!-- keep meaning: lists are incomplete; a listing does not mean a place is open; call 911 in an emergency -->
## access.services.note.all
The nearest of each kind; pick a kind to see the {kind} nearest. Times are normal driving. Emergency rooms (CMS) and fire stations come from official lists; the rest are federal / HHS lists plus OpenStreetMap, incomplete and sometimes out of date. A listing does not mean the place is open. Call ahead; call 911 in an emergency.

<!-- placeholders: kind; meaning: how many nearest services are shown for the picked kind -->
<!-- keep meaning: lists are incomplete; a listing does not mean a place is open; call 911 in an emergency -->
## access.services.note.kind
The {kind} nearest. Times are normal driving. Emergency rooms (CMS) and fire stations come from official lists; the rest are federal / HHS lists plus OpenStreetMap, incomplete and sometimes out of date. A listing does not mean the place is open. Call 911 in an emergency.

## access.empty.live
Enter an address to list the nearest emergency rooms, fire stations, dialysis centers and other services. Pick one or several to compare routes, see which stream crossings each one uses, and how the river-flow forecast would affect them from now on.

## access.empty.replay
Enter an address to list the nearest emergency rooms, fire stations, dialysis centers and other services. Pick one or several to compare routes, see which stream crossings each one uses, and how the Florence replay would affect them hour by hour.

<!-- placeholders: error; meaning: the technical reason drive times failed -->
## routing.error.drivetimes
Drive times are unavailable right now ({error}), so services are listed by straight-line distance.

<!-- placeholders: url; meaning: a link the person can copy by hand -->
## routing.error.copy
Copy this link: {url}

## routing.noroad
no road route found

## routing.unavailable
the routing service is unavailable right now

<!-- placeholders: reason; meaning: why no detour could be found -->
## routing.nodetour
no detour found ({reason})

<!-- placeholders: name, n; meaning: name = a service such as a hospital, n = which alternative route -->
## routing.label.alternative
{name} (alternative {n})

<!-- placeholders: name; meaning: name = a service such as a hospital -->
## routing.label.detour
{name} (detour)

<!-- placeholders: name; meaning: the crossing a backup route avoids -->
## routing.label.backup
If {name} closes

# Workspace: the answer card, other places and the route strip

## answer.aria
Your answer

## answer.er.noroute
No road route to the nearest ER was found.

## answer.er.finding
Finding the way to the nearest ER…

<!-- placeholders: time; meaning: drive time such as "11 min" -->
## answer.head.ok
You can reach an ER in {time}

<!-- placeholders: n; meaning: how many crossings on the main route have above-normal water -->
## answer.head.watch.one
but the main route crosses {n} high-water stream

<!-- placeholders: n; meaning: how many crossings on the main route have above-normal water -->
## answer.head.watch.other
but the main route crosses {n} high-water streams

<!-- keep meaning: nothing flagged is NOT an all-clear -->
## answer.sub.ok
Nothing on the main route is flagged in this scenario. That is not an all-clear.

<!-- keep meaning: a scenario, not a prediction that the road will close -->
## answer.sub.watch
Water is above normal at these crossings in this scenario. That is not a prediction that the road will close.

<!-- placeholders: time; meaning: drive time of the backup route such as "26 min" -->
## answer.head.closed.backup
The fastest way to an ER is likely closed. A backup takes {time}.

<!-- keep meaning: likely closed in the scenario; call 911 -->
## answer.sub.closed
In this scenario the main route crosses a crossing that is likely closed. Call 911 in an emergency.

## answer.head.closed.all
Every route we found to an ER is likely closed

<!-- keep meaning: every route has a likely-closed crossing; call 911 -->
## answer.sub.closed.all
Shown: the option with the fewest likely-closed crossings. Call 911 in an emergency.

## answer.row.er
Nearest ER

## answer.row.fire
Nearest fire station

## answer.row.backup
Backup route

## answer.backup.looking
Looking for a backup route…

## access.other.title
Other places (dialysis, urgent care, pharmacy…)

## strip.title
Crossings on the way

## strip.home
Your address

## strip.dest
Destination

## strip.aria
Route from your address to the destination, with a dot for each stream crossing

## strip.nodata
No data

<!-- keep meaning: no crossing flagged is NOT an all-clear -->
## strip.none
No crossing on the way is at Watch or above in this scenario. That is not an all-clear.

<!-- placeholders: n; meaning: how many crossings on the route are at Normal level -->
## strip.normal
+{n} normal crossings

## route.details.title
Trip details

# Workspace: selected-crossing card

## crossing.aria
Selected crossing

## crossing.label
Selected crossing

<!-- placeholders: name; meaning: the stream a crossing goes over -->
## crossing.over
over {name}

## crossing.close
Close crossing card

<!-- keep meaning: a crossing with no model value is not assumed open -->
## crossing.novalue
No model value this step (not assumed open)

## crossing.people
People affected

## crossing.county
County

## crossing.fema
FEMA zone

## crossing.first
First likely closed

## crossing.notinreplay
not in replay

## crossing.steps
Tier at each step; select a step to move the time control

<!-- placeholders: hour, tier; meaning: the risk tier at one hour of the scenario -->
## crossing.step
H+{hour}: {tier}

## crossing.step.novalue
no model value

<!-- keep meaning: tidal crossings can flood in ways river flow does not capture -->
## crossing.tidal
Tidal-influenced: river flow may not capture its flooding.

<!-- keep meaning: crossings mapped from OpenStreetMap may not be bridges -->
## crossing.osm
OpenStreetMap road-stream intersection: may not be a bridge.

# Workspace: route analysis (used in the Access tab and the printed address check)

## route.badge.replay.open
No crossing flagged

<!-- keep meaning: open in the replay is not an all-clear; the replay sees river flow only -->
## route.note.replay.open
No crossing on this route is flagged in this replay hour. That is not an all-clear: the replay sees river flow only, and streams the model did not assess are not counted.

## route.badge.replay.risk
Watch

<!-- keep meaning: at risk = a stream on the route is above its 2-year flow -->
## route.note.replay.risk
At least one crossing on this route has water higher than a flood that happens about every 2 years, in this replay hour.

## route.badge.replay.blocked
Likely closed

<!-- keep meaning: blocked = above the 10-year flow, which closes it in this scenario -->
## route.note.replay.blocked
At least one crossing on this route has water higher than a typical big flood (about every 10 years), so it is treated as closed in this scenario.

## route.badge.live.open
No crossing flagged

<!-- keep meaning: not an all-clear; the forecast is unvalidated and sees river flow only -->
## route.note.live.open
No crossing on this route is flagged in this step. Not an all-clear: the forecast is unvalidated, sees river flow only, and crossings it could not assess are not counted.

## route.badge.live.risk
Watch

<!-- keep meaning: unvalidated model flow, not a probability of closure -->
## route.note.live.risk
At least one crossing on this route has water higher than a flood that happens about every 2 years in this step (unvalidated model flow, not a probability of closure).

## route.badge.live.blocked
Likely closed

<!-- keep meaning: a scenario level, not a probability of closure -->
## route.note.live.blocked
At least one crossing on this route has water higher than a typical big flood (about every 10 years), so it is treated as closed in this scenario. A scenario level, not a probability of closure.

## route.kind.fastest
Fastest route

## route.kind.alternate
Alternative route

## route.kind.detour
Detour around closed crossings

## route.kind.backup
Backup route

## route.badge.kind.fastest
Fastest

## route.badge.kind.alternate
Alternative

## route.badge.kind.backup
Backup

## route.badge.kind.detour
Detour

<!-- placeholders: n; meaning: extra minutes this route takes compared with the fastest one -->
## route.option.plus
+{n} min

<!-- placeholders: via; meaning: the main roads the route follows, for example "NC 133 and US 17" -->
## route.option.via
via {via}

<!-- placeholders: name; meaning: the service, for example a hospital -->
<!-- keep meaning: when no separate backup exists, every way there uses the same crossings; this is a finding about redundancy -->
## route.nobackup
{name}: No separate backup route found: every way there uses the same crossings.

<!-- placeholders: n; meaning: minutes of driving -->
## route.time.min
{n} min

<!-- placeholders: h, m; meaning: hours and minutes of driving -->
## route.time.hours
{h} h {m} min

## route.time.under
<1 min

<!-- placeholders: kind; meaning: the kind of place, in lower case, for example "emergency rooms" -->
## route.label.best
Best route · {kind}

<!-- placeholders: kind; meaning: the kind of place, in lower case -->
## route.label.allflagged
Every route has a flagged crossing · {kind}

<!-- placeholders: kind; meaning: the kind of place, in lower case -->
## route.label.noopen
No open route found · {kind}

## route.label.selected
Route you selected

<!-- placeholders: kind, road; meaning: kind = Fastest route / Alternative route / Detour, road = the main road the route follows -->
## route.via
{kind} via {road}

<!-- placeholders: kind; meaning: the kind of place, in lower case -->
<!-- keep meaning: every route crosses a flagged crossing; call 911 -->
## route.blocked.live
Every route found to the selected {kind} crosses a crossing that is likely closed in the forecast. Shown: the option with the fewest. Call 911 in an emergency.

<!-- placeholders: kind; meaning: the kind of place, in lower case -->
<!-- keep meaning: every route crosses a flagged crossing and no detour was found; call 911 -->
## route.blocked.live.nodetour
Every route found to the selected {kind} crosses a crossing that is likely closed in the forecast, and no detour around them was found. Shown: the option with the fewest. Call 911 in an emergency.

<!-- placeholders: kind; meaning: the kind of place, in lower case -->
<!-- keep meaning: every route crosses a closed crossing; call 911 -->
## route.blocked.replay
Every route found to the selected {kind} crosses a crossing that is likely closed in this replay hour. Shown: the option with the fewest. Call 911 in an emergency.

<!-- placeholders: kind; meaning: the kind of place, in lower case -->
<!-- keep meaning: every route crosses a closed crossing and no detour was found; call 911 -->
## route.blocked.replay.nodetour
Every route found to the selected {kind} crosses a crossing that is likely closed in this replay hour, and no detour around them was found. Shown: the option with the fewest. Call 911 in an emergency.

<!-- placeholders: n, time; meaning: n = how many route options there are, time = drive time such as "13 min" -->
## route.first.live.one
Ranked first of {n} option: no crossing likely closed in this step, and {time} in normal traffic.

<!-- placeholders: n, time; meaning: n = how many route options there are, time = drive time such as "13 min" -->
## route.first.live.other
Ranked first of {n} options: no crossing likely closed in this step, and {time} in normal traffic.

<!-- placeholders: n, time; meaning: n = how many route options there are, time = drive time such as "13 min" -->
## route.first.replay.one
Ranked first of {n} option: no crossing likely closed in the replay this hour, and {time} in normal traffic.

<!-- placeholders: n, time; meaning: n = how many route options there are, time = drive time such as "13 min" -->
## route.first.replay.other
Ranked first of {n} options: no crossing likely closed in the replay this hour, and {time} in normal traffic.

## route.flags.aria
Flags for this route

## route.flag.slow
Long trip.

## route.flag.detour
Long detour.

## route.flag.unknown
No data.

## route.flag.unassessed
Unassessed.

## route.fact.drive
Drive time (normal roads)

## route.fact.compare
Compared with fastest

## route.fact.fastest
Fastest

## route.fact.distance
Distance

## route.fact.assessed
Crossings assessed on it

## route.fact.steps.live
Steps likely closed in the forecast

## route.fact.steps.replay
Hours likely closed in replay

## route.fact.first.live
First likely closed

## route.fact.first.replay
First likely closed

## route.fact.never.live
Not in this forecast

## route.fact.never.replay
Not in this window

## route.timeline.live
When this route is affected, now and over the forecast

## route.timeline.replay
When this route is affected during Florence

## route.timeline.aria.live
Route status per step: now, then forecast hours

## route.timeline.aria.replay
Route status per replay hour

<!-- placeholders: time, status; meaning: time = an hour of the scenario, status = the route status that hour -->
## route.timeline.bar
{time}: {status}

<!-- keep meaning: bar height is not a probability -->
## route.timeline.note.live
Color and height: status in that step. The first bar is now, then each forecast hour. Height is not a probability.

<!-- keep meaning: bar height is not a probability -->
## route.timeline.note.replay
Color and height: replay status in that hour. Height is not a probability.

<!-- placeholders: n; meaning: how many assessed crossings there are in total -->
## route.crossings.none
None of the {n} assessed crossings lie on this route.

<!-- placeholders: n; meaning: how many crossings on the route the model could not assess -->
<!-- keep meaning: unassessed is not the same as open -->
## route.unassessed.one
Plus {n} stream crossing the model could not assess (no matched stream reach or flow threshold). Unassessed is not the same as open.

<!-- placeholders: n; meaning: how many crossings on the route the model could not assess -->
<!-- keep meaning: unassessed is not the same as open -->
## route.unassessed.other
Plus {n} stream crossings the model could not assess (no matched stream reach or flow threshold). Unassessed is not the same as open.

<!-- placeholders: n; meaning: how many route options there are -->
## route.options.title
All route options ({n})

<!-- placeholders: n; meaning: how many crossings on the route the model could not assess -->
## route.option.unassessed
{n} unassessed

## route.option.slow
long trip

## route.option.detour
long detour

<!-- placeholders: name, reason; meaning: name = the service, reason = why no route could be shown -->
## route.noroute
{name}: {reason}.

## route.ranking.live
Ranking: fewest likely-closed crossings first (clear routes lead), then the shorter drive.

## route.ranking.replay
Ranking: fewest likely-closed crossings first (open routes lead), then the shorter drive.

## route.block.title
Cross-check: the model’s own road network (Florence replay)

<!-- keep meaning: a block the replay could not assess is a gap, not a low risk -->
## route.block.unassessed
Your Census block has no route in the model’s network, so the replay did not assess it. That is a gap, not a low risk.

<!-- placeholders: dist; meaning: distance from the address to the nearest Census block -->
## route.block.intro
In the model’s routing of your nearest Census block ({dist} away), the block has

<!-- placeholders: lost, hours; meaning: lost = how many replay hours the block has no route, hours = how many replay hours there are -->
## route.block.lost
no route to any emergency hospital in {lost} of {hours} hours

## route.block.always
a route to an emergency hospital in every hour

## route.block.thislost
, including this one

<!-- placeholders: detour; meaning: extra minutes this hour -->
## route.block.thisdetour
; this hour adds {detour} min

## route.block.outro
Its road network and speeds differ from the routes above, so the two can disagree.

<!-- keep meaning: not validated, not for emergency use; river flow only -->
## route.disclaimer.live
Routes from OpenStreetMap via Valhalla, normal traffic. Crossing status comes from the NOAA National Water Model short-range forecast (unvalidated, river flow only: no surge, tide or street flooding) compared with each stream's recurrence flows. Crossings are matched to a route within 30 m. Not validated, not for emergency use.

<!-- keep meaning: not validated, not for emergency use; river flow only -->
## route.disclaimer.replay
Routes from OpenStreetMap via Valhalla, normal traffic. Closures come from the Florence 2018 replay (river flow only: no surge, tide or street flooding). Crossings are matched to a route within 30 m. Not validated, not for emergency use.

# Workspace: right panel (Network insights)

## rp.title
Network insights

## rp.collapse
Collapse network insights

## rp.loading
Loading charts

## rp.error.nodata
No data to chart

## rp.error.gauges
Gauge file unavailable

<!-- placeholders: n; meaning: number of Census blocks -->
## rp.count.blocks
{n} blocks

<!-- placeholders: n; meaning: number of crossings -->
## rp.count.crossings
{n} crossings

<!-- placeholders: n; meaning: number of river gauges -->
## rp.count.gauges
{n} gauges

## rp.cat.major
Major flood stage

## rp.cat.moderate
Moderate flood stage

## rp.cat.minor
Minor flood stage

## rp.cat.action
Action stage

## rp.cat.no_flooding
Below action stage

## rp.cat.no_observation
No current NWS reading

## rp.cat.obs_not_current
NWS reading not current

## rp.cat.not_defined
Flood stage not defined

## rp.gauges.section
River gauges by NWS category

## rp.gauges.unit
gauges

## rp.gauges.list
Gauges

<!-- placeholders: ft; meaning: river height in feet -->
## rp.gauge.stage
stage {ft} ft

## rp.gauge.notime
no time

<!-- keep meaning: gauge readings are not route status; USGS height uses a different datum and is not compared -->
## rp.gauges.note
NWS category for NWS stage. Readings are not route status. USGS gage height uses a different datum and is not compared.

## rp.coastal.section
Coastal water levels (separate layer)

## rp.coastal.error
Coastal file unavailable

## rp.coastal.predonly
Predictions only: no observed level here

## rp.coastal.noresidual
No residual available

<!-- placeholders: m; meaning: how many metres the observed water level is above the tide prediction -->
## rp.coastal.above
Observed is {m} m above the tide prediction

<!-- placeholders: m; meaning: how many metres the observed water level is below the tide prediction -->
## rp.coastal.below
Observed is {m} m below the tide prediction

## rp.coastal.older
(older reading)

## rp.coastal.river
Up the Cape Fear River: the residual includes river flow, not only surge.

<!-- keep meaning: coastal layer is shown on its own; surge and tide flooding at road level are not modeled -->
## rp.coastal.note
Shown on its own. It changes no crossing or route result, and road-level surge and tide flooding are not modeled.

## rp.unit.people
people

## rp.unit.blocks
blocks

## rp.unit.crossings
crossings

## rp.opt.people
People

## rp.opt.blocks
Blocks

## rp.opt.crossings
Crossings

## rp.area.title.replay.people
People by access state over time

## rp.area.title.replay.blocks
Blocks by access state over time

<!-- keep meaning: modeled road network with default speeds, not observed closures -->
## rp.area.note.replay
The chart stacks the people (or blocks) cut off or slowed; the other states are listed with their numbers. From the model's road network with default speeds, not observed closures.

## rp.area.title.live.people
People behind flagged crossings, by tier

## rp.area.title.live.crossings
Crossings by tier over time

<!-- keep meaning: people are summed per crossing; unvalidated; not a closure probability -->
## rp.area.note.live.people
People are summed per crossing, so the same person can appear under more than one. Unvalidated model flow, not a closure probability.

<!-- keep meaning: unvalidated; not a closure probability -->
## rp.area.note.live.crossings
Unvalidated model flow compared with each stream's recurrence flows. Not a closure probability.

<!-- placeholders: title; meaning: the chart title -->
## rp.area.aria
{title}. Left and right arrow keys change the hour.

<!-- keep meaning: an empty chart is not an all-clear -->
## rp.area.empty
Nothing flagged in this window. Not an all-clear.

## rp.legend.notflagged
Normal (not flagged in this scenario)

<!-- keep meaning: crossings with no model value are not assumed open -->
## rp.legend.novalue
No model value (not assumed open)

## rp.distributed
Distributed by

## rp.tiers.title
Crossings by risk tier

<!-- placeholders: n; meaning: crossings with no model value this step -->
<!-- keep meaning: crossings with no model value are not assumed open -->
## rp.tiers.unknown
{n} crossings have no model value this step. They are not counted above and not assumed open.

<!-- placeholders: n; meaning: crossings the model could not assess at all -->
## rp.tiers.unassessed
{n} further crossings could not be assessed (no flow threshold).

# Workspace: where the numbers come from (data note under the title)

## data.caption.nowcast
Live now: observed readings

## data.source.fallback
NWM v3.0 retrospective

## data.source.gauges.error
Gauge file unavailable

## data.source.gauges.loading
Loading gauges…

## data.source.forecast.error
Forecast file unavailable

## data.source.forecast.loading
Loading forecast…

## data.generated.none
not loaded

<!-- placeholders: time, age; meaning: time = when the file was generated, age = how long ago -->
## data.generated.cycle
{time} · cycle {age}

<!-- placeholders: time, age; meaning: time = when the file was generated, age = how long ago -->
## data.generated.age
{time} ({age})

<!-- keep meaning: replay of a past storm, not a forecast, not for emergency use -->
## data.note.replay
Replay of a past storm (Hurricane Florence), not a forecast. Not for emergency use: call 911.

<!-- keep meaning: observations; river flow only; not for emergency use -->
## data.note.nowcast
Gauge and tide readings are observations; crossing status uses the modeled hour covering now. River flow only. Not for emergency use: call 911.

<!-- keep meaning: unvalidated; river flow only; not a closure probability; not for emergency use -->
## data.note.forecast
Unvalidated NWM short-range run: river flow only, not a closure probability. Not for emergency use: call 911.

## data.note.stale
Stale: the model run is old.

<!-- keep meaning: crossings left out by the person's setting are not assumed open -->
## data.osm.excluded
OpenStreetMap-mapped crossing, left out by your setting

# Workspace: summary paragraph at the top of the left panel

## insight.when.now
the modeled hour covering now

<!-- placeholders: time; meaning: the clock time of the modeled hour -->
## insight.when.now.at
the modeled hour covering now, {time}

<!-- placeholders: h; meaning: hours ahead of now -->
## insight.when.ahead
+{h} h

<!-- placeholders: h, time; meaning: h = hours ahead of now, time = the clock time of that hour -->
## insight.when.ahead.at
+{h} h, {time}

## insight.layer.rivers
on non-tidal streams

## insight.layer.coastal
that are tidal-influenced

<!-- placeholders: share, county; meaning: share = "1 in 3" or "30% of", county = a county name -->
## insight.stat.replay.slow
{share} {county} neighborhoods need a 10+ min detour to reach an ER

<!-- placeholders: share, county; meaning: share = "1 in 3" or "30% of", county = a county name -->
## insight.stat.replay.lost
{share} {county} neighborhoods have no route to an ER

<!-- placeholders: county; meaning: a county name -->
## insight.stat.replay.none
No {county} neighborhood needs a 10+ min detour to reach an ER

## insight.stat.replay.clear
No assessed neighborhood is cut off or slowed in this scenario

<!-- placeholders: lostPeople, gt10People; meaning: people with no route to an ER, and people slowed by more than 10 min -->
<!-- keep meaning: counts of people with no route and people slowed by 10+ minutes, across the three counties -->
## insight.short.replay
Across the three counties, {lostPeople} people have no route to an ER and {gt10People} more are slowed by 10+ min.

<!-- keep meaning: nothing flagged is NOT an all-clear; the replay sees river flow only -->
## insight.short.replay.clear
That is not an all-clear: this replay sees river flow only.

<!-- placeholders: above10, assessed, step; meaning: crossings likely closed, crossings assessed, which forecast step -->
## insight.stat.live.some
{above10} of {assessed} crossings are likely closed for {step}

<!-- placeholders: people; meaning: people living behind the crossings; summed per crossing so some are counted twice -->
## insight.short.live.some
About {people} people live behind them.

## insight.stat.live.none
No crossing is likely closed in this model run

<!-- keep meaning: none likely closed is NOT an all-clear; unvalidated, river flow only -->
## insight.short.live.none
That is not an all-clear: the run is unvalidated and sees river flow only.

## insight.stat.live.expired
The latest forecast has ended

<!-- keep meaning: with no data every crossing shows as "no data", never as open -->
## insight.short.live.expired
Every crossing shows as “no data”, never as open.

<!-- placeholders: hour, when, naShare; meaning: hour = scenario hour, when = its date and time, naShare = share of blocks not assessed, for example 12% -->
<!-- keep meaning: nothing flagged is NOT an all-clear; the replay sees river flow only -->
## insight.replay.clear
At H+{hour} ({when}) in this Florence replay, no assessed block is cut off or slowed in this scenario. That is not an all-clear: the replay sees river flow only, and {naShare} of blocks are not assessed.

<!-- placeholders: hour, when, county, gt10Share, lostShare, lostPeople, gt10People; meaning: shares of one county's blocks with a detour over 10 min and with no route, then people counts for all three counties -->
<!-- keep meaning: blocks not flagged are not flagged in this scenario, which is different from safe -->
## insight.replay.both
At H+{hour} ({when}) in this Florence replay, {gt10Share} of {county} blocks need a detour of more than 10 min to reach an emergency room and {lostShare} have no route. Across the three counties {lostPeople} people have no route and {gt10People} more are slowed by more than 10 min. Blocks that are not flagged are not flagged in this scenario, which is different from safe.

<!-- placeholders: hour, when, county, lostShare, lostPeople, gt10People; meaning: share of one county's blocks with no route, then people counts for all three counties -->
<!-- keep meaning: blocks not flagged are not flagged in this scenario, which is different from safe -->
## insight.replay.lost
At H+{hour} ({when}) in this Florence replay, {lostShare} of {county} blocks have no route to an emergency room. Across the three counties {lostPeople} people have no route and {gt10People} more are slowed by more than 10 min. Blocks that are not flagged are not flagged in this scenario, which is different from safe.

<!-- placeholders: hour, when, county, gt10Share, lostPeople, gt10People; meaning: share of one county's blocks with a detour over 10 min, then people counts for all three counties -->
<!-- keep meaning: blocks not flagged are not flagged in this scenario, which is different from safe -->
## insight.replay.slow
At H+{hour} ({when}) in this Florence replay, {gt10Share} of {county} blocks need a detour of more than 10 min to reach an emergency room. Across the three counties {lostPeople} people have no route and {gt10People} more are slowed by more than 10 min. Blocks that are not flagged are not flagged in this scenario, which is different from safe.

<!-- placeholders: hour, when, county, lostPeople, gt10People; meaning: county = one county's name, then people counts for all three counties -->
<!-- keep meaning: blocks not flagged are not flagged in this scenario, which is different from safe -->
## insight.replay.none
At H+{hour} ({when}) in this Florence replay, no {county} block needs a detour of more than 10 min to reach an emergency room. Across the three counties {lostPeople} people have no route and {gt10People} more are slowed by more than 10 min. Blocks that are not flagged are not flagged in this scenario, which is different from safe.

<!-- placeholders: unassessed; meaning: how many crossings the model could not assess -->
<!-- keep meaning: with no data, every crossing shows as "no data", never as open -->
## insight.live.expired
The latest forecast cycle has ended, so every crossing shows as "no data", never as open. {unassessed} further crossings could not be assessed at all.

<!-- placeholders: step, assessed, layer, unmeasured; meaning: step = which forecast step, assessed = crossings assessed, layer = " on non-tidal streams" or similar (may be empty), unmeasured = crossings with no value or not assessed -->
<!-- keep meaning: none above the 10-year flow is NOT an all-clear; unvalidated, river flow only -->
## insight.live.none
For {step}, none of the {assessed} assessed crossings{layer} is above its 10-year flow in this model run. That is not an all-clear: the run is unvalidated, sees river flow only, and {unmeasured} crossings have no value or were not assessed.

<!-- placeholders: step, above10, assessed, layer, people, unmeasured; meaning: step = which forecast step, above10 = crossings above their 10-year flow, assessed = crossings assessed, layer = " on non-tidal streams" or similar (may be empty), people = people behind them, unmeasured = crossings with no value or not assessed -->
<!-- keep meaning: people are summed per crossing so some are counted twice; unassessed crossings are not assumed open -->
## insight.live.some
For {step}, {above10} of {assessed} assessed crossings{layer} are above their 10-year flow in this model run, which closes them in the scenario. About {people} people live behind them (summed per crossing, so some are counted twice). {unmeasured} crossings have no value or were not assessed and are not assumed open.

# About page (/about): the introduction block at the top

## hero.place
Cape Fear, North Carolina

## hero.title.lead
Can you still

## hero.title.highlight
get to help?

## hero.sub
See whether flooding could cut your route to the ER, fire station, or dialysis center — now, and over the next 18 hours.

## hero.address.label
Check an address

## hero.address.placeholder
Enter an address in Cape Fear

## hero.address.submit
Check routes

<!-- placeholders: example; meaning: an example address such as "e.g. 1029 N Howe St, Southport NC" -->
## hero.address.hint
Use a street address with the town name, {example}. Place names like “City Hall” often do not match.

## hero.address.sample
Try a Florence example

## hero.address.emergency
Quick emergency finder

<!-- keep meaning: what is and is not stored; where addresses and routes are sent -->
## hero.address.privacy
No user data is stored. Addresses go to OpenStreetMap’s Nominatim to find the location, and routes come from the public Valhalla router.

## hero.fact1.value
Now + 18 hours

## hero.fact1.label
Nowcast, then forecast preview. The Florence replay is kept separate

## hero.fact2.value
3 counties

## hero.fact2.label
New Hanover, Brunswick, Pender

## hero.fact3.value
9 kinds of help

## hero.fact3.label
Emergency rooms, fire, EMS, police, dialysis, urgent care, nursing homes, pharmacies

# About page: Remember Florence

## florence.title
Remember Florence

## florence.pill
Florence 2018 replay

## florence.body
In 2018, Hurricane Florence turned Wilmington into an island. The replay steps through 18 hours of the storm on the map.

## florence.fact1.label
Landfall

## florence.fact1.value
Sept 14, 2018 · near Wrightsville Beach

## florence.fact2.label
Access

## florence.fact2.value
Flooded roads cut Wilmington off for days

## florence.source
Source: NOAA National Hurricane Center, Hurricane Florence report (AL062018).

## florence.cta
Step through the replay

## florence.map.title
Map of the Cape Fear coast with the approximate path of Hurricane Florence making landfall near Wrightsville Beach

## florence.map.city
Wilmington

## florence.map.caption
Approximate storm path. Map data © OpenStreetMap contributors.

# About page: who it is for, and how risk is described

## audience.title
Built for the drive that matters

## audience.sub
For the people who need to reach help, and the people who provide it.

## audience.residents.title
Residents

## audience.residents.body
Check whether flooding could cut the roads between your address and the nearest hospital or fire station, and roughly when.

## audience.teams.title
Critical-facility teams

## audience.teams.body
See which crossings could separate a hospital, clinic or station from the people and staff it depends on.

# About page: how it works

## how.limits.title
What this does not model

<!-- keep meaning: river flow only; a crossing that is not flagged is "not flagged in this scenario", never an assurance -->
## how.limits.intro
The scenarios use river flow only. Anything below can close a road without showing up here, so a crossing that is not flagged is “not flagged in this scenario”, never an assurance.

<!-- keep meaning: surge and tide are shown separately and not combined with river-flow scenarios -->
## how.limits.surge
**Storm surge and tide.** Observed coastal water levels are shown separately in the nowcast. They are not combined with the river-flow scenarios.

## how.limits.pluvial
**Street and drainage (pluvial) flooding** from rain that never reaches a stream.

## how.limits.deck
**Road deck height**, and **debris and scour** at a crossing.

<!-- keep meaning: service-island cutoffs may not appear in a river-flow-only replay -->
## how.limits.islands
**Service-island cutoffs.** Areas that lose their route without a modeled stream crossing closing, such as the Smithville Island area served by Dosher Memorial Hospital on Brunswick County Emergency Management’s service-islands map, may not appear in a river-flow-only replay.

<!-- keep meaning: the service-islands map is a modeled reference, not an observation -->
## how.limits.islandsnote
Brunswick County Emergency Management’s service-islands map is a modeled reference, not an observation of what happened.

# About page: call to action

## cta.title
See what could change before the water rises.

## cta.body
Start with one address and compare routes to the nearest emergency rooms, fire stations, dialysis centers and more. No account, and nothing is stored.

## cta.button
Open route analysis

# About page: About and limits

<!-- the browser-tab title; it appears before "· Lifelines" -->
## about.title
About and limits

## about.meta.description
What Lifelines does, how it was tested, and what it does not claim.

<!-- keep meaning: not for emergency use; call 911; a student pilot, not a warning service -->
## about.notice
Not for emergency use. In an emergency, call 911. This is a scenario and nowcast tool for a student pilot, not a warning service.

## about.does.title
What it does

<!-- keep meaning: counts of crossings, segments, hospitals and fire stations; unassessed crossings are flagged, never treated as open -->
## about.does.body
Most flood tools answer “is this road underwater?” Lifelines asks a different question: if a river crossing closes, can this neighborhood still reach an emergency room, fire station, dialysis center or other lifeline, and when does that change? It joins NOAA National Water Model streamflow, USGS and NWS gauges, NOAA tide stations, 2,920 road crossings and a road network of about 246,000 segments with 11 emergency hospitals, 220 fire stations and a topped-up list of dialysis, nursing-home, urgent-care, police, EMS and pharmacy sites in New Hanover, Brunswick and Pender counties, North Carolina. The address check shows what is observed now and then the forecast, and also a the Florence replay for testing.

## about.modes.title
Three modes:

## about.modes.replay.name
REPLAY

## about.modes.replay.text
Hurricane Florence (2018) hour by hour

## about.modes.nowcast.name
NOWCAST

## about.modes.nowcast.text
Observed river gauges and coastal water levels, each stamped with its age and a stale flag.

## about.modes.forecast.name
FORECAST

<!-- keep meaning: the forecast is unvalidated and not a closure probability -->
## about.modes.forecast.text
Latest NWM short-range run as a share of each stream’s 10-year flow.

## about.testing.title
What testing showed

## about.testing.intro
Tests were written down before the data was pulled, run once, and the failures are published too.

## about.test1.value
0.958

<!-- keep meaning: AUC 0.958, 74 reports, 66 crossings; shows storm versus not-storm, not which road -->
## about.test1.text
AUC: river flow at the hours flooded-road reports were filed, versus ordinary hours (74 reports, 66 crossings). Shows storm versus not-storm, not which road.

## about.test2.value
76.7%

<!-- keep meaning: 76.7% of 73 gauge-storms within a factor of 2, median peak-time error 4 hours -->
## about.test2.text
of 73 gauge-storms: modeled peak flow within a factor of 2 of USGS gauges, median peak-time error 4 hours.

## about.test3.value
91.3%

<!-- keep meaning: 91.3% of 150 test blocks within 30% of OSRM -->
## about.test3.text
of 150 test blocks: baseline drive time to the nearest hospital within 30% of OSRM.

## about.test4.value
0.69 to 0.72

<!-- keep meaning: AUC 0.69 to 0.72 across nine storm windows; precision is low (about 5%) -->
## about.test4.text
AUC across nine 2023 to 2025 NC storm windows: crossings near recorded closures ranked higher. Precision is low (about 5%).

## about.test5.value
0.77

<!-- keep meaning: AUC 0.77; 11 Brunswick crossings against 1,435 others; one county -->
## about.test5.text
AUC: the 11 Brunswick crossings on the Sheriff’s known-flood-point map rank above 1,435 other Brunswick crossings by people affected (11 crossings, one county).

## about.case.title
Case study: Florence, Brunswick County

<!-- keep meaning: 20 flood points, 12 matched to 11 crossings; this tests the road-network model, not the flood forecast -->
## about.case.p1
The Brunswick County Sheriff’s Office marked 20 known flood points on its 2018 evacuation map. We matched 12 of the 20 to 11 road crossings and checked them against our road model.

<!-- keep meaning: numbers of people, blocks and minutes for point 10 and for all 11 crossings; nobody loses every route, the model shows long detours, not cut-off areas -->
## about.case.p2
Take point 10, the NC 211 (Southport-Supply Rd) bridge over Lockwoods Folly River near Supply. Close it and 4,681 people in 128 Census blocks, all in the Sheriff’s Town Creek island, can no longer reach the nearest emergency room the way they do now, Novant Health Brunswick Medical Center. With all 11 matched crossings closed, those people go from an average of 12.6 minutes to the nearest ER to 24.3 minutes (+11.7); 3,242 of them are 10 minutes or more slower and 370 are 15 minutes or more slower. The worst block goes from 7.7 to 24.8 minutes, when the nearest ER becomes J. Arthur Dosher Memorial Hospital in Southport. 

<!-- keep meaning: describes the map: 128 blocks, mostly 8 to 17 minutes more -->
## about.case.alt
Map of the Supply and Southport area in Brunswick County. The NC 211 bridge over Lockwoods Folly River is marked closed; dots for 128 Census blocks south and east of it are colored by added minutes to the nearest emergency room, mostly 8 to 17 minutes more, with Novant Health Brunswick Medical Center to the west and J. Arthur Dosher Memorial Hospital in Southport to the east.

<!-- keep meaning: scenario only; roads, no flow input -->
## about.case.caption
The 128 blocks this one bridge slows by more than a minute, colored by added minutes in the run with all 11 matched crossings closed (`block_deltas.csv`).

<!-- keep meaning: AUC 0.77, 95% CI 0.61 to 0.90; 11 crossings against 1,435 others -->
## about.case.p3
The model picks out the crossings that matter. The 11 matched crossings rank above the other 1,435 assessed Brunswick crossings by people affected (AUC 0.77, 95% CI 0.61 to 0.90): the places the Sheriff’s Office flagged are the places where losing a crossing slows the most people.

<!-- keep meaning: flood points are known flood spots, not confirmed closures; one county, 11 crossings, river crossings only -->
## about.case.p4
The flood-point map is dated 11 September 2018, before landfall, so the points are known flood spots. The islands map is dated 9 October 2018. Full report: [reports/phase2_bcso_islands.md](https://github.com/nishaanthjay/CAC-Lifelines-Lifelines/blob/main/reports/phase2_bcso_islands.md).

## about.claim.title
What we do not claim

<!-- keep meaning: no forecast skill is claimed; every validation test is a hindcast or an operational-analysis replay -->
## about.claim2
We do not claim forecast skill. Every validation test is a hindcast or an operational-analysis replay.

<!-- keep meaning: we never say a road, block or address is safe; not flagged is never an all-clear -->
## about.claim3
We never say a road, block or address is safe. A road that is not flagged is “not flagged in this scenario”, never an all-clear.

<!-- keep meaning: scenarios use river flow only: no surge, tide, street flooding, bridge deck height, scour or debris -->
## about.claim4
Scenarios use river flow only: no storm surge, tide, street flooding, bridge deck height, scour or debris.

<!-- keep meaning: address results are estimates from the nearest Census block, not the exact address -->
## about.claim8
Address results are estimates from the nearest Census block, not the exact address.

<!-- keep meaning: 1,333 of 1,583 crossings are OpenStreetMap intersections that may not be bridges; facility lists are incomplete and none confirmed open; there is no shelter list -->
## about.claim9
1,333 of the 1,583 assessed crossings are OpenStreetMap road-stream intersections that may not be bridges; the route page lets you leave them out. Dialysis, nursing-home, urgent-care, police and pharmacy lists come from federal / HHS files (dated per entry) and OpenStreetMap, EMS stations from OpenStreetMap only: all incomplete, none confirmed open. There is no shelter list.

<!-- keep meaning: the live forecast is the unvalidated NOAA National Water Model short-range run, river flow only; gauge readings are shown beside it, not merged into route status -->
## about.claim10
The live forecast is the NOAA National Water Model short-range run, unvalidated and river flow only. Observed gauge readings (nowcast) are shown beside it, not merged into route status.

## about.privacy.title
Data and privacy

<!-- keep meaning: no account and no user data stored; where addresses and routes are sent -->
## about.privacy.body
No account and no user data stored. Addresses you type go to OpenStreetMap Nominatim and routes to the public Valhalla router; neither is kept by us. Sources: NOAA, USGS, NCDOT, FEMA, US Census, CMS, NC OSFM, OpenStreetMap contributors, OpenFreeMap. Hourly NOAA forecast cycles are archived in an open repository: github.com/nishaanthjay/lifelines-nvm-archive.

## about.statuslink
[Data freshness status](/status)

# About page: opening animation (plays once per visit on wide screens)

## intro.aria
Lifelines introduction

## intro.skip
Skip intro

## intro.step1
Tracing the Cape Fear coast

## intro.step2
Mapping roads, rivers and crossings

## intro.step3
Locating hospitals and fire stations

## intro.step4
Running the 18-hour flood forecast

## intro.step5
Checking routes to help

## intro.marker.hospital
New Hanover Regional

## intro.marker.address
Your address

## intro.marker.crossing
Crossing may flood

## intro.hud.coords
34.2257° N · 77.9447° W

## intro.hud.counties
New Hanover · Brunswick · Pender

## intro.hud.forecast
Forecast

<!-- placeholders: hh; meaning: forecast hours counted up from 00 to 18 while the animation runs -->
## intro.hud.counter
+{hh}H

## intro.tagline
Can you still get to help?

# Data status page (/status)

## status.title
Data status

## status.meta.description
How fresh each live data layer is.

<!-- keep meaning: the site never fakes freshness; each file keeps the time it was generated -->
## status.intro
Live layers refresh hourly.

## status.table.caption
Freshness of each live data layer

## status.table.layer
Layer

## status.table.updated
Updated (ET)

## status.table.age
Age

## status.table.status
Status

## status.layer.nowcast
Nowcast: river gauges

## status.layer.coastal
Nowcast: coastal water levels

## status.layer.forecast
Forecast preview (NWM short range)

## status.layer.archive
NWM forecast archive

## status.loading
loading

## status.unavailable
unavailable

## status.fresh
Fresh

<!-- placeholders: limit; meaning: the number of hours after which a layer counts as old -->
## status.stale
Older than {limit} h

<!-- placeholders: age, n; meaning: age = how long ago the newest archived cycle was fetched, n = how many cycles are archived -->
## status.archive.age
{age} · {n} cycles

<!-- placeholders: status; meaning: the web status code when the archive list could not be read -->
## status.archive.http
manifest: {status}

## status.archive.empty
manifest has no archived cycles

## status.note.lead
The Florence replay is fixed past-storm data and does not refresh. The forecast archive is kept in a

## status.note.link
separate repository

## status.note.tail
and is used for research, not shown on the map.

# Emergency finder page (/emergency)

## emergency.meta.title
Emergency finder

## emergency.meta.description
The nearest emergency rooms, fire, EMS, police, dialysis centers, urgent care, nursing homes and pharmacies around Cape Fear, with call, directions and road check. Not for emergency use.

<!-- keep meaning: the 911 button for a life-threatening emergency -->
## emergency.call911
Life-threatening emergency? Call 911

## emergency.title
Emergency finder

## emergency.intro
The nearest emergency rooms, fire, EMS, police, dialysis centers, urgent care, nursing homes and pharmacies. Call, get directions, or check the roads on the way.

## emergency.locate
Use my location

## emergency.address.label
Address

## emergency.address.placeholder
or type an address

## emergency.address.find
Find

<!-- placeholders: example; meaning: an example address such as "e.g. 1029 N Howe St, Southport NC" -->
<!-- keep meaning: your location stays on this device except for map lookups; nothing is stored -->
## emergency.hint
Street address with the town, {example}. Your location stays on this device except for the map lookups that find the address and drive times. Nothing is stored.

<!-- placeholders: error; meaning: the technical reason the services list failed to load -->
## emergency.error.services
Services list failed to load ({error}).

## emergency.error.nolocation
This browser cannot share a location. Type an address instead.

## emergency.error.denied
Location permission was denied. Type an address instead.

## emergency.error.failed
Could not get your location. Type an address instead.

## emergency.place.default
Selected place

## emergency.place.device
Your location (from this device, not stored)

## emergency.times.slow
The routing service was slow, so these times arrived late.

<!-- placeholders: error; meaning: the technical reason drive times failed -->
## emergency.times.error
Drive times are unavailable ({error}). Distances are straight-line.

## emergency.times.loading
Getting drive times…

<!-- keep meaning: outside the pilot area the lists may be far away or missing; call 911 -->
## emergency.outside
This is outside the Cape Fear pilot area (New Hanover, Brunswick, Pender and neighbours). The lists here may be far away or missing. Call 911 in an emergency.

## emergency.near
Near

## emergency.nearest.heading
Nearest services

## emergency.nearest.er
Nearest emergency room

## emergency.show
Show

## emergency.river.title
River conditions now (observed)

<!-- placeholders: error; meaning: the technical reason the gauge file failed to load -->
## emergency.river.error
Gauge file could not be loaded ({error}).

## emergency.river.loading
Loading gauge readings…

<!-- placeholders: up, total, age; meaning: up = gauges at or above action stage, total = gauges near the pilot counties, age = how long ago the readings were updated -->
## emergency.river.summary
{up} of {total} river gauges near the pilot counties are at or above NWS action stage · updated {age}.

<!-- keep meaning: drive times here assume normal roads -->
## emergency.river.normal
Drive times here assume normal roads.

## emergency.river.link
Open route analysis

## emergency.river.tail
to check stream crossings now and over the forecast.

## emergency.lists.title
About these lists

## emergency.lists.loading
Loading…

<!-- keep meaning: sample preview, not validated, not for emergency use; call 911 -->
## emergency.lists.disclaimer
Sample preview, not validated, not for emergency use. Call 911 in an emergency.

## emergency.item.drive
drive, normal traffic

## emergency.item.straight
straight line

<!-- placeholders: limit; meaning: the number of minutes after which a trip counts as long -->
<!-- keep meaning: a long trip warning; call 911 -->
## emergency.item.long
Long trip: over the {limit} min guide. Call 911 in an emergency.

## emergency.item.directions
Directions

## emergency.item.newwindow
(opens in a new window)

## emergency.item.roads
Check roads on the way

## emergency.item.nophone
No phone number in the source list.

<!-- placeholders: src; meaning: where the listing comes from -->
<!-- keep meaning: a listing does not mean the place is open -->
## emergency.item.source
Source: {src}. Listing does not mean open.

# Old address-check links (/route) that forward to the map workspace

## redirect.title
Address check

## redirect.text
Opening the map workspace…

## redirect.continue
Continue
