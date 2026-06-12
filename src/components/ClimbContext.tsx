"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useRef,
} from "react";
import { soundEngine } from "@/lib/soundEngine";
import { type Zone } from "./zoneTypes";

export type { Zone };

export const ZONE_LABELS: Record<Zone, string> = {
  hero: "Trailhead",
  about: "Base Camp",
  skills: "Gear Wall",
  projects: "Summit Log",
  gallery: "Trail Markers",
  contact: "Summit",
};

const ALL_ZONES: Zone[] = ["hero", "about", "skills", "projects", "gallery", "contact"];

export interface InspectProject {
  title: string;
  status: string;
  tags: string[];
  description: string;
}

export interface ClimbState {
  bootStage: "loading" | "booting" | "ready";
  currentZone: Zone | null;
  altitude: number; // 0-8000
  zonesDiscovered: Set<Zone>;
  checkpoints: Set<Zone>; // zones where the user spent meaningful time
  commandsRun: Set<string>;
  strawberries: Set<string>;
  fallCount: number;
  resilienceBonus: number;
  summitReached: boolean;
  goldenStrawberry: boolean;
  lastReaction: { type: string; payload?: unknown; timestamp: number } | null;
  lastInspect: InspectProject | null;
  soundEnabled: boolean;
  soundVolume: number; // 0.0 - 1.0
}

type Action =
  | { type: "SET_BOOT_STAGE"; stage: ClimbState["bootStage"] }
  | { type: "SET_ZONE"; zone: Zone; altitude: number }
  | { type: "RECORD_COMMAND"; cmd: string }
  | { type: "RECORD_STRAWBERRY"; id: string }
  | { type: "RECORD_FALL" }
  | { type: "TRIGGER_REACTION"; reactionType: string; payload?: unknown }
  | { type: "SET_SUMMIT_REACHED" }
  | { type: "SET_GOLDEN_STRAWBERRY" }
  | { type: "MARK_CHECKPOINT"; zone: Zone }
  | { type: "RESET_CLIMB" }
  | { type: "HYDRATE"; payload: Partial<ClimbState> }
  | { type: "INSPECT_PROJECT"; project: InspectProject }
  | { type: "SET_SOUND_ENABLED"; enabled: boolean }
  | { type: "TOGGLE_SOUND" }
  | { type: "SET_SOUND_VOLUME"; volume: number };

const STORAGE_KEY = "summit-climb-state";

function getInitialState(): ClimbState {
  return {
    bootStage: "loading",
    currentZone: null,
    altitude: 0,
    zonesDiscovered: new Set(),
    checkpoints: new Set(),
    commandsRun: new Set(),
    strawberries: new Set(),
    fallCount: 0,
    resilienceBonus: 0,
    summitReached: false,
    goldenStrawberry: false,
    lastReaction: null,
    lastInspect: null,
    soundEnabled: true,
    soundVolume: 0.6,
  };
}

function loadPersisted(): Partial<ClimbState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      zonesDiscovered: Array.isArray(parsed.zonesDiscovered)
        ? new Set(parsed.zonesDiscovered as Zone[])
        : new Set(),
      checkpoints: Array.isArray(parsed.checkpoints)
        ? new Set(parsed.checkpoints as Zone[])
        : new Set(),
      commandsRun: Array.isArray(parsed.commandsRun)
        ? new Set(parsed.commandsRun as string[])
        : new Set(),
      strawberries: Array.isArray(parsed.strawberries)
        ? new Set(parsed.strawberries as string[])
        : new Set(),
      fallCount: typeof parsed.fallCount === "number" ? parsed.fallCount : 0,
      goldenStrawberry: !!parsed.goldenStrawberry,
      soundEnabled: typeof parsed.soundEnabled === "boolean" ? parsed.soundEnabled : true,
      soundVolume: typeof parsed.soundVolume === "number" ? Math.max(0, Math.min(1, parsed.soundVolume)) : 0.6,
    };
  } catch {
    return {};
  }
}

function reducer(state: ClimbState, action: Action): ClimbState {
  switch (action.type) {
    case "SET_BOOT_STAGE":
      return { ...state, bootStage: action.stage };

    case "SET_ZONE": {
      const nextZones = new Set(state.zonesDiscovered);
      nextZones.add(action.zone);
      return {
        ...state,
        currentZone: action.zone,
        altitude: action.altitude,
        zonesDiscovered: nextZones,
      };
    }

    case "RECORD_COMMAND": {
      const nextCommands = new Set(state.commandsRun);
      nextCommands.add(action.cmd);
      return { ...state, commandsRun: nextCommands };
    }

    case "RECORD_STRAWBERRY": {
      const nextStrawberries = new Set(state.strawberries);
      nextStrawberries.add(action.id);
      return { ...state, strawberries: nextStrawberries };
    }

    case "RECORD_FALL":
      return {
        ...state,
        fallCount: state.fallCount + 1,
        resilienceBonus: state.resilienceBonus + 1,
      };

    case "TRIGGER_REACTION":
      return {
        ...state,
        lastReaction: {
          type: action.reactionType,
          payload: action.payload,
          timestamp: Date.now(),
        },
      };

    case "SET_SUMMIT_REACHED":
      return { ...state, summitReached: true };

    case "MARK_CHECKPOINT": {
      const next = new Set(state.checkpoints);
      next.add(action.zone);
      return { ...state, checkpoints: next };
    }

    case "SET_GOLDEN_STRAWBERRY":
      return { ...state, goldenStrawberry: true };

    case "INSPECT_PROJECT":
      return { ...state, lastInspect: action.project };

    case "SET_SOUND_ENABLED":
      return { ...state, soundEnabled: action.enabled };

    case "TOGGLE_SOUND":
      return { ...state, soundEnabled: !state.soundEnabled };

    case "SET_SOUND_VOLUME":
      return { ...state, soundVolume: Math.max(0, Math.min(1, action.volume)) };

    case "RESET_CLIMB":
      return {
        ...getInitialState(),
        bootStage: state.bootStage,
      };

    case "HYDRATE":
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

interface ClimbContextValue extends ClimbState {
  setBootStage: (stage: ClimbState["bootStage"]) => void;
  setZone: (zone: Zone, altitude: number) => void;
  recordCommand: (cmd: string) => void;
  recordStrawberry: (id: string) => void;
  recordFall: () => void;
  triggerReaction: (type: string, payload?: unknown) => void;
  checkGoldenStrawberry: () => boolean;
  setSummitReached: () => void;
  markCheckpoint: (zone: Zone) => void;
  resetClimb: () => void;
  inspectProject: (project: InspectProject) => void;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  setSoundVolume: (volume: number) => void;
}

const ClimbContext = createContext<ClimbContextValue | null>(null);

export function ClimbProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, getInitialState());

  useEffect(() => {
    const persisted = loadPersisted();
    if (Object.keys(persisted).length > 0) {
      dispatch({ type: "HYDRATE", payload: persisted });
    }
  }, []);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          zonesDiscovered: Array.from(state.zonesDiscovered),
          checkpoints: Array.from(state.checkpoints),
          commandsRun: Array.from(state.commandsRun),
          strawberries: Array.from(state.strawberries),
          fallCount: state.fallCount,
          goldenStrawberry: state.goldenStrawberry,
          soundEnabled: state.soundEnabled,
          soundVolume: state.soundVolume,
        })
      );
    } catch {
      // noop
    }
  }, [
    state.zonesDiscovered,
    state.checkpoints,
    state.commandsRun,
    state.strawberries,
    state.fallCount,
    state.goldenStrawberry,
    state.soundEnabled,
    state.soundVolume,
  ]);

  useEffect(() => {
    soundEngine.setMuted(!state.soundEnabled, state.soundVolume);
  }, [state.soundEnabled, state.soundVolume]);

  const setBootStage = useCallback(
    (stage: ClimbState["bootStage"]) => dispatch({ type: "SET_BOOT_STAGE", stage }),
    []
  );

  const setZone = useCallback(
    (zone: Zone, altitude: number) => dispatch({ type: "SET_ZONE", zone, altitude }),
    []
  );

  const recordCommand = useCallback(
    (cmd: string) => dispatch({ type: "RECORD_COMMAND", cmd }),
    []
  );

  const recordStrawberry = useCallback(
    (id: string) => dispatch({ type: "RECORD_STRAWBERRY", id }),
    []
  );

  const recordFall = useCallback(() => dispatch({ type: "RECORD_FALL" }), []);

  const triggerReaction = useCallback(
    (type: string, payload?: unknown) =>
      dispatch({ type: "TRIGGER_REACTION", reactionType: type, payload }),
    []
  );

  const setSummitReached = useCallback(
    () => dispatch({ type: "SET_SUMMIT_REACHED" }),
    []
  );

  const markCheckpoint = useCallback(
    (zone: Zone) => dispatch({ type: "MARK_CHECKPOINT", zone }),
    []
  );

  const resetClimb = useCallback(() => dispatch({ type: "RESET_CLIMB" }), []);

  const inspectProject = useCallback(
    (project: InspectProject) => dispatch({ type: "INSPECT_PROJECT", project }),
    []
  );

  const setSoundEnabled = useCallback(
    (enabled: boolean) => dispatch({ type: "SET_SOUND_ENABLED", enabled }),
    []
  );

  const toggleSound = useCallback(() => dispatch({ type: "TOGGLE_SOUND" }), []);

  const setSoundVolume = useCallback(
    (volume: number) => dispatch({ type: "SET_SOUND_VOLUME", volume }),
    []
  );

  const checkGoldenStrawberry = useCallback(() => {
    const s = stateRef.current;
    const hasAllZones = ALL_ZONES.every((z) => s.zonesDiscovered.has(z));
    const enoughCommands = s.commandsRun.size >= 5;
    const hasAllCheckpoints = ALL_ZONES.every((z) => s.checkpoints.has(z));
    const eligible = hasAllZones && hasAllCheckpoints && enoughCommands && s.summitReached;
    if (eligible && !s.goldenStrawberry) {
      dispatch({ type: "SET_GOLDEN_STRAWBERRY" });
    }
    return eligible;
  }, []);

  const value: ClimbContextValue = {
    ...state,
    setBootStage,
    setZone,
    recordCommand,
    recordStrawberry,
    recordFall,
    triggerReaction,
    checkGoldenStrawberry,
    setSummitReached,
    markCheckpoint,
    resetClimb,
    inspectProject,
    setSoundEnabled,
    toggleSound,
    setSoundVolume,
  };

  return <ClimbContext.Provider value={value}>{children}</ClimbContext.Provider>;
}

export function useClimb() {
  const ctx = useContext(ClimbContext);
  if (!ctx) {
    throw new Error("useClimb must be used within a ClimbProvider");
  }
  return ctx;
}
