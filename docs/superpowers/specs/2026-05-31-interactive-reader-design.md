# Interactive Story Reader — Design Spec
**Datum:** 2026-05-31  
**Projekt:** Story Maker (Storytelling Workshop Tool)  
**Status:** Approved

---

## Kontext

Schüler schreiben interaktive Geschichten mit dem Story Maker. Jede fertige Geschichte hat 6 Stationen, wobei Stationen 1–5 je 2–3 Entscheidungen mit Konsequenzen enthalten (Diamond-Pattern). Station 6 hat keine Entscheidungen.

Bisher gibt es nur eine statische Übersicht (`/story/[code]/view`), die alle Stationen und Entscheidungen linear auflistet. Ziel ist ein echter interaktiver Reader, bei dem Leser die Geschichte Station für Station durchspielen und echte Entscheidungen treffen — mit unterschiedlichem Textverlauf je nach Wahl.

---

## Ziel

Jede abgeschlossene Geschichte kann über den 4-stelligen Code interaktiv gelesen werden. Leser spielen die Geschichte durch, treffen Entscheidungen, sehen deren Konsequenzen, und erhalten am Ende eine Zusammenfassung ihres individuellen Weges.

---

## Routing & Datenfluss

### Routenübersicht

| URL | Zweck | Zugang |
|-----|-------|--------|
| `/` | Startseite, Code-Eingabe | alle |
| `/story/[code]` | Weiterleitung (Editor oder Reader) | alle |
| `/story/[code]/read` | Interaktiver Reader (**neu**) | alle mit Code |
| `/story/[code]/view` | Statische Übersicht + PDF | Admin-Board |

### Redirect-Logik in `/story/[code]/page.tsx`

```
Status = active   →  /story/[code]         (Editor, unverändert)
Status = completed →  /story/[code]/read    (Reader, neu — war /view)
```

Die statische `/view`-Route bleibt bestehen und ist weiterhin aus dem Admin-Board verlinkt (für PDF-Export und Übersicht).

### Datenabruf

Neuer API-Endpunkt: `GET /api/stories/[code]/ink-json`

- Lädt Story aus DB
- Führt `compileToInk(story)` server-seitig aus
- Kompiliert Ink-Quelltext → Story-JSON via `inkjs.Compiler`
- Gibt `{ json: string }` zurück

Vorteil: Browser-Kompatibilität garantiert (Node.js-Compiler läuft nur server-seitig). Client lädt fertiges JSON und instantiiert `new Story(json)`.

---

## Reader UX — Buchseiten-Stil

### Seitenstruktur

```
┌─────────────────────────────────────┐
│  Story Maker          CODE: K7M2    │  sticky header
│  ● ● ● ○ ○ ○                        │  6-Punkte-Fortschrittsleiste
├─────────────────────────────────────┤
│                                     │
│  I. RUFF ZUM ABENTEUER              │  Stationstitel (aktuell)
│                                     │
│  [Konsequenz der vorherigen Wahl]   │  Amber-Box (nur ab Station 2)
│                                     │
│  Lena stand vor dem alten Turm...   │  Station-Text
│                                     │
│  ┌─────────────────────────────┐    │
│  │  ▸ Sie betritt den Turm     │    │  Choice-Buttons
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │  ▸ Sie ruft um Hilfe        │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

### Seite nach Wahl

```
┌─────────────────────────────────────┐
│  II. ZÖGERN                         │
│                                     │
│  ┌─ Deine Wahl: ──────────────────┐ │  Amber-Box oben
│  │  Sie betrat den Turm           │ │
│  │  Die Treppe knarrte laut...    │ │  Konsequenztext
│  └────────────────────────────────┘ │
│                                     │
│  [Station 2 Haupttext]              │
│                                     │
│  [Choice-Buttons Station 2]         │
└─────────────────────────────────────┘
```

### Zusammenfassung (nach Station 6)

```
┌─────────────────────────────────────┐
│  🌟 DEIN WEG DURCH DIE GESCHICHTE  │
│                                     │
│  I.  Ruf zum Abenteuer              │
│      → Sie betrat den Turm          │
│  II. Zögern                         │
│      → Sie bat den Alten um Rat     │
│  III. Mentor                        │
│      → Sie nahm das Amulett         │
│  IV.  Erste Prüfung                 │
│      → Sie löste das Rätsel         │
│  V.   Höhepunkt                     │
│      → Sie konfrontierte den König  │
│                                     │
│  [📄 Als PDF exportieren]           │
│  [🔄 Nochmal lesen]                 │
└─────────────────────────────────────┘
```

### UX-Details

- **Keine Animationen** — Text erscheint sofort, keine Tipp-Effekte
- **Choice-Buttons:** Amber-Rahmen, min. 56px Höhe, volle Breite, iPad-optimiert
- **Fortschrittsleiste:** 6 Punkte im Header, aktueller Punkt ausgefüllt amber
- **Konsequenz-Box:** Amber-Hintergrund (leicht), zeigt gewähltes Label + Konsequenztext
- **Kein Zurück** — einmal gewählt, keine Rückkehr (sonst würde das Ink-State korrumpiert)
- **Refresh = Neustart** — kein persistenter Lesezustand (für Workshop ausreichend)

---

## Zustandsmaschine (`StoryReader.tsx`)

```typescript
type ReaderState =
  | { phase: "loading" }
  | { phase: "reading"; stationIndex: number; pendingConsequence?: string }
  | { phase: "summary"; choicesMade: ChoiceMade[] }
  | { phase: "error"; message: string }

interface ChoiceMade {
  stationId: number;
  stationTitle: string;
  choiceLabel: string;
}
```

### Ink-Ausführungsschleife

```
1. Lade JSON via /api/stories/[code]/ink-json
2. Instantiiere new Story(json)
3. Sammle Text mit story.Continue() bis story.canContinue === false
4. Wenn story.currentChoices.length > 0:
     → phase = "reading", zeige Text + Choices
5. Benutzer wählt index i:
     → speichere ChoiceMade (Label merken vor dem choose())
     → story.choose(i)
     → weiter sammeln (Konsequenztext + nächste Station)
     → update stationIndex, pendingConsequence = Konsequenztext
6. Wenn !story.canContinue && choices.length === 0:
     → phase = "summary"
```

---

## Neue & geänderte Dateien

| Datei | Typ | Beschreibung |
|-------|-----|--------------|
| `src/app/story/[code]/read/page.tsx` | **neu** | Server-Komponente, lädt Story + Status-Check |
| `src/components/StoryReader.tsx` | **neu** | Komplette Reader-UI + Ink-Zustandsmaschine |
| `src/app/api/stories/[code]/ink-json/route.ts` | **neu** | Kompiliert Ink → JSON, gibt `{ json }` zurück |
| `src/app/story/[code]/page.tsx` | **ändern** | Redirect completed → `/read` statt `/view` |

### Unverändert

- `src/components/StoryView.tsx` — bleibt für Admin-Board
- `src/app/story/[code]/view/page.tsx` — bleibt für Admin + PDF
- `src/lib/inkCompiler.ts` — wird server-seitig wiederverwendet
- Bestehende API-Routen

---

## Fehlerbehandlung

| Fehler | Verhalten |
|--------|-----------|
| Story nicht gefunden | Redirect → `/` |
| Story noch aktiv (nicht fertig) | Redirect → `/story/[code]` (Editor) |
| Ink-Kompilierung schlägt fehl | `phase = "error"`, zeigt statische Fallback-Ansicht (StoryView) |
| Leere Station (kein Text) | Ink-Compiler überspringt sie via `-> station_N+1`, Reader zeigt sie nicht |
| Netzwerkfehler beim JSON-Laden | Fehlermeldung + "Erneut versuchen"-Button |

---

## Was nicht gebaut wird (YAGNI)

- Kein persistenter Lesezustand (kein localStorage, kein Server-Tracking)
- Kein "Zurück"-Button im Reader
- Keine Animationen oder Tipp-Effekte
- Keine Mehrsprachigkeit
- Keine Statistiken (wer hat was gelesen)
