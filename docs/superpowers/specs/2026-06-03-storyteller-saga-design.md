# Storyteller Saga — Design Spec
**Datum:** 2026-06-03
**Projekt:** Storyteller (Storytelling Workshop Tool)
**Status:** Approved

---

## Kontext

Der bestehende Storyteller (V1) ist ein freies Schreibtool: Schüler füllen leere Textfelder pro Station, mit Diamant-Pattern für Entscheidungen. In Workshops hat sich gezeigt, dass manche Schüler mehr **Leitplanken** brauchen — eine stärkere Führung durch die Geschichte, mehr **Entscheidungsdichte**, und Hilfe bei der **Figur-Ausgestaltung**.

„Storyteller Saga" ist ein zweiter Modus im selben System, der diese Lücke schließt: geführtes Schreiben mit vorformulierten Textbausteinen, vielen Mikro-Entscheidungen und Variablen, die sich durch die Vorgaben des Autors konsistent im Text anpassen. Beide Modi bleiben aufrufbar auf der Startseite.

---

## Modus-Konzept

Zwei eigenständige Schreibmodi:

- **Storyteller** (V1, bestehend) — Freies Schreiben mit 6-Stationen-Diamant-Pattern. Bleibt **voll funktionsfähig und unverändert**.
- **Storyteller Saga** (neu) — Geleitetes Schreiben mit Figur-Ausgestaltung, vorformulierten Bausteinen, 3 Mikro-Entscheidungen + 1 Groß-Entscheidung pro Station, und 19 Variablen, die per Platzhalter in die Bausteine eingesetzt werden.

**Trennprinzip:**

- Eigene Story-Entität, eigener Code-Pool, eigene API-Routen, eigener Editor, eigener Reader, eigener Ink-Compiler
- Geteilt: Auth, Datenbank-Adapter, Admin-Board, Auto-Save-Mechanik, Layout, Config

**Code-Systeme:**

- Storyteller: 4 Zeichen (A–Z, 0–9), unverändert
- Saga: 5 Zeichen (A–Z, 0–9)
- Kollisionen zwischen den Pools sind mathematisch ausgeschlossen

**Startseite — Zwei Karten:**

```
┌──────────────────────────┐  ┌──────────────────────────┐
│ STORYTELLER              │  │ STORYTELLER SAGA         │
│ Schreib dein Abenteuer   │  │ Erlebe eine geführte     │
│ frei und offen.          │  │ Geschichte mit vielen    │
│                          │  │ Entscheidungen.          │
│ [Neue Geschichte]        │  │ [Neue Geschichte]        │
│ [Code öffnen]   _ _ _ _  │  │ [Code öffnen]  _ _ _ _ _ │
└──────────────────────────┘  └──────────────────────────┘
```

Jede Karte hat eigene Buttons für „Neue Geschichte starten" und eigenes Code-Eingabefeld (4 vs. 5 Felder). Der Switcher entsteht durch die räumliche Trennung.

---

## Datenmodell

### SagaStory

```ts
interface SagaStory {
  code: string;                    // 5 Zeichen
  mode: "saga";                    // Discriminator
  status: "active" | "completed";
  character: SagaCharacter;
  world: SagaWorld;
  inventory: string[];
  variables: Record<string, string | number | boolean>;  // 19 Variablen
  stations: SagaStation[];         // 6 Stationen
  variableSnapshot: VariableSnapshotEntry[];  // bei Erstellung kopiert
  createdAt: string;
  updatedAt: string;
}
```

### SagaCharacter (8 Felder)

```ts
interface SagaCharacter {
  name: string;
  archetype: "Abenteurer" | "Suchender" | "Rebell" | "Hüter";
  trait: string;                  // kurze Eigenart
  weakness: string;
  goal: string;
  secret?: string;
  origin: "Stadt" | "Wald" | "Berg" | "Küste" | "Nomade";
  bond: string;                   // an wen/was hängt der Charakter?
}
```

### SagaWorld (4 Felder)

```ts
interface SagaWorld {
  setting: "Dunkel & geheimnisvoll" | "Hell & hoffnungsvoll" | "Magisch & funkelnd";
  location: string;               // genauer Ort
  problem: string;
  hint: string;                   // Freitext-Stichworte
}
```

### SagaStation (pro Station 1 Groß + 3 Mikros)

```ts
interface SagaStation {
  id: number;                     // 1-6
  blockSelections: number[];      // IDs der gewählten Bausteine (für 3 Mikros)
  mainChoiceIndex: number | null; // 0 oder 1 (Groß-Entscheidung)
  completed: boolean;
}

interface SagaMainChoice {
  id: number;
  label: string;
  consequenceBlockId: number;
}

interface SagaMicroChoice {
  id: number;
  prompt: string;                 // Frage
  options: SagaMicroOption[];
}

interface SagaMicroOption {
  id: number;
  label: string;
  emoji?: string;
  blockId: number;                // -> Textbaustein
  setsVariable?: { key: string; value: string | number | boolean };
}
```

### SagaTextBlock + SagaVariableDefinition (DB-pflegbar, admin-editierbar)

```ts
interface SagaTextBlock {
  id: number;
  category: "intro" | "scene" | "reaction" | "consequence" | "transition" | "summary";
  template: string;               // enthält {platzhalter}
  conditions?: BlockCondition[];
  updatedAt: string;
}

interface SagaVariableDefinition {
  key: string;                    // z.B. "amulett_name"
  label: string;                  // UI-Label
  prompt: string;                 // Mikro-Frage
  options: VariableOption[];
  setInStation: number;
  isMainChoice: boolean;
  updatedAt: string;
}

interface VariableOption {
  value: string;                  // bildhafte Werte
  emoji?: string;
}
```

### Variable-Snapshot (Schutz vor Template-Änderungen)

```ts
interface VariableSnapshotEntry {
  key: string;
  label: string;
  prompt: string;
  setInStation: number;
  isMainChoice: boolean;
  options: VariableOption[];
}
```

Wird beim Erstellen der Story kopiert. Alte Stories bleiben stabil, auch wenn die Lehrkraft die Variable später umbenennt oder löscht.

---

## 19 Variablen (bildhafte Werte)

Alle Variablen tragen **bildhafte, lebendige Werte** statt technischer Identifier. Beispiele:

- `amulett_name = "das schimmernde Mondamulett"` (nicht `has_amulett = true`)
- `char_emotion = "ein kaltes Kribbeln im Bauch"` (nicht `emotion = "fear"`)
- `mentor_trust = "vertraut dir blind"` (nicht `trust = 2`)

Vollständige Liste (Defaults im Seed, alle Optionen im Admin editierbar):

| # | Key | Gesetzt in | Beispielwerte (Auszug) |
|---|---|---|---|
| 1 | `char_name` | Charakter-Sheet | (Freitext) |
| 2 | `char_archetype` | Charakter-Sheet | „die Abenteurerin" / „der Suchende" / „die Rebellin" / „der Hüter" |
| 3 | `char_origin` | Charakter-Sheet | „aus der staubigen Hafenstadt" / „vom Rand des Nebelwalds" / … |
| 4 | `char_trait` | Charakter-Sheet | (Freitext, kurz) |
| 5 | `char_weakness` | Charakter-Sheet | (Freitext) |
| 6 | `char_goal` | Charakter-Sheet | (Freitext) |
| 7 | `char_secret` | Charakter-Sheet | (Freitext, optional) |
| 8 | `char_bond` | Charakter-Sheet | (Freitext) |
| 9 | `companion` | Mikro S1 | „der schlaue Fuchs mit den bernsteinfarbenen Augen" / „die kluge Krähe mit den scharfen Federn" / „der kleine Roboter Piep" |
| 10 | `char_emotion` | Mikro S2 | „ein kaltes Kribbeln im Bauch" / „Feuer in der Brust" / „Ruhig wie ein tiefer See" |
| 11 | `world_setting` | Charakter-Sheet | (3 Werte s. SagaWorld) |
| 12 | `world_location` | Charakter-Sheet | (Freitext) |
| 13 | `amulett_name` | Mikro S3 | „das schimmernde Mondamulett" / „der Splitter der Sterne" / „die wärmende Feder" |
| 14 | `map_name` | Mikro S1 | „eine verblasste Lederkarte" / „die Karte aus dem Traum" / „nichts dabei" |
| 15 | `lamp_name` | Mikro S3 | „die alte Laterne" / „der leuchtende Splitter" / „nichts dabei" |
| 16 | `mentor_trust` | Groß S3 | „vertraut dir blind" / „ist vorsichtig" / „zweifelt an dir" |
| 17 | `riddle_solved` | Groß S4 | „das Rätsel ist gelöst" / „du stehst hilflos davor" |
| 18 | `confrontation_style` | Groß S5 | „direkt und mutig" / „listig und vorsichtig" / „mitfühlend und klug" |
| 19 | `stations_completed` | System | (Zahl, automatisch) |

Lehrkraft kann im Admin Variablen ergänzen, Werte-Optionen ändern, Keys umbenennen oder löschen.

---

## Mikro-Verteilung pro Station

| Station | Mikros (3) | Groß-Entscheidung | Setzt Variable |
|---|---|---|---|
| 1: Ruf | Wähle deinen **Begleiter** | (entfällt) | `companion` |
| | Wie reagiert dein Charakter? | | `char_emotion` (Start) |
| | Was findest du am Anfang? | | `map_name` |
| 2: Weigerung | Was hält dich zurück? | (Groß: Gehst du los?) | `refusal_reason` (im Admin angelegt) |
| | Wer zweifelt an dir? | | `doubter` (im Admin angelegt) |
| | Welche Laune hat die Welt? | | `world_setting` (vertieft) |
| 3: Mentor | Wer hilft dir? | (Groß: Vertraut der Mentor dir?) | `mentor_trust` |
| | Was schenkt er dir? | | `amulett_name` |
| | Welches Licht findest du? | | `lamp_name` |
| 4: Prüfung | Welche Prüfung? | (Groß: Lösbar?) | `riddle_solved` |
| | Wer trickst? | | `trickster` (im Admin angelegt) |
| | Was fühlst du jetzt? | | `char_emotion` (Höhepunkt-Stimmung) |
| 5: Höhepunkt | Womit trittst du an? | (Groß: Wie konfrontierst du?) | `confrontation_style` |
| | Was sagt dein Begleiter? | | `companion_reaction` (im Admin angelegt) |
| | Was ist dein Trumpf? | | `secret_used` (im Admin angelegt) |
| 6: Rückkehr | Was nimmst du mit? | (entfällt) | `takeaway_item` (im Admin angelegt) |
| | Wen triffst du zuerst? | | `reunion` (im Admin angelegt) |
| | Was hat dich verändert? | | `transformation` (im Admin angelegt) |

Groß-Entscheidung in Stationen 2–5. Station 1 hat **keine** Groß-Entscheidung (alle 3 Mikros — Begleiter-Wahl, Start-Emotion, Fundstück — bestimmen den Einstieg). Pfadvariablen werden beim Kompilieren zu Ink-`->`-Sprüngen in den passenden Baustein übersetzt.

---

## UX-Mechaniken (Spaß + Kindgerechtigkeit)

### Mikro-Klick-Flow (Emoji-Karten)

```
1. Schüler sieht 2-3 Karten nebeneinander
2. Klick auf eine Karte
   → Karten-Spalte kollabiert auf die gewählte
   → BlockRevealOverlay zeigt 2 Sekunden den Baustein-Text (groß)
   → Variable wird gesetzt
   → LiveInventory aktualisiert sich
   → Auto-Save triggert
3. Schüler geht zur nächsten Mikro-Karte
```

Jede Option hat Emoji + fettem Label. Schüler **muss** wählen (kein Skip).

### Live-Inventar-Sidebar (linke Spalte)

- „🎒 Deine Schätze" — alle ausgewählten Items als Karten
- „💛 Deine Gefühle" — `char_emotion`
- „🤝 Vertraute" — `mentor_trust`, `companion`
- „✨ Eigenschaften" — `char_archetype`, `char_origin`

Wird mit jeder Mikro-Wahl live aktualisiert. Macht Variablen für Schüler **sichtbar als Story-Elemente**.

### Fortschritts-Anzeige + Konfetti

- Oben im Editor: „3 von 18 Karten gesammelt!" mit Fortschritts-Balken
- Bei Stations-Abschluss: 2-Sekunden-Konfetti-Animation
- Bei Station 6 Abschluss: „Dein Abenteuer ist komplett!" + größerer Effekt
- Respektiert `prefers-reduced-motion`

### Textbaustein-Animation

- Beim Klick auf eine Mikro-Karte: Vollbild-Overlay mit dem Baustein-Text, große Schrift, 2 Sekunden sichtbar, dann sanftes Ausblenden
- Schüler **sieht**, was er gerade „eingesammelt" hat

### Automatischer Story-Titel

- Wird beim Kompilieren aus Variablen zusammengesetzt
- Template: z.B. `"{char_name} und die {amulett_name/map_name}-Geschichte"`
- Beispiel: „Lina und das Mondamulett", „Der Suchende aus dem Nebelwald"
- Mehrere Templates, Zufallsauswahl — konfigurierbar im Admin

---

## Routen, Dateien, Datenbank

### Neue Routen

```
/                                          (ändern — Karten-Switcher)
/saga/[code]                               (NEU — Editor-Wrapper)
/saga/[code]/read                          (NEU — Saga-Reader)
/saga/[code]/view                          (NEU — optional, statische Ansicht)
/api/saga                                  (NEU — POST: neue Saga-Story)
/api/saga/[code]                           (NEU — GET, PUT)
/api/saga/[code]/ink-json                  (NEU — Ink-Compile)
/api/saga/[code]/complete                  (NEU — POST: status → completed)
/api/saga-templates                        (NEU — GET, POST)
/api/saga-templates/[id]                   (NEU — GET, PUT, DELETE)
/api/saga-variables                        (NEU — GET, POST)
/api/saga-variables/[key]                  (NEU — GET, PUT, DELETE)
/admin                                     (ändern — Tabs Stories / Saga-Stories / Templates)
/admin/templates                           (NEU — Template-Editor)
```

### Neue & geänderte Dateien

```
src/
├── app/
│   ├── page.tsx                            (ändern — Karten-Switcher)
│   ├── saga/                               (NEU)
│   ├── api/saga*/                          (NEU)
│   ├── api/saga-templates/                 (NEU)
│   ├── api/saga-variables/                 (NEU)
│   ├── admin/page.tsx                      (ändern)
│   ├── admin/templates/page.tsx            (NEU)
│
├── components/
│   ├── Home/ModeCard.tsx                   (NEU)
│   ├── Home/ModeSwitcher.tsx               (NEU)
│   ├── saga/
│   │   ├── SagaEditor.tsx                  (NEU)
│   │   ├── SagaCharacterSheet.tsx          (NEU)
│   │   ├── SagaWorldSheet.tsx              (NEU)
│   │   ├── SagaStationEditor.tsx           (NEU)
│   │   ├── MicroChoiceCard.tsx             (NEU)
│   │   ├── MainChoiceCard.tsx              (NEU)
│   │   ├── BlockRevealOverlay.tsx          (NEU)
│   │   ├── ProgressBar.tsx                 (NEU)
│   │   ├── LiveInventory.tsx               (NEU)
│   │   ├── TitlePreview.tsx                (NEU)
│   │   ├── SagaReader.tsx                  (NEU)
│   │   ├── SagaView.tsx                    (NEU, optional)
│   ├── admin/
│   │   ├── TemplateEditor.tsx              (NEU)
│   │   ├── VariableEditor.tsx              (NEU)
│   │   ├── PlaceholderValidator.tsx        (NEU)
│
├── lib/
│   ├── db-adapter.ts                       (erweitern: Saga-Methoden)
│   ├── sagaStories.ts                      (NEU)
│   ├── sagaInkCompiler.ts                  (NEU)
│   ├── sagaTemplates.ts                    (NEU)
│   ├── codeGenerator.ts                    (erweitern: 5-Zeichen)
│   ├── config.ts                           (erweitern: Saga-Defaults)
│
├── data/
│   ├── saga-defaults.ts                    (NEU — Seed-Daten)
│
├── types/
│   ├── saga.ts                             (NEU — alle Saga-Typen)
```

### Datenbank-Migration

- Pi (SQLite): 3 neue Tabellen — `saga_stories`, `saga_templates`, `saga_variable_definitions`
- Vercel (Postgres): dieselben 3 Tabellen
- DB-Adapter bekommt je eine Implementierung pro Engine
- Bestehende V1-Tabellen bleiben unangetastet

---

## Template-Editor (Lehrkraft im Admin)

Eigener Bereich `/admin/templates`:

- **Tab „Variablen"**: Liste aller Variablen-Definitionen, sortiert nach `setInStation`. Pro Variable: Label, Prompt, Optionen, Hauptentscheidung ja/nein. Klick öffnet Formular. „Neue Variable"-Button. Validierung: Schlüssel muss `[a-z_]+` matchen, eindeutig, Werte nicht leer.
- **Tab „Textbausteine"**: Liste aller Bausteine, Filter nach Kategorie. Klick öffnet Editor mit großem Textarea. Live-Validierung: unbekannte Platzhalter werden rot markiert; Liste aller verfügbaren Platzhalter wird unter dem Textarea angezeigt. „Neuer Baustein"-Button.
- **Bedingungen** (`conditions`) als Liste von Key-Value-Vergleichen pro Baustein.
- **Validierung beim Speichern:**
  - Unbekannte Platzhalter in Templates → Warnung, Speichern erlaubt
  - Zwei Variablen mit gleichem Key → blockiert
  - Variable gelöscht, aber in Bausteinen referenziert → Warnung mit Liste

**Lösch-Workflow mit Story-Schutz:**

1. Lehrkraft klickt „Variable löschen"
2. System zeigt Liste betroffener Stories + Liste betroffener Bausteine
3. Bestätigungsdialog: „X Stories und Y Bausteine benutzen diese Variable. Force löschen?"
4. Bei „Force löschen": Variable wird aus DB entfernt. Betroffene Stories behalten ihre Snapshot-Werte, neu erstellte Stories kennen die Variable nicht. Bausteine behalten Platzhalter; Substitution ergibt leeren String, wenn Variable nicht im Snapshot.
5. Lehrkraft muss zweimal klicken („Endgültig löschen") für Force-Confirm.

---

## Auto-Save-Mechanik

Wird von V1 wiederverwendet: 500ms Debounce + bei Stationswechsel. Wird jetzt pro Mikro-Klick, pro Groß-Entscheidung, pro Charakter-Feld-Eingabe getriggert. PUT /api/saga/[code] mit `{ character, world, stations, inventory, variables, variableSnapshot }`.

---

## Ink-Compiler (Saga)

Server-seitige `compileSagaToInk(story, templates, variableDefinitions)` baut Ink-Code:

1. Variablen-Snapshot aus Story laden
2. Pro Station: 3 Mikros + 1 Groß in Ink-Knoten
3. Groß-Entscheidung → `* [Label]` mit Konsequenz-Block, dann `-> station_N+1` oder `-> path_block_X`
4. Pfadvariablen → bedingte `->`-Sprünge zwischen Bausteinen
5. Variablen in Templates via `{varname}` ersetzen (nicht gesetzte → leer oder Default)
6. `inkjs.Compiler` kompiliert zu JSON
7. Browser lädt JSON, instantiiert `new Story(json)`

Story-Snapshot hat Vorrang, fehlende Werte fallen auf aktuelle Variablen-Defaults zurück.

---

## Tests (Jest)

- `sagaInkCompiler.test.ts` — Platzhalter-Substitution, Bedingungen, Snapshot-Fallback
- `sagaStories.test.ts` — CRUD, 5-Zeichen-Code-Generierung, Kollisionen
- `sagaTemplates.test.ts` — Bausteine, Variablen, Force-Delete-Workflow
- `SagaEditor` Smoke-Test (Komponente rendert, Mikros funktionieren)
- `MicroChoiceCard` Test (Klick → Variable setzen → Animation)
- `PlaceholderValidator` Test (unbekannte Platzhalter werden markiert)
- `codeGenerator.test.ts` — 5-Zeichen-Code, Konflikt mit 4-Zeichen-Code ausgeschlossen

**E2E (Playwright):**

- Saga-Flow: Startseite → Karten-Klick → Charakter ausfüllen → 3 Mikros Station 1 → Groß-Entscheidung → Station 2–5 durchspielen → Abschließen → Reader
- Template-Editor: Admin-Login → /admin/templates → neue Variable anlegen → in Baustein referenzieren → validieren → löschen mit Force-Bestätigung

---

## Fehlerbehandlung

| Fehler | Verhalten |
|---|---|
| 5-Zeichen-Code nicht gefunden | Redirect → `/` mit Toast „Geschichte nicht gefunden" |
| Saga-Story noch active, Reader aufgerufen | Redirect → `/saga/[code]` (Editor) |
| Saga-Ink-Compiler schlägt fehl | Editor zeigt Banner mit Compile-Fehler + Link zur Station; Reader fällt auf statische `SagaView` zurück |
| 5-Zeichen-Code-Kollision | Server retryt max. 3× mit neuem Code, dann `503` an Client; Client zeigt „Erneut versuchen"-Button |
| Mikro nicht gewählt beim Versuch, Station abzuschließen | Button bleibt disabled, Hinweis „Wähle erst alle 3 Karten" |
| Variable gelöscht, aber in Bausteinen referenziert | Beim Speichern Warnung mit Liste; bei Force-Löschung: betroffene Bausteine behalten Platzhalter, Substitution ergibt leeren String |
| Baustein gelöscht, aber in Mikro-Option referenziert | Mikro-Option zeigt „(Baustein fehlt)" und ist nicht wählbar |
| Snapshot-Mismatch bei alter Story | Story lädt mit ihren Snapshot-Werten, kein Bruch |
| Force-Delete mit >0 betroffenen Stories | Bestätigungsdialog zeigt Anzahl + Liste; Aktion benötigt zweites Klicken auf „Endgültig löschen" |
| Konfetti-Bibliothek fehlt im Build | Konfetti-Animation übersprungen, Station-Wechsel funktioniert trotzdem |
| BlockRevealOverlay > 2 Sekunden (langer Baustein) | Animation läuft auf 4 Sek, dann automatisches Ausblenden |

---

## Sicherheit

- **Auth**: Kein Schüler-Login, Code = einzige Zugangsmethode. Code-Spaces getrennt (4 vs. 5 Zeichen verhindert Cross-Mode-Zugriff).
- **Admin-Auth**: Bestehendes Admin-Passwort deckt Template-Editor ab. Neue Routen `/api/saga-templates/*` und `/api/saga-variables/*` checken `adminAuth` serverseitig.
- **Input-Validierung auf Server:**
  - Story-Name max. 80 Zeichen, Freitext-Felder max. 500 Zeichen
  - Variablen-Keys: nur `[a-z_]+`
  - Baustein-Templates: max. 2000 Zeichen
  - Variable-Options-Werte: max. 200 Zeichen
- **XSS-Schutz**: Alle Textbausteine durch `escapeInkString` (analog V1) escaped. UI nutzt React-Defaults (auto-escaped), kein `dangerouslySetInnerHTML` in Saga-Komponenten.
- **CSRF**: Next.js Server-Actions + JSON-Body mit `Content-Type: application/json` (analog V1).

---

## Performance

- **Code-Generierung**: 36⁵ = 60.466.176 Möglichkeiten. Lookup < 5ms, Kollisionsrate vernachlässigbar bei Workshop-Größe.
- **Bausteine laden**: Templates bei Story-Start einmal vom Server laden, clientseitig in Map cachen. Beim Auto-Save nicht erneut laden.
- **LiveInventory-Updates**: Memoized, nur Re-Render bei Variablen-Änderung.
- **Konfetti**: 2-Sekunden-Animation, requestAnimationFrame, max. 60 Partikel. Bei `prefers-reduced-motion` deaktiviert.
- **BlockRevealOverlay**: CSS-Transition, keine JS-Animation.
- **Ink-Compile**: Server-seitig, nur bei Reader-Aufruf. < 200ms für 2000 Zeichen × 30 Bausteine.
- **DB**: 3 neue Tabellen, keine Migration auf V1-Daten. Story-Snapshot als JSON-Spalte in `saga_stories`.

---

## Was die Spec abdeckt vs. was offen bleibt

**In der Spec dokumentiert:**

- Zwei getrennte Modi mit eigenen Codes, Datenstrukturen, Routen
- 19 Variablen + Emoji-Karten-Mikros + 1 Groß-Entscheidung pro Station
- 4 Spaß-Mechaniken (Fortschritt, Live-Inventar, Block-Animation, Auto-Titel)
- DB-pflegbarer Template-Editor im Admin mit Story-Snapshot-Schutz
- Tests + E2E

**Nicht in der Spec (macht Lehrkraft im Admin nachträglich):**

- Konkrete Emoji-Auswahl pro Variable
- Konkrete Bausteine (Texte)
- Mehrere Story-Titel-Templates

**Bewusst nicht gebaut (YAGNI):**

- Keine Mehrsprachigkeit
- Kein PDF-Export im Saga-Reader
- Kein Story-Sharing zwischen Schülern
- Kein Live-Multiplayer
- Keine Animationen über die vier spezifizierten hinaus
- Kein Export der Templates als JSON/Datei (nur in DB)
- Kein Versioning der Templates (jede Änderung überschreibt)
- Kein Story-Migrations-Tool für V1 → Saga
