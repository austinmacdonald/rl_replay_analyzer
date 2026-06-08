import { matchesPlayerFilter } from "../utils/players.js";
import ReplayHeader from "./ReplayHeader.jsx";
import TeamSection from "./TeamSection.jsx";

export default function ReplayView({ replay, playerFilter }) {
  const isFiltered = playerFilter !== "all";

  const blueHasMatch = (replay.blue?.players || []).some((p) => matchesPlayerFilter(p, playerFilter));
  const orangeHasMatch = (replay.orange?.players || []).some((p) =>
    matchesPlayerFilter(p, playerFilter),
  );

  return (
    <div className="replay-view">
      <ReplayHeader replay={replay} playerFilter={playerFilter} />

      <div className={`teams-grid ${isFiltered ? "teams-grid-filtered" : ""}`}>
        {replay.blue && (!isFiltered || blueHasMatch) && (
          <TeamSection team={replay.blue} color="blue" playerFilter={playerFilter} />
        )}
        {replay.orange && (!isFiltered || orangeHasMatch) && (
          <TeamSection team={replay.orange} color="orange" playerFilter={playerFilter} />
        )}
      </div>
    </div>
  );
}
