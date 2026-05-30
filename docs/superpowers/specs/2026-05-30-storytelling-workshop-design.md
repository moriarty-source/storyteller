# Storytelling Workshop Tool — Design Spec
**Datum:** 2026-05-30  
**Kontext:** Kulturkino Storytelling-Workshop, Klassen 6 & 7, ca. 3 Zeitstunden  
**Zielgruppe:** Schüler (11–12 Jahre), Arbeit auf iPads  

---

## Überblick

Ein browserbasiertes Web-Tool, mit dem Schüler angeleitete interaktive Geschichten schreiben. Die Geschichten basieren auf einer vereinfachten Heldenreise und werden durch grafische UI-Elemente (kein Code sichtbar) erstellt. Unter der Haube generiert das Tool Ink-Code via `inkjs`.

---

## Story-Struktur & Phasen

### Phase 1 — Welt & Figur (frei)
Strukturiertes Charakter-Sheet, kein Wortlimit:

- **Welt:** Freitextfelder für Weltbeschreibung und zentrales Problem
- **Figur:**
  - Name (Freitext)
  - Stärke (Auswahl: Mutig / Schlau / Einfühlsam / Stark)
  - Schwäche (Freitext)
  - Ziel (Freitext)
  - Geheimnis (Freitext, optional)

Diese Daten werden zu Ink-Variablen und sind während der gesamten Geschichte als sticky Charakter-Karte sichtbar.

### Phase 2 — Geleitete Heldenreise (7 Stationen)

| Station | Name | Standard Wortlimit |
|---|---|---|
| 1 | Ruf zum Abenteuer | 120 Wörter |
| 2 | Weigerung / Zögern | 150 Wörter |
| 3 | Mentor / Hilfe | 150 Wörter |
| 4 | Erste Prüfung | 200 Wörter |
| 5 | Höhepunkt | 240 Wörter |
| 6 | Rückkehr | 150 Wörter |

Konsequenztexte (pro Choice): 60 Wörter

Die Limits sind progressiv gestaltet: Schüler starten kurz, gewinnen Sicherheit, und haben beim Höhepunkt den meisten Raum.

---

## Entscheidungs-Mechanik (Diamant-Prinzip)

Jede Station folgt diesem Muster:

```
Haupttext (Wortlimit)
     ↓
Choice A → Konsequenz A (60 Wörter)
Choice B → Konsequenz B (60 Wörter)
[Choice C optional → Konsequenz C]
     ↓
Alle Pfade → nächste Station (Gather)
```

- 2–3 Choices pro Station
- Choices werden erst aktiv, wenn der Haupttext mindestens 60 Wörter hat
- Bei 80% des Wortlimits: sanfter Hinweis "Arbeite auf eine Entscheidung hin!"

In Ink:
```ink
=== station_4 ===
Lena stand vor der Brücke...

* [Sie geht über die Brücke]
  Die Brücke knarzt gefährlich...
* [Sie sucht einen anderen Weg]
  Im Dickicht entdeckt sie...
- -> station_5
```

---

## Inventar-System

- Schüler können jederzeit per "Gegenstand gefunden!"-Button Objekte ins Inventar hinzufügen
- Inventar erscheint als Ink-Variable und ist in späteren Choices nutzbar
- Wird permanent in der Charakter-Karte angezeigt

---

## UI-Layout (iPad-optimiert)

```
┌──────────────────────────────────────────────────────┐
│  STORY MAKER               K7M2      [Speichern ✓]   │
├──────────┬───────────────────────────┬───────────────┤
│          │                           │               │
│ Charakt. │  STATION (Titel)          │ Fortschritt   │
│ -Karte-  │  ─────────────────────    │ 1 ●           │
│          │  Tipp + [Mehr Hilfe ▼]    │ 2 ●           │
│ 🎒 Inv.  │                           │ 3 ●           │
│          │  [Textfeld]               │ 4 ◉ ← aktuell │
│          │  📝 87 / 200 Wörter       │ 5 ○           │
│          │                           │ 6 ○           │
│          │  [Entscheidungen]         │               │
└──────────┴───────────────────────────┴───────────────┘
```

- **Links:** Sticky Charakter-Karte + Inventar
- **Mitte:** Aktuelle Station — Tipp, Textfeld, Wordcounter, Choices
- **Rechts:** Stations-Fortschritt (Punkte)
- Story-Code **K7M2** permanent sichtbar im Header (Großbuchstaben + Zahlen)
- Alle Touch-Targets iPad-freundlich

---

## Story-Lifecycle & Code-System

### Landing Page
```
[ Neue Geschichte starten ]

── oder ──

Code eingeben: [ _ ][ _ ][ _ ][ _ ]
               [ Öffnen ]
```

### Lifecycle
```
Neu erstellt → [In Bearbeitung] → Admin markiert "Abgeschlossen" → [Nur-Lese + PDF]
```

- **In Bearbeitung:** Schüler kann jederzeit weiter editieren
- **Abgeschlossen:** Schön formatierte Leseansicht + PDF-Export-Button
- Code ist immer die einzige Zugangsmethode — kein Login

### Abgeschlossen-Ansicht
Formatierte Geschichte mit:
- Titel (Figurenname + "Abenteuer")
- Welt-Beschreibung
- Charakter-Sheet + Inventar
- Alle Stationen mit Choices als eingerückte Äste
- PDF-Export-Button

---

## Admin-Board (`/admin`)

Zugänglich via Passwort. Enthält:

- Tabelle aller Geschichten (Code, Figurname, Fortschritt, letzte Aktivität)
- Link zum Öffnen jeder Geschichte
- Button "Abschließen" pro Geschichte
- **Konfigurierbare Wort-Limits** (gelten sofort für alle aktiven Geschichten):
  - Wortlimit pro Station einstellbar
  - Konsequenz-Wortlimit einstellbar

---

## Auto-Save

- Debounced: 500ms nach letzter Eingabe
- Zusätzlich: bei jedem Stationswechsel
- Visuelles Feedback im Header: "Speichern ✓" / "Speichert..."

---

## PDF-Export

- Generiert via `react-pdf` direkt im Browser
- Formatierte Geschichte: Überschriften, Fließtext, Choices als Äste
- Erster Export-Versuch nach "Abgeschlossen"-Markierung durch Admin

---

## Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | Next.js (App Router) |
| Story-Engine | inkjs (offizielle JS-Runtime) |
| Datenbank | SQLite (via Prisma oder better-sqlite3) |
| PDF-Export | react-pdf |
| Hosting (initial) | Raspberry Pi, lokales Netzwerk (`http://192.168.x.x:3000`) |
| Hosting (später) | Vercel (optional) |

---

## Datenstruktur

```typescript
Story {
  code: string          // 4-stellig, z.B. "K7M2" — Primary Key
  status: "active" | "completed"
  character: {
    name: string
    strength: "Mutig" | "Schlau" | "Einfühlsam" | "Stark"
    weakness: string
    goal: string
    secret?: string
  }
  world: {
    description: string
    problem: string
  }
  inventory: string[]
  stations: Station[]
  createdAt: DateTime
  updatedAt: DateTime
}

Station {
  id: number            // 1–6
  text: string
  choices: Choice[]
  completed: boolean
}

Choice {
  label: string
  consequence: string
}

Config {                // Global, vom Admin anpassbar
  wordLimits: {
    station1: 120
    station2: 150
    station3: 150
    station4: 200
    station5: 240
    station6: 150
    consequence: 60
  }
  adminPassword: string
}
```

---

## Offene Punkte / Später

- Flowchart-Visualisierung der Verzweigungen (als optionales End-Feature)
- Ink-Code-Ansicht für Lehrer ("Schaut, das ist die Magie dahinter!")
- Migration zu Vercel + Postgres bei Bedarf
