import { create } from 'zustand';

// World state shared between R3F scene + React UI overlay.
// Synced bi-directionally with App-level `unlocked` array via setUnlocked
// passed in from <WorldShell unlocked={...} setUnlocked={...} />.
export const useWorld = create((set, get) => ({
  nearTerminal: null,           // 'gate' | 'router' | 'pipeline' | null
  activeTerminal: null,         // currently-opened overlay terminal id
  setNearTerminal: (id) => set({ nearTerminal: id }),
  openTerminal: (id) => set({ activeTerminal: id }),
  closeTerminal: () => set({ activeTerminal: null }),

  // mirror of App-level unlocked, synced via prop -> store on each render
  unlocked: [],
  setUnlocked: (u) => set({ unlocked: u }),

  // player position broadcast (so HUD can read distance, future minimap)
  playerPos: [0, 0, 0],
  setPlayerPos: (p) => set({ playerPos: p }),

  // chambers whose wall hints have been decrypted via SCAN_PAD interaction
  revealedChambers: new Set(),
  revealChamber: (id) => set((s) => {
    if (s.revealedChambers.has(id)) return {};
    const next = new Set(s.revealedChambers);
    next.add(id);
    return { revealedChambers: next };
  }),
  resetRevealedChambers: () => set({ revealedChambers: new Set() }),

  // currently-near scan pad (for HUD prompt)
  nearPad: null,
  setNearPad: (id) => set({ nearPad: id }),

  // win-sequence camera fly-through (engaged after pipeline unlock)
  flythrough: false,
  startFlythrough: () => set({ flythrough: true }),
  endFlythrough: () => set({ flythrough: false })
}));
