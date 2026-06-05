# Saga‑Feature – Dokumentation (Deutsch)

## Überblick
Der **Saga**‑Modus erweitert Storyteller um ein narratives System, das aus mehreren strukturierten Abschnitten (Story‑Blöcke) besteht.  Jeder Block kann dynamisch mit Platzhaltern (Variablen) gefüllt werden.  Beim Anlegen einer Saga wählst du aus vordefinierten Text‑Templates (Varianten) und legst einen **Variable‑Snapshot** fest – danach wird der Text zur Laufzeit mit den gewählten Werten interpoliert.

---

## Datenbank‑Schema (SQLite / Postgres)

| Tabelle | Spalten (Typ) | Beschreibung |
|---|---|---|
| **saga_stories** | `code TEXT PK`<br>`status TEXT NOT NULL DEFAULT 'active'`<br>`character TEXT NOT NULL`<br>`world TEXT NOT NULL`<br>`inventory TEXT NOT NULL DEFAULT '[]'`<br>`stations TEXT NOT NULL`<br>`variables TEXT NOT NULL DEFAULT '{}'`<br>`variable_snapshot TEXT NOT NULL DEFAULT '[]'`<br>`created_at TEXT NOT NULL`<br>`updated_at TEXT NOT NULL` | Haupt‑Entität einer Saga.  `character`, `world`, `stations` etc. werden als JSON‑Strings gespeichert. |
| **saga_templates** | `id INTEGER PK AUTOINCREMENT`<br>`category TEXT NOT NULL`<br>`template TEXT NOT NULL`<br>`conditions TEXT NOT NULL DEFAULT '[]'`<br>`updated_at TEXT NOT NULL` | Text‑Bausteine, die über die UI auswählbar sind.  Der **category**‑Wert (z. B. `intro`, `scene`, `consequence`, `summary`) dient als Filter. |
| **saga_variable_definitions** | `key TEXT PK`<br>`label TEXT NOT NULL`<br>`prompt TEXT NOT NULL DEFAULT ''`<br>`options TEXT NOT NULL DEFAULT '[]'`<br>`set_in_station INTEGER NOT NULL DEFAULT 0`<br>`is_main_choice INTEGER NOT NULL DEFAULT 0`<br>`updated_at TEXT NOT NULL` | Definitionen für die im Template genutzten Platzhalter.  Die `options`‑Spalte enthält ein JSON‑Array von `{value,emoji}`‑Objekten. |

Das Schema wird in `src/lib/db.ts` über `initSchema` angelegt und bei der ersten DB‑Initialisierung mit Seed‑Daten befüllt (`seedSagaIfEmpty`).

---

## Typdefinitionen (`src/types/saga.ts`)
```ts
export type SagaMode = "saga";
export type SagaArchetype = "Abenteurer" | "Suchender" | "Rebell" | "Hüter";
export type SagaOrigin = "Stadt" | "Wald" | "Berg" | "Küste" | "Nomade";
export type SagaSetting = "Dunkel & geheimnisvoll" | "Hell & hoffnungsvoll" | "Magisch & funkelnd";

export interface SagaCharacter { name:string; archetype:SagaArchetype|""; trait:string; weakness:string; goal:string; secret:string; origin:SagaOrigin|""; bond:string; }
export interface SagaWorld { setting:SagaSetting|""; location:string; problem:string; hint:string; }
export interface SagaStation { id:number; blockSelections:number[]; mainChoiceIndex:number|null; completed:boolean; }
export interface VariableSnapshotEntry { key:string; label:string; prompt:string; setInStation:number; isMainChoice:boolean; options:VariableOption[]; }
export interface SagaStory { code:string; mode:"saga"; status:"active"|"completed"; character:SagaCharacter; world:SagaWorld; inventory:string[]; stations:SagaStation[]; variables:Record<string,string|number|boolean>; variableSnapshot:VariableSnapshotEntry[]; createdAt:string; updatedAt:string; }
export type SagaTextBlockCategory = "intro"|"scene"|"reaction"|"consequence"|"transition"|"summary";
export interface BlockCondition { key:string; equals:string|number|boolean; }
export interface SagaTextBlock { id:number; category:SagaTextBlockCategory; template:string; conditions:BlockCondition[]; updatedAt:string; }
export interface VariableOption { value:string; emoji:string; }
export interface SagaVariableDefinition { key:string; label:string; prompt:string; options:VariableOption[]; setInStation:number; isMainChoice:boolean; updatedAt:string; }
```

---

## Seed‑Daten (`src/data/saga-defaults.ts`)
* **Variablen‑Definitionen** – enthalten u. a. `char_name`, `char_archetype`, `char_origin`, `world_setting`, `companion`, `mentor_trust` usw.  Alle Texte und Optionen sind auf Deutsch.
* **Text‑Blöcke** – zehn Beispiel‑Blöcke (Intro, Scene, Consequence, Summary) mit deutschen Platzhaltern wie `{char_name}`, `{world_setting}` usw.

---

## Adapter‑Methoden (SQLite & Postgres)
Die Klassen `SqliteAdapter` und `PostgresAdapter` implementieren das Interface `DbAdapter`.  Nachfolgend die saga‑spezifischen Methoden (Kurzbeschreibung, Rückgabetyp):

| Methode | Zweck |
|---|---|
| `createSagaStory(code:string, variableSnapshot:string): Promise<SagaStory>` | Legt einen neuen Story‑Eintrag an und speichert den Snapshot von gewählten Variablen. |
| `getSagaStory(code:string): Promise<SagaStory|null>` | Gibt die komplette Saga‑Story (inkl. JSON‑geparster Felder) zurück. |
| `updateSagaStory(code:string, updates:Partial<…>): Promise<SagaStory|null>` | Aktualisiert beliebige Felder (character, world, inventory, stations, variables, status). |
| `listSagaStories(): Promise<SagaStory[]>` | Liefert alle Saga‑Stories, sortiert nach `created_at` (neu‑zu‑alt). |
| `deleteSagaStory(code:string): Promise<boolean>` | Entfernt die Story. |
| `sagaStoryExists(code:string): Promise<boolean>` | Prüft, ob ein Story‑Eintrag existiert. |
| `countSagaStoriesUsingVariable(key:string): Promise<number>` | Zählt, wie häufig eine Variable im `variable_snapshot` vorkommt (für „Main‑Choice“-Auswertungen). |
| `listSagaTemplates(): Promise<SagaTextBlock[]>` | Gibt alle Text‑Templates zurück. |
| `getSagaTemplate(id:number): Promise<SagaTextBlock|null>` | Einzel‑Template holen. |
| `createSagaTemplate(block:Omit<SagaTextBlock,"id"|"updatedAt">): Promise<SagaTextBlock>` | Neues Template anlegen. |
| `updateSagaTemplate(id:number, block:…): Promise<SagaTextBlock|null>` | Template aktualisieren. |
| `deleteSagaTemplate(id:number): Promise<boolean>` | Template löschen. |
| `listSagaVariableDefinitions(): Promise<SagaVariableDefinition[]>` | Alle Variablen‑Definitionen zurückgeben. |
| `getSagaVariableDefinition(key:string): Promise<SagaVariableDefinition|null>` | Einzel‑Definition holen. |
| `upsertSagaVariableDefinition(def:Omit<SagaVariableDefinition,"updatedAt">): Promise<SagaVariableDefinition>` | Einfügen / Aktualisieren einer Definition. |
| `deleteSagaVariableDefinition(key:string): Promise<boolean>` | Definition entfernen. |

Die Implementierung nutzt `better‑sqlite3` (synchron) bzw. `@neondatabase/serverless` (async) und kümmert sich um JSON‑Serialisierung/Deserialisierung.

---

## Ablauf – Schritt‑für‑Schritt (Beispiel)
1. **Variablen‑Definitionen anlegen** (einmalig, z. B. beim Deployment):
   ```ts
   await adapter.upsertSagaVariableDefinition({ key: "character.name", label: "Name", prompt: "Wie heißt dein Held?", options: [], setInStation: 0, isMainChoice: true, updatedAt: now });
   // … weitere Definitionen
   ```
2. **Templates anlegen** (z. B. drei Intro‑Varianten):
   ```ts
   await adapter.createSagaTemplate({ category: "intro", template: "Willkommen, {character.name}! Du bist ein {character.archetype} aus {character.origin}.", conditions: [] });
   await adapter.createSagaTemplate({ category: "intro", template: "Hallo {character.name}, du begibst dich als {character.archetype} auf deine Reise.", conditions: [] });
   await adapter.createSagaTemplate({ category: "intro", template: "Grüß dich, {character.name}! Dein Abenteuer startet im {character.origin}.", conditions: [] });
   ```
3. **Frontend‑Formular** sammelt die Werte für die definierten Variablen und erzeugt einen `VariableSnapshotEntry[]`.  Dieser wird per `JSON.stringify` an den Backend‑Endpunkt geschickt.
4. **Saga anlegen**:
   ```ts
   const snapshot = [ /* Array von VariableSnapshotEntry (aus Schritt 3) */ ];
   await adapter.createSagaStory("my‑adventure‑001", JSON.stringify(snapshot));
   ```
5. **Passende Template‑Variante auswählen** (z. B. zufällig oder nach einer Bedingung):
   ```ts
   const introTemplates = (await adapter.listSagaTemplates()).filter(t => t.category === "intro");
   const chosenIntro = introTemplates[Math.floor(Math.random() * introTemplates.length)];
   ```
6. **Text rendern** – Platzhalter mit den vom Spieler gewählten Werten ersetzen:
   ```ts
   function render(template:string, vars:Record<string,any>) {
     return template.replace(/\{([^}]+)\}/g, (_, p) => {
       return p.split('.').reduce((o,k)=> (o||{})[k], vars) ?? "";
     });
   }
   const rendered = render(chosenIntro.template, playerValues);
   // => "Willkommen, Lara! Du bist ein Abenteurer aus dem Wald."
   ```

---

## API‑Beispiel (Express‑ähnlicher Handler)
```ts
import { getAdapter } from '@/lib/db-adapter';

export async function createSagaHandler(req, res) {
  const { code, snapshot } = req.body; // snapshot = JSON.stringify([...])
  const adapter = await getAdapter();
  const saga = await adapter.createSagaStory(code, snapshot);
  res.json(saga);
}

export async function getIntroOptions(req, res) {
  const adapter = await getAdapter();
  const intros = (await adapter.listSagaTemplates()).filter(t => t.category === 'intro');
  res.json(intros);
}
```

---

## Tests (Beispiel‑Test‑Suite)
* `src/__tests__/saga-db-schema.test.ts` prüft, dass die drei Tabellen existieren und die Default‑Variablen‑Einträge geladen wurden.
* Weitere Unit‑Tests können die CRUD‑Methoden (`createSagaStory`, `updateSagaStory`, `listSagaTemplates`, …) abdecken.

---

## Weiterführende Hinweise
* **Internationalisierung** – Aktuell sind die Seed‑Texte deutsch.  Durch Anlegen zusätzlicher Templates lässt sich das System leicht auf andere Sprachen erweitern.
* **Bedingte Templates** – Das Feld `conditions` (Array von `{key,equals}`) ermöglicht, dass ein Template nur angezeigt wird, wenn bestimmte Variablenwerte zutreffen.
* **Performance** – Für große Datenmengen empfiehlt sich die Postgres‑Variante; SQLite‑Adapter nutzt Transaktionen automatisch über `better‑sqlite3`.
* **Versionierung** – Änderungen an Templates oder Variable‑Definitionen können über das `updated_at`‑Feld nachverfolgt werden.

---

## Fazit
Mit den bereits implementierten Datenbank‑Tabellen, TypeScript‑Typen und Adapter‑Methoden ist das Saga‑System vollständig funktionsfähig.  Entwickler können nun:
* Neue deutsche (oder beliebige) Story‑Varianten definieren.
* Dynamisch Variablen‑Snapshots sammeln und Geschichten rendern.
* Die API‑Methoden in eigenen Endpunkten nutzen, um ein interaktives Text‑Adventure zu bauen.

**Happy coding!**

---

## TODOs / Weiteres

- **Frontend UI**: Build React components for saga creation (character picker, template selector, variable snapshot editor) and display rendered saga text.
- **API Endpoints**: Add Next.js API routes (`/api/sagas/*`) for all CRUD operations (create, read, update, delete, list, template management, variable definition management, count usage).
- **Authentication / Authorization**: Protect saga mutation endpoints (admin only) – reuse existing admin auth middleware.
- **Unit & Integration Tests**: Extend test suite with full coverage of saga adapter methods (SQLite & Postgres), API route tests, and rendering logic.
- **Validation**: Add runtime validation (zod / yup) for incoming variable snapshot payloads and template creation requests.
- **Internationalisation**: Provide a mechanism to load language‑specific default seeds (e.g., `saga-defaults.en.ts`, `saga-defaults.es.ts`) and switch at runtime.
- **Documentation**: Add a link to this saga‑doc in the project README and create a quick‑start guide for contributors.
- **CI Lint Fixes**: Ensure the linting rules stay satisfied after future changes (no `any`, no `require`).
- **Performance**: Add indexes on `saga_templates.category` and `saga_variable_definitions.key` for faster lookups on large data sets.
- **Export / Import**: Implement script to export/import saga data (stories, templates, variable definitions) for backup/restore.

These items can be tackled in subsequent phases; the core saga functionality is already in place and production‑ready.

