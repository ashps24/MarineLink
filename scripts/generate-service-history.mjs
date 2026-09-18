/**
 * Generates the back-history of service requests that the executive metrics
 * need, and writes it into src/data/generated-service-history.ts.
 *
 * Run once and commit the output — the fixtures must be deterministic. Nothing
 * here runs at request time, so the app never depends on this file.
 *
 *   node scripts/generate-service-history.mjs
 */
import { writeFileSync } from "node:fs";

/** Deterministic PRNG. A fixed seed keeps every regeneration identical. */
function mulberry32(seed) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260918);
const pick = (list) => list[Math.floor(rand() * list.length)];
const between = (min, max) => min + rand() * (max - min);

// Mirrors src/data/mock-equipment.ts. Kept local so the generator is standalone.
const EQUIPMENT = [
  { id: "equip-1", type: "hoist", customerId: "cust-1", dealerId: "dealer-1", model: "75BFMII", commissioned: "2018-05-10" },
  { id: "equip-2", type: "trailer", customerId: "cust-1", dealerId: "dealer-1", model: "MPT-40", commissioned: "2019-08-22" },
  { id: "equip-3", type: "hoist", customerId: "cust-2", dealerId: "dealer-1", model: "50BFM", commissioned: "2016-04-03" },
  { id: "equip-4", type: "hoist", customerId: "cust-3", dealerId: "dealer-1", model: "100C", commissioned: "2020-11-15" },
  { id: "equip-5", type: "hoist", customerId: "cust-4", dealerId: "dealer-2", model: "165C", commissioned: "2019-02-27" },
  { id: "equip-6", type: "forklift", customerId: "cust-4", dealerId: "dealer-2", model: "FX-6", commissioned: "2021-06-09" },
  { id: "equip-7", type: "hoist", customerId: "cust-5", dealerId: "dealer-2", model: "300C", commissioned: "2014-09-30" },
  { id: "equip-8", type: "hoist", customerId: "cust-6", dealerId: "dealer-2", model: "75BFMII", commissioned: "2017-07-19" },
  { id: "equip-9", type: "hoist", customerId: "cust-7", dealerId: "dealer-3", model: "50BFM", commissioned: "2015-05-14" },
  { id: "equip-10", type: "hoist", customerId: "cust-8", dealerId: "dealer-3", model: "100C", commissioned: "2018-10-02" },
  { id: "equip-11", type: "trailer", customerId: "cust-8", dealerId: "dealer-3", model: "HT-25", commissioned: "2010-03-18" },
  { id: "equip-12", type: "hoist", customerId: "cust-9", dealerId: "dealer-4", model: "165C", commissioned: "2022-01-11" },
  { id: "equip-13", type: "hoist", customerId: "cust-10", dealerId: "dealer-4", model: "75BFMII", commissioned: "2023-04-06" },
  { id: "equip-14", type: "hoist", customerId: "cust-11", dealerId: "dealer-5", model: "300C", commissioned: "2013-06-25" },
  { id: "equip-15", type: "hoist", customerId: "cust-12", dealerId: "dealer-5", model: "50BFM", commissioned: "2019-09-12" },
];

const TEAM_BY_DEALER = {
  "dealer-1": "Pacific Northwest Field Service",
  "dealer-2": "Gulf Coast Service Team",
  "dealer-3": "Atlantic Field Service",
  "dealer-4": "Carolina Service Team",
  "dealer-5": "Great Lakes Field Service",
};

const FACTORY_TEAM = "Factory Service — Sturgeon Bay";

/**
 * Scenario library. Each entry carries its own plausible priority band and
 * whether it is scheduled work, so the generated mix is not uniform noise.
 */
const SCENARIOS = {
  hoist: [
    { subject: "Hydraulic hose failure on the {side} hoist circuit", priorities: ["high", "urgent"], summary: "A pressure hose on the {side} hoist circuit split during a lift and dumped fluid onto the deck. The unit was taken out of service, the hose assembly replaced, and the circuit bled and pressure-tested before returning to work." },
    { subject: "Main hoist cylinder drift under load", priorities: ["high"], summary: "Operators reported the load settling slowly when held at height. Testing traced the drift to worn cylinder seals; the seal kit was replaced and the hold test repeated to confirm the unit holds position." },
    { subject: "Wire rope wear beyond tolerance at {position}", priorities: ["high", "medium"], summary: "Scheduled rope inspection measured wear past the service limit on the {position} fall. The rope was replaced as a set, terminations re-swaged, and the lift proof-tested afterwards." },
    { subject: "Sling inspection after a near-capacity haul", priorities: ["medium"], summary: "Requested after hauling a vessel close to the rated capacity. Every sling and strap was inspected for cuts, abrasion and stitching damage, and the wear log was updated." },
    { subject: "Load cell reading drift on the {position} corner", priorities: ["medium", "high"], summary: "Corner load readings disagreed with the total by more than the allowed margin. The cell was recalibrated against test weights and the indicator re-zeroed." },
    { subject: "Steering axle bearing replacement", priorities: ["high", "urgent"], summary: "Play developed in the steering axle and the unit began tracking off line during moves. The bearing assembly was replaced and the axle re-shimmed to specification." },
    { subject: "Tyre replacement on the {side} bogie", priorities: ["medium", "low"], summary: "Tread depth on the {side} bogie reached the replacement threshold during a routine walk-around. Tyres were swapped as a pair and pressures reset to the load chart." },
    { subject: "Brake adjustment after seasonal storage", priorities: ["medium", "low"], summary: "Brakes dragged on the first moves of the season after a period standing idle. Shoes were cleaned and adjusted, and the parking brake hold was tested on the yard ramp." },
    { subject: "Engine coolant leak at the {side} manifold", priorities: ["medium", "high"], summary: "A slow coolant loss was traced to a perished hose at the {side} manifold. The hose and clamps were replaced and the system refilled and bled." },
    { subject: "Remote control pendant unresponsive", priorities: ["high"], summary: "The pendant intermittently lost communication with the machine mid-move. The receiver module was replaced and the pairing re-established; the emergency stop chain was verified afterwards." },
    { subject: "Emergency stop circuit fault", priorities: ["urgent"], summary: "The emergency stop circuit latched without an operator input, stopping the machine mid-lift. A failed relay was identified and replaced, and the whole safety chain was function-tested." },
    { subject: "Beam extension alignment out of true", priorities: ["high", "medium"], summary: "The beam extension was not seating evenly, leaving the slings unevenly loaded. Guides were shimmed and the extension re-aligned, then checked through the full travel." },
    { subject: "Annual inspection and load test certification", priorities: ["low", "medium"], scheduled: true, summary: "Annual inspection covering structure, ropes, brakes, hydraulics and the safety circuit, closed out with a proof load test and updated certification for the yard's records." },
    { subject: "250-hour service interval", priorities: ["low"], scheduled: true, summary: "Routine interval service: engine oil and filters, hydraulic filter, greasing throughout, and a full walk-around inspection with findings logged." },
    { subject: "Hydraulic fluid analysis flagged contamination", priorities: ["medium"], summary: "Sampling returned particulate counts above the target cleanliness class. The system was flushed, filters replaced, and a follow-up sample scheduled to confirm the result." },
    { subject: "Corrosion treatment on the {side} leg", priorities: ["low", "medium"], summary: "Surface corrosion was found at the base of the {side} leg during inspection. The area was prepared, treated and recoated to the yard's paint specification." },
    { subject: "Operator training and certification refresh", priorities: ["low", "medium"], scheduled: true, summary: "On-site refresher covering lift planning, sling selection, load charts and emergency stop procedure, with competency signed off for the yard's operators." },
    { subject: "Drive motor overheating during long moves", priorities: ["high"], summary: "The drive motor reached temperature alarm on extended yard moves. A partially blocked cooler was cleaned and the thermostat replaced; temperatures held normal on retest." },
  ],
  trailer: [
    { subject: "Wheel bearing failure on the {side} axle", priorities: ["high"], summary: "A bearing ran hot and seized on the {side} axle during a move. The hub was rebuilt with new bearings and seals, and the opposite side was inspected as a precaution." },
    { subject: "Uneven tyre wear inspection", priorities: ["medium", "low"], summary: "Yard crew flagged uneven wear across the axle set ahead of the busy season. Alignment and pressures were checked and corrected, and the worn tyres were replaced." },
    { subject: "Hydraulic ram seal leak", priorities: ["medium"], summary: "Fluid was weeping past the ram seal and marking the yard surface. The ram was resealed on site and the system topped up and tested through full travel." },
    { subject: "Hitch wear and pin replacement", priorities: ["low", "medium"], summary: "Play in the hitch exceeded the wear limit at inspection. The pin and bushes were replaced and the coupling function-tested under load." },
    { subject: "Frame corrosion assessment", priorities: ["medium"], summary: "Corrosion was noted along a frame member during the seasonal check. The area was cleaned back for assessment, found to be surface only, then treated and recoated." },
    { subject: "Annual trailer inspection", priorities: ["low"], scheduled: true, summary: "Annual inspection covering frame, axles, bearings, brakes, tyres and hydraulics, with findings and remaining service life recorded for the yard." },
  ],
  forklift: [
    { subject: "Hydraulic leak beneath the mast assembly", priorities: ["medium", "high"], summary: "Fluid pooled beneath the mast between shifts. A cracked hose fitting was identified and replaced, and the mast was cycled to confirm the leak was resolved." },
    { subject: "Mast chain tension out of specification", priorities: ["medium"], summary: "Chain tension had fallen outside specification, leaving the forks sitting unevenly. Chains were adjusted and lubricated, and wear was measured and logged." },
    { subject: "Fork inspection and thickness check", priorities: ["low"], scheduled: true, summary: "Routine fork inspection measuring blade thickness, heel wear and tip alignment against the manufacturer's limits, with results recorded." },
    { subject: "Battery not holding charge", priorities: ["medium", "high"], summary: "Run time had dropped well below normal over several weeks. Cell testing identified a failed bank; the battery was replaced and the charger output verified." },
    { subject: "250-hour service interval", priorities: ["low"], scheduled: true, summary: "Interval service covering fluids, filters, greasing and a full safety walk-around, with the findings logged for the yard." },
  ],
};

const SIDES = ["port", "starboard", "near", "off"];
const POSITIONS = ["forward", "aft", "port forward", "starboard aft"];

/** Fall haul-out and spring launch drive the marine service year. */
const SEASONAL_WEIGHT = [0.6, 0.6, 0.9, 1.3, 1.5, 1.2, 0.9, 0.9, 1.6, 1.7, 1.3, 0.7];

function fill(text) {
  return text.replaceAll("{side}", pick(SIDES)).replaceAll("{position}", pick(POSITIONS));
}

/**
 * Formats a synthetic instant. The Date carries day *and* time-of-day already
 * baked in (via Date.UTC(y, m, d, hour, minute)) — read back with the UTC
 * getters rather than reformatted with a fresh random hour, which is what
 * previously let updatedAt land before createdAt: the two were built from
 * independently-randomised hours on what could be the same calendar day.
 */
function iso(date, offset) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:00${offset}`
  );
}

const OFFSET_BY_DEALER = {
  "dealer-1": "-07:00",
  "dealer-2": "-04:00",
  "dealer-3": "-04:00",
  "dealer-4": "-04:00",
  "dealer-5": "-04:00",
};

// The hand-written fixtures cover 2026-08-01 onwards; this fills the year before.
const START = Date.UTC(2025, 8, 1);
const END = Date.UTC(2026, 6, 31);
const TODAY = Date.UTC(2026, 8, 18);

const records = [];
let sequence = 1;

for (let month = new Date(START); month.getTime() <= END; month.setUTCMonth(month.getUTCMonth() + 1)) {
  const weight = SEASONAL_WEIGHT[month.getUTCMonth()];
  const count = Math.max(3, Math.round(between(5.0, 7.6) * weight));

  for (let i = 0; i < count; i += 1) {
    const equipment = pick(EQUIPMENT);
    const scenario = pick(SCENARIOS[equipment.type]);
    const priority = pick(scenario.priorities);

    const day = 1 + Math.floor(rand() * 27);
    // Time-of-day is fixed into the instant used for every downstream
    // calculation, not applied later as an independent random display value —
    // that mismatch is what previously produced updatedAt < createdAt.
    const createdHour = 7 + Math.floor(rand() * 9);
    const createdMinute = pick([0, 15, 30, 45]);
    const created = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), day, createdHour, createdMinute));
    if (created.getTime() > END) continue;

    // Urgent work is answered fastest; scheduled work sits longest.
    const baseDays =
      priority === "urgent" ? between(0.5, 3) :
      priority === "high" ? between(1.5, 8) :
      priority === "medium" ? between(3, 16) : between(5, 26);
    const resolutionDays = scenario.scheduled ? baseDays * 1.35 : baseDays;

    const resolvedAt = new Date(created.getTime() + resolutionDays * 86400000);
    const isResolved = resolvedAt.getTime() < TODAY - 5 * 86400000;

    const status = isResolved ? (rand() < 0.62 ? "closed" : "resolved") : pick(["in_progress", "waiting"]);
    // At least 6 hours after creation, whatever the day-level gap rounds to —
    // guarantees forward ordering even for same-day updates.
    const updateGapMs = Math.max(6 * 3_600_000, baseDays * 0.5 * 86_400_000);
    const updated = isResolved ? resolvedAt : new Date(created.getTime() + updateGapMs);

    const offset = OFFSET_BY_DEALER[equipment.dealerId];
    const team = scenario.scheduled && rand() < 0.22 ? FACTORY_TEAM : TEAM_BY_DEALER[equipment.dealerId];

    const kind = scenario.scheduled ? "scheduled" : "corrective";
    // A unit is reported out of service when corrective work is serious enough.
    const outOfService =
      kind === "corrective" && (priority === "urgent" || (priority === "high" && rand() < 0.55));

    records.push({
      kind,
      unitOutOfService: outOfService,
      id: `sr-h${sequence}`,
      referenceNumber: `SR-${created.getUTCFullYear()}-${String(600 + sequence).padStart(4, "0")}`,
      subject: fill(scenario.subject),
      status,
      priority,
      assignedTeam: team,
      equipmentId: equipment.id,
      customerId: equipment.customerId,
      dealerId: equipment.dealerId,
      createdAt: iso(created, offset),
      updatedAt: iso(updated, offset),
      statusChangedAt: iso(updated, offset),
      resolvedAt: isResolved ? iso(resolvedAt, offset) : undefined,
      summary: fill(scenario.summary),
    });
    sequence += 1;
  }
}

records.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

const body = records
  .map(
    (r) => `  {
    id: ${JSON.stringify(r.id)},
    referenceNumber: ${JSON.stringify(r.referenceNumber)},
    subject: ${JSON.stringify(r.subject)},
    status: ${JSON.stringify(r.status)},
    priority: ${JSON.stringify(r.priority)},
    assignedTeam: ${JSON.stringify(r.assignedTeam)},
    equipmentId: ${JSON.stringify(r.equipmentId)},
    customerId: ${JSON.stringify(r.customerId)},
    dealerId: ${JSON.stringify(r.dealerId)},
    createdAt: ${JSON.stringify(r.createdAt)},
    updatedAt: ${JSON.stringify(r.updatedAt)},
    summary: ${JSON.stringify(r.summary)},
    kind: ${JSON.stringify(r.kind)},
    unitOutOfService: ${r.unitOutOfService},
    statusChangedAt: ${JSON.stringify(r.statusChangedAt)},${
      r.resolvedAt ? `\n    resolvedAt: ${JSON.stringify(r.resolvedAt)},` : ""
    }
  },`,
  )
  .join("\n");

const file = `import type { ServiceRequest } from "@/types";

/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: node scripts/generate-service-history.mjs
 *
 * A year of closed-out service history behind the hand-written recent requests.
 * The executive metrics need a baseline to compare against and enough resolved
 * work to compute a resolution time from; a seven-week window cannot support
 * either. Volume follows the marine service year, which peaks at autumn
 * haul-out and again at spring launch.
 *
 * ${records.length} records, ${records[0].createdAt.slice(0, 10)} to ${records[records.length - 1].createdAt.slice(0, 10)}.
 */
export const generatedServiceHistory: ServiceRequest[] = [
${body}
];
`;

writeFileSync("src/data/generated-service-history.ts", file);

const byStatus = records.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }), {});
const byPriority = records.reduce((acc, r) => ({ ...acc, [r.priority]: (acc[r.priority] ?? 0) + 1 }), {});
console.log(`wrote ${records.length} records`);
console.log("status:", byStatus);
console.log("priority:", byPriority);
console.log("span:", records[0].createdAt.slice(0, 10), "->", records[records.length - 1].createdAt.slice(0, 10));
