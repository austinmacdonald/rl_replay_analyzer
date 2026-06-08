const LABELS = {
  // core
  shots: "Shots",
  shots_against: "Shots Against",
  goals: "Goals",
  goals_against: "Goals Against",
  saves: "Saves",
  assists: "Assists",
  score: "Score",
  mvp: "MVP",
  shooting_percentage: "Shoot %",

  // boost
  bpm: "Boost/Min",
  bcpm: "Collected/Min",
  avg_amount: "Avg Boost",
  amount_collected: "Collected",
  amount_stolen: "Stolen",
  amount_collected_big: "Big Pads Collected",
  amount_stolen_big: "Big Pads Stolen",
  amount_collected_small: "Small Pads Collected",
  amount_stolen_small: "Small Pads Stolen",
  count_collected_big: "Big Pad Pickups",
  count_stolen_big: "Big Pads Stolen (count)",
  count_collected_small: "Small Pad Pickups",
  count_stolen_small: "Small Pads Stolen (count)",
  amount_overfill: "Overfill",
  amount_overfill_stolen: "Overfill Stolen",
  amount_used_while_supersonic: "Used While Supersonic",
  time_zero_boost: "Time at 0 Boost",
  percent_zero_boost: "0 Boost %",
  time_full_boost: "Time at 100 Boost",
  percent_full_boost: "100 Boost %",
  time_boost_0_25: "Time 0–25%",
  time_boost_25_50: "Time 25–50%",
  time_boost_50_75: "Time 50–75%",
  time_boost_75_100: "Time 75–100%",
  percent_boost_0_25: "0–25% %",
  percent_boost_25_50: "25–50% %",
  percent_boost_50_75: "50–75% %",
  percent_boost_75_100: "75–100% %",

  // movement
  avg_speed: "Avg Speed",
  total_distance: "Total Distance",
  time_supersonic_speed: "Supersonic Time",
  time_boost_speed: "Boost Speed Time",
  time_slow_speed: "Slow Speed Time",
  time_ground: "Ground Time",
  time_low_air: "Low Air Time",
  time_high_air: "High Air Time",
  time_powerslide: "Powerslide Time",
  count_powerslide: "Powerslides",
  avg_powerslide_duration: "Avg Powerslide",
  avg_speed_percentage: "Avg Speed %",
  percent_slow_speed: "Slow %",
  percent_boost_speed: "Boost Speed %",
  percent_supersonic_speed: "Supersonic %",
  percent_ground: "Ground %",
  percent_low_air: "Low Air %",
  percent_high_air: "High Air %",

  // positioning
  avg_distance_to_ball: "Avg Dist to Ball",
  avg_distance_to_ball_possession: "Dist to Ball (possession)",
  avg_distance_to_ball_no_possession: "Dist to Ball (no possession)",
  avg_distance_to_mates: "Avg Dist to Teammates",
  time_defensive_third: "Defensive Third",
  time_neutral_third: "Neutral Third",
  time_offensive_third: "Offensive Third",
  time_defensive_half: "Defensive Half",
  time_offensive_half: "Offensive Half",
  time_behind_ball: "Behind Ball",
  time_infront_ball: "In Front of Ball",
  time_most_back: "Most Back",
  time_most_forward: "Most Forward",
  time_closest_to_ball: "Closest to Ball",
  time_farthest_from_ball: "Farthest from Ball",
  goals_against_while_last_defender: "GA as Last Defender",
  percent_defensive_third: "Defensive Third %",
  percent_offensive_third: "Offensive Third %",
  percent_neutral_third: "Neutral Third %",
  percent_defensive_half: "Defensive Half %",
  percent_offensive_half: "Offensive Half %",
  percent_behind_ball: "Behind Ball %",
  percent_infront_ball: "In Front %",
  percent_most_back: "Most Back %",
  percent_most_forward: "Most Forward %",
  percent_closest_to_ball: "Closest %",
  percent_farthest_from_ball: "Farthest %",

  // demo
  inflicted: "Demos Inflicted",
  taken: "Demos Taken",

  // ball (team)
  possession_time: "Possession Time",
  time_in_side: "Time in Side",
};

const SECTION_TITLES = {
  core: "Core",
  boost: "Boost",
  movement: "Movement",
  positioning: "Positioning",
  demo: "Demos",
  ball: "Ball",
};

export function humanizeKey(key) {
  return LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatValue(key, value) {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (key.startsWith("percent_") || key === "shooting_percentage" || key === "avg_speed_percentage") {
    return `${Number(value).toFixed(1)}%`;
  }

  if (key.startsWith("time_") && !key.includes("percent")) {
    return `${Number(value).toFixed(1)}s`;
  }

  if (key.includes("distance") || key === "total_distance") {
    return Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  if (Number.isInteger(value) || Number(value) === Math.floor(Number(value))) {
    return Number(value).toLocaleString();
  }

  return Number(value).toFixed(2);
}

export function statsToRows(statsObject) {
  if (!statsObject || typeof statsObject !== "object") return [];
  return Object.entries(statsObject).map(([key, value]) => ({
    key,
    label: humanizeKey(key),
    value: formatValue(key, value),
  }));
}

export function getSectionTitle(section) {
  return SECTION_TITLES[section] || section;
}

export const STAT_SECTIONS = ["core", "boost", "movement", "positioning", "demo"];
