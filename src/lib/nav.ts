import { createContext, useContext } from "react";

export type Route =
  | { name: "home" }
  | { name: "experiment"; resumeId?: number; missionId?: string }
  | { name: "dojo"; drillId?: string }
  | { name: "foundation"; tool?: "breath" | "reappraisal" | "worry" | "pmr" | "compassion"; experimentId?: number }
  | { name: "video" }
  | { name: "records" }
  | { name: "settings" }
  | { name: "pep"; experimentId: number };

export const NavContext = createContext<(r: Route) => void>(() => {});
export const useNav = () => useContext(NavContext);
