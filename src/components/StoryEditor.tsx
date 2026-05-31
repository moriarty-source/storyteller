"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Story, Character, World, Station, WordLimits } from "@/types/story";
import { STATIONS } from "@/types/story";
import CharacterSheet from "@/components/CharacterSheet";
import StationEditor from "@/components/StationEditor";
import CharacterCard from "@/components/CharacterCard";
import InventoryPanel from "@/components/InventoryPanel";
import StationProgress from "@/components/StationProgress";
import SaveIndicator from "@/components/SaveIndicator";

interface StoryEditorProps {
  story: Story;
  wordLimits: WordLimits;
}

type SaveStatus = "saved" | "saving" | "error";

function getWordLimit(limits: WordLimits, stationId: number): number {
  const key = `station${stationId}` as keyof WordLimits;
  return (limits[key] as number) ?? 120;
}

export default function StoryEditor({ story: initialStory, wordLimits }: StoryEditorProps) {
  const [currentStation, setCurrentStation] = useState<number>(0);
  const [character, setCharacter] = useState<Character>(initialStory.character);
  const [world, setWorld] = useState<World>(initialStory.world);
  const [stations, setStations] = useState<Station[]>(initialStory.stations);
  const [inventory, setInventory] = useState<string[]>(initialStory.inventory);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storyCode = initialStory.code;

  // ── Save logic ─────────────────────────────────────────────────────────────
  const saveStory = useCallback(async (
    charOverride?: Character,
    worldOverride?: World,
    stationsOverride?: Station[],
    inventoryOverride?: string[],
  ) => {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/stories/${storyCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: charOverride ?? character,
          world: worldOverride ?? world,
          stations: stationsOverride ?? stations,
          inventory: inventoryOverride ?? inventory,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }, [storyCode, character, world, stations, inventory]);

  function scheduleAutoSave(
    charOverride?: Character,
    worldOverride?: World,
    stationsOverride?: Station[],
    inventoryOverride?: string[],
  ) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveStory(charOverride, worldOverride, stationsOverride, inventoryOverride);
    }, 500);
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // ── State updaters with auto-save ──────────────────────────────────────────
  function handleCharacterChange(newChar: Character) {
    setCharacter(newChar);
    scheduleAutoSave(newChar, world, stations, inventory);
  }

  function handleWorldChange(newWorld: World) {
    setWorld(newWorld);
    scheduleAutoSave(character, newWorld, stations, inventory);
  }

  function handleStationChange(updated: Station) {
    const newStations = stations.map((s) => (s.id === updated.id ? updated : s));
    setStations(newStations);
    scheduleAutoSave(character, world, newStations, inventory);
  }

  function handleAddInventoryItem(item: string) {
    const newInventory = [...inventory, item];
    setInventory(newInventory);
    scheduleAutoSave(character, world, stations, newInventory);
  }

  function handleRemoveInventoryItem(index: number) {
    const newInventory = inventory.filter((_, i) => i !== index);
    setInventory(newInventory);
    scheduleAutoSave(character, world, stations, newInventory);
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  async function navigateToStation(targetId: number) {
    // Save immediately before switching stations
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    await saveStory();

    // Mark current station as completed when moving forward from it
    if (currentStation >= 1 && targetId > currentStation) {
      const newStations = stations.map((s) =>
        s.id === currentStation ? { ...s, completed: true } : s
      );
      setStations(newStations);
    }

    setCurrentStation(targetId);
  }

  function handleCharacterSheetComplete() {
    navigateToStation(1);
  }

  function handleStationNext() {
    if (currentStation < 6) {
      // Mark current station completed
      const newStations = stations.map((s) =>
        s.id === currentStation ? { ...s, completed: true } : s
      );
      setStations(newStations);
      navigateToStation(currentStation + 1);
    }
  }

  function handleStationBack() {
    if (currentStation > 1) {
      navigateToStation(currentStation - 1);
    } else if (currentStation === 1) {
      navigateToStation(0);
    }
  }

  function handleStationClick(id: number) {
    navigateToStation(id);
  }

  // ── Computed ───────────────────────────────────────────────────────────────
  const showSidebar = currentStation >= 1;
  const currentStationData = stations.find((s) => s.id === currentStation);
  const currentStationMeta = STATIONS.find((m) => m.id === currentStation);
  const isLastStation = currentStation === 6;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: "var(--color-bg-muted)" }}
    >
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm"
      >
        <div className="flex items-center gap-3">
          {/* Sidebar toggle on narrow screens */}
          {showSidebar && (
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label={sidebarOpen ? "Sidebar ausblenden" : "Sidebar einblenden"}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors lg:hidden"
            >
              <span className="text-lg" aria-hidden="true">☰</span>
            </button>
          )}
          <h1
            className="text-sm font-black uppercase tracking-[0.3em] select-none"
            style={{ color: "var(--color-text)" }}
          >
            Story Maker
          </h1>
        </div>

        <span
          className="font-mono text-xl font-extrabold tracking-widest"
          style={{ color: "var(--color-amber)" }}
          aria-label={`Story-Code: ${storyCode}`}
        >
          {storyCode}
        </span>

        <SaveIndicator status={saveStatus} />
      </header>

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ── */}
        {showSidebar && (
          <aside
            className={[
              "flex flex-col gap-3 border-r border-gray-200 bg-white px-3 py-4 overflow-y-auto",
              // On smaller screens respect toggle; on lg always show
              sidebarOpen ? "block" : "hidden",
              "lg:block",
              // Fixed width
              "w-52 shrink-0",
            ].join(" ")}
          >
            <CharacterCard character={character} />
            <InventoryPanel
              items={inventory}
              onAddItem={handleAddInventoryItem}
              onRemoveItem={handleRemoveInventoryItem}
            />
          </aside>
        )}

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto">
          {currentStation === 0 && (
            <CharacterSheet
              character={character}
              world={world}
              onCharacterChange={handleCharacterChange}
              onWorldChange={handleWorldChange}
              onComplete={handleCharacterSheetComplete}
            />
          )}

          {currentStation >= 1 && currentStationData && currentStationMeta && (
            <div className="flex flex-col h-full">
              <StationEditor
                station={currentStationData}
                meta={currentStationMeta}
                wordLimit={getWordLimit(wordLimits, currentStation)}
                consequenceLimit={wordLimits.consequence}
                onStationChange={handleStationChange}
                previousStationText={
                  currentStation > 1
                    ? stations.find((s) => s.id === currentStation - 1)?.text
                    : undefined
                }
                previousStationTitle={
                  currentStation > 1
                    ? STATIONS.find((m) => m.id === currentStation - 1)?.title
                    : undefined
                }
                onAddInventoryItem={handleAddInventoryItem}
              />

              {/* Navigation buttons */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleStationBack}
                  className={[
                    "rounded-2xl border-2 border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600",
                    "hover:border-gray-300 hover:text-gray-800 transition-colors duration-150",
                    "min-h-[44px]",
                  ].join(" ")}
                >
                  ← Zurück
                </button>

                {!isLastStation && (
                  <button
                    type="button"
                    onClick={handleStationNext}
                    className={[
                      "rounded-2xl px-6 py-2.5 text-sm font-bold text-white",
                      "shadow-sm hover:brightness-105 active:scale-95",
                      "transition-all duration-150 min-h-[44px]",
                    ].join(" ")}
                    style={{ background: "var(--color-amber)" }}
                  >
                    Weiter →
                  </button>
                )}

                {isLastStation && (
                  <button
                    type="button"
                    onClick={async () => {
                      // Mark station 6 completed and save stations
                      const newStations = stations.map((s) =>
                        s.id === 6 ? { ...s, completed: true } : s
                      );
                      setStations(newStations);
                      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                      await saveStory(character, world, newStations, inventory);
                      // Mark story as completed — single combined update to avoid race
                      const res = await fetch(`/api/stories/${storyCode}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          status: "completed",
                          stations: newStations,
                        }),
                      });
                      if (!res.ok) {
                        setSaveStatus("error");
                        return;
                      }
                      window.location.href = `/story/${storyCode}/view`;
                    }}
                    className={[
                      "rounded-2xl px-6 py-2.5 text-sm font-bold text-white",
                      "shadow-sm hover:brightness-105 active:scale-95",
                      "transition-all duration-150 min-h-[44px]",
                    ].join(" ")}
                    style={{ background: "var(--color-indigo)" }}
                  >
                    Geschichte abschließen ✓
                  </button>
                )}
              </div>
            </div>
          )}
        </main>

        {/* ── Right progress sidebar ── */}
        <aside
          className="shrink-0 border-l border-gray-200 bg-white w-20 overflow-y-auto"
          aria-label="Stations-Fortschritt"
        >
          <StationProgress
            stations={stations}
            currentStation={currentStation}
            onStationClick={handleStationClick}
          />
        </aside>
      </div>
    </div>
  );
}
