import { LeadershipCommandCentre } from "./CommandCentre";
import { createLeadershipComponents } from "./createLeadershipComponents";

export function LeadershipCommandCentreEntry({ dependencies, ...props }) {
  return (
    <LeadershipCommandCentre
      {...props}
      components={createLeadershipComponents(dependencies)}
      helpers={{
        fmtAgo: dependencies.fmtAgo,
      }}
    />
  );
}
