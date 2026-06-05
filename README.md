# 🌍 GEOPOLITIK — Neon Command

> *Ein strategisches Echtzeit-Strategiespiel über Diplomatie, Krieg und nukleare Abschreckung.*

Geopolitik ist ein im Browser spielbares Echtzeit-Strategiespiel mit Retro-Neon-Ästhetik. Wähle eine Nation, baue deine Wirtschaft auf, schließe Bündnisse, führe Spionagemissionen durch — und entscheide, ob du die Welt durch Diplomatie rettest oder in den Nuklearwinter stürzt.

![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?logo=javascript&logoColor=black)
![Canvas](https://img.shields.io/badge/HTML5_Canvas-2D-E34F26?logo=html5&logoColor=white)

---

## 🎮 So spielst du

### Installation & Start

```bash
# Repository klonen
git clone https://github.com/Ruddat/neoncommand.git
cd neoncommand

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
# → http://localhost:3000

# Produktions-Build erstellen
npm run build
# → Ausgabe in dist/
```

### Voraussetzungen

- Moderner Browser (Chrome, Firefox, Edge, Safari)
- Web Audio API Unterstützung (für Sound & Musik)
- Canvas 2D Unterstützung
- MP3-Audiodateien im Ordner `public/audio/`

---

## ⌨️ Steuerung

### Tastaturbefehle

| Taste | Aktion |
|-------|--------|
| `1` | **Fabrik** bauen (60$) — generiert Einkommen |
| `2` | **Militärbasis** bauen (80$) — steigert Militärstärke |
| `3` | **Forschungslab** bauen (70$) — steigert Technologie |
| `4` | **Abwehrsystem** bauen (100$) — erhöht Verteidigung |
| `5` | **Raketensilo** bauen (150$) — ermöglicht Angriffe |
| `6` | **Spionage-HQ** bauen (120$) — ermöglicht Spionage |
| `D` | **Diplomatie-Modus** (20$ pro Aktion) — Beziehungen verbessern |
| `K` | **Angriffs-Modus** — Raketen auf feindliche Nation abschießen |
| `X` | **Spionage-Modus** — Spionagemission gegen eine Nation starten |
| `U` | **Upgrade-Modus** — Gebäude auf Level 3 verbessern |
| `M` | **Musik** an/aus schalten |
| `R` | **Neustart** — Zurück zur Nationenauswahl |

### Maussteuerung

- **Linksklick** auf der Karte: Ausgewähltes Gebäude platzieren (im Baumanus)
- **Linksklick** auf Nation: Im D/K/X-Modus mit der Nation interagieren
- **Startbildschirm**: Nation durch Klick auswählen

### Bauleiste

Am unteren Bildschirmrand gibt es zusätzlich klickbare Buttons für alle Gebäude und Aktionen (D, K, X, U).

---

## 🏗️ Gebäude

Alle Gebäude können auf **maximal Level 3** aufgerüstet werden. Upgrade-Kosten: `Baukosten × aktuelles Level × 0.8`.

| Gebäude | Symbol | Farbe | Kosten | Effekt |
|---------|--------|-------|--------|--------|
| **Fabrik** | `$` | Gold | 60$ | +15$/s Einkommen pro Level |
| **Militärbasis** | `M` | Rot | 80$ | +0.5 Mil/s Wachstum pro Level, +3 Mil beim Bau |
| **Forschungslab** | `T` | Blau | 70$ | +2 Tech/s pro Level |
| **Abwehrsystem** | `D` | Grün | 100$ | +5 Verteidigung pro Level, +5 beim Bau |
| **Raketensilo** | `R` | Lila | 150$ | +15 Offensivkraft pro Level, +15 beim Bau |
| **Spionage-HQ** | `S` | Pink | 120$ | +1 Spion pro Level, aktiviert X-Modus |

**Bauregeln:**
- Gebäude müssen innerhalb von **180px** des eigenen Nationszentrums platziert werden
- Mindestabstand **25px** zwischen Gebäuden
- Geister-Vorschau am Mauszeiger (grün = gültig, rot = ungültig)

---

## 🌐 Nationen

| Nation | Flagge | Persönlichkeit | Stärken | Start-Alliierte |
|--------|--------|---------------|---------|-----------------|
| **USA** | 🇺🇸 | Aggressiv | Militär, High-Tech (Mil 9, Eco 8, Tech 9) | EU, Ukraine |
| **Europa** | 🇪🇺 | Diplomatisch | Wirtschaft, Diplomatie (Mil 6, Eco 9, Tech 8) | USA, Ukraine |
| **Russland** | 🇷🇺 | Aggressiv | Atomwaffen, rohe Gewalt (Mil 8, Eco 4, Tech 5) | China |
| **China** | 🇨🇳 | Expansiv | Produktion, Cyber-Krieg (Mil 7, Eco 8, Tech 7) | Russland |
| **Ukraine** | 🇪🇦 | Defensiv | Widerstand, Verteidigung (Mil 5, Eco 3, Tech 5) | EU, USA |

Jede Nation hat unterschiedliche Startwerte für Militär, Wirtschaft und Technologie, sowie eine einzigartige KI-Persönlichkeit, die ihre Bau- und Verhaltensstrategie bestimmt.

---

## ⚔️ Kampfsystem

### Angriffe der KI auf den Spieler

- Ausgelöst wenn Feindseligkeit > 60 (Wahrscheinlichkeit = Feindseligkeit/200) oder > 80 (30% Chance)
- Angriffsstärke = `KI-Militär × (1 + Runde×0.04) + Zufall(5,15)`
- Animierter Raketenstart mit bis zu 8 Raketen
- **Schadensberechnung:** Schaden = max(0, Stärke - Verteidigung × 1.5)
  - Schaden > 0: Geldverlust = Schaden × 8, Militärverlust = Schaden × 0.3
  - Schaden > 20: Zufälliges Gebäude wird zerstört
  - Schaden > 30: Bildschirm-Riss-Effekt + Nuklearzähler steigt
  - Schaden = 0: Angriff abgewehrt, Feindseligkeit -5

### Spieler-Angriff (K-Taste)

- Mindestens 1 Raketensilo erforderlich (Offensivkraft > 0)
- **5 Sekunden Abklingzeit** zwischen Angriffen
- Startet `min(6, Offensivkraft/15 + 1)` Raketen
- +15 Feindseligkeit beim Ziel pro Angriff
- Zerstört ein zufälliges KI-Gebäude bei Treffer
- **Kettenreaktion:** Ziele-Alliierte werden wütend (+10), eigene Alliierte profitieren (-5)
- Jeder Angriff erhöht den globalen Nuklearzähler

### Automatischer Gegenangriff

Wenn der Spieler Offensivkraft > 0 hat und Schaden nimmt, wird automatisch ein Gegenangriff mit Stärke = Offensivkraft × 0.8 gestartet.

### KI gegen KI

- 15% + Runde×1% Wahrscheinlichkeit pro Zug
- Nur zwischen nicht-alliierten KI-Nationen
- Kann KI-Gebäude zerstören

---

## 🤝 Diplomatie & Beziehungen

### Feindseligkeits-System

Jede Nation hat einen Feindseligkeitswert (0–100) gegenüber dem Spieler:

| Wert | Status | Farbe |
|------|--------|-------|
| 0–8 | Freundlich / Alliiert | Grün |
| 8–30 | Neutral | Gelb |
| 30–60 | Spannung | Orange |
| 60+ | Feindselig | Rot |

**Feindseligkeit verändert sich durch:**
- Natürlicher Anstieg: +0.8/s (Nicht-Alliierte), +0.1/s (Alliierte)
- Alliierten-Zerfall: -2.5/s
- Diplomatie-Aktion (D-Taste): -18 Feindseligkeit bei Nicht-Alliierten, -8 bei Alliierten
- Angriffe: +15 pro Angriff
- Spionage: Je nach Missionsergebnis (siehe unten)
- Nuklearwinter: +1/s für alle Nationen

### Bündnisse

- Wenn Feindseligkeit unter **8** sinkt, wird die Nation automatisch ein **Alliiert**
- Wenn Alliierten-Feindseligkeit über **75** steigt, brechen sie das Bündnis (mit Sirene und EMP-Blitz)
- Alliierte gewähren **Handelsbonusse** und **Passiveinkommen**
- **Handelsrouten** werden als animierte grüne gepunktete Linien mit fließenden Punkten dargestellt

---

## 🕵️ Spionage-System

Das Spionage-System wird durch den Bau von Spionage-HQs freigeschaltet (Taste `6`). Mit der Taste `X` wird der Spionage-Modus aktiviert. Klicke auf eine Nation, um eine Mission zu starten.

**8 Sekunden Abklingzeit** zwischen Missionen. Spionpower = Anzahl der Spionage-HQs (inklusive Level).

| Wahrscheinlichkeit | Ergebnis | Effekt |
|-------------------|----------|--------|
| 0–35% | **Sabotage** | Zerstört zufälliges KI-Gebäude; +10 Feindseligkeit; KI verliert Stats |
| 35–60% | **Intel sammeln** | Zeigt KI-Stats (Mil, Def, Off, Geld, Tech, Gebäude); -8×Spionpower Feindseligkeit |
| 60–80% | **Geld stehlen** | Erhalte 30 + Spionpower×20 + Zufall(0,40)$; -5 Feindseligkeit |
| 80–100% | **Erwischt!** | +15 Feindseligkeit; "SPION ERWISCHT!" Banner; Sirenen-Sound |

---

## ☢️ Nuklearwinter

Wenn **3 Atomwaffen** weltweit abgefeuert wurden, bricht der Nuklearwinter aus. Dies ist **irreversibel** und dauert bis zum Spielende an.

### Auswirkungen

- Einkommen wird um **30% reduziert** (Multiplikator 0.7)
- Einkommen decayt weiter (×0.97 pro Frame)
- Alle Feindseligkeiten steigen um **+1/s**
- DEFCON ist permanent auf **1** (ATOMKRIEG) eingefroren
- Visuell: Schneesturm (250 Partikel), blauer Nebel, Frost-Vignette
- Musik wechselt zu "Fallout Protocol"

### Sieg trotz Nuklearwinter

Es ist möglich, bei aktivem Nuklearwinter zu gewinnen — aber der Siegesbildschirm erinnert dich: *"Aber zu welchem Preise... Nuklearwinter!"*

---

## 🚨 DEFCON-System

Das DEFCON-System spiegelt die globale Bedrohungslage wider und beeinflusst Musik, Wetter und visuelle Effekte:

| DEFCON | Status | Bedingung | Wetter | Musik |
|--------|--------|-----------|--------|-------|
| **5** | FRIEDEN | Max. Feindseligkeit ≤ 35 | Warme Partikel (15) | Defcon Ice Room |
| **4** | WACHSAM | Max. Feindseligkeit > 35 | Leichte Partikel (20) | Defcon Ice Room |
| **3** | ERHÖHT | Max. Feindseligkeit > 60 | Leichter Regen (40) | Red Alert at Dawn |
| **2** | KRITISCH | Max. Feindseligkeit > 80 | Starker Regen (120) | Fallout Protocol |
| **1** | ATOMKRIEG | Aktiver Angriff oder >1 Bedrohungen | Starker Regen (120) | Fallout Protocol |

Bei DEFCON 1–2 erscheint ein pulsierender roter Overlay und die DEFCON-Anzeige leuchtet rot.

---

## 📢 Ereignisse

Jede Runde (12 Sekunden) können zufällige Ereignisse eintreten:

| Wahrscheinlichkeit | Ereignis | Effekt |
|-------------------|----------|--------|
| 6% | **Spionageskandal** | Feindseligkeit +15 (Nicht-Alliierte) oder +8 (Alliierte) |
| 6% | **Friedensangebot** | Zufälliger Feind bietet Frieden: -25 Feindseligkeit |
| 6% | **Grenzstreitigkeit** | Zufällige Nation: +15 Feindseligkeit |
| 6% | **Kulturaustausch** | Zufällige Nation: -10 Feindseligkeit |
| 3% | **Bündniszweifel** | Alliierter mit hoher Feindseligkeit: +5, Warnung |
| 5% | **Handelsabkommen** | Alliierter: Bonus = 30 + Tech$ |
| 4% | **Wettrüsten** | Zufällige KI-Nation: +5 Militär |

Zusätzlich gibt es jede Runde:
- **30% Chance** auf Intel-Bericht (enthüllt KI-Gebäude und Geld)
- KI-Angriffe basierend auf Feindseligkeitsschwellen
- KI-gegen-KI-Konflikte (15% + Runde×1%)

---

## 🎵 Audio & Musik

### Hintergrundmusik (MP3)

Drei Soundtracks, die je nach DEFCON-Level automatisch überblenden:

| Track | Datei | DEFCON | Stimmung |
|-------|-------|--------|----------|
| Frieden | `defcon-ice-room.mp3` | 4–5 | Atmosphärisch, kalt |
| Spannung | `red-alert-at-dawn.mp3` | 3 | Aufbauende Spannung |
| Krieg | `fallout-protocol.mp3` | 1–2 | Voller Schrecken |

- **Crossfade:** 1.5s Ausblenden, 2s Einblenden beim Trackwechsel
- **Dynamische Lautstärke:** Lauter bei höherem DEFCON-Level
- Mit `M`-Taste stumm schalten

### Synthetische Soundeffekte

Alle Soundeffekte werden in Echtzeit mit der Web Audio API generiert — keine zusätzlichen Dateien nötig:

| Effekt | Beschreibung |
|--------|-------------|
| Explosion | Sägezahn 150→30Hz + Rauschburst |
| Atombombe | Tiefer Sägezahn-Rumble 60→15Hz + Quadr-Crunch + Rausch-Schwanz |
| Sirene | Sinus 400→900→400Hz Sweep |
| Gebäude gebaut | Sinus 300→600Hz aufsteigend |
| EMP | Sinus 2000→80Hz Sweep |
| Spionage | Sinus 800→1200→600Hz Schnellsweep |
| Nuklearwinter | Sägezahn 40→80→30Hz + Sinus 1200→600Hz |
| Sieg | C5-E5-G5-C6 Arpeggio |

---

## 🏆 Sieg & Niederlage

### Sieg
Überlebe **30 Runden** mit **mindestens 3 Alliierten** (von 4 möglichen). Der Siegesbildschirm zeigt einen Fanfare-Sound und deine Statistiken.

### Niederlage
Wenn dein Geld unter **-100$** fällt, ist deine Nation gefallen. Game Over.

---

## 🤖 KI-Verhalten

Jede Nation hat eine einzigartige Persönlichkeit, die ihre Strategie bestimmt:

### Aggressiv (USA, Russland)
1. Zuerst 1 Fabrik bauen
2. Bis zu 2 Militärbasen bauen
3. Fabriken und Militär ausbalancieren
4. 1 Raketensilo errichten
5. Auf 4 Militärbasen erweitern
6. 1 Abwehrsystem, 1 Spionage-HQ, 1 Lab bauen

### Diplomatisch (Europa)
1. Bis zu 3 Fabriken bauen
2. Bis zu 2 Labs bauen
3. Bis zu 2 Spionage-HQs bauen
4. Abwehr und Militär ergänzen
5. Auf 5 Fabriken erweitern

### Expansiv (China)
1. Fabriken bauen bis Anzahl > Militär + 2
2. Bis zu 2 Militärbasen bauen
3. Labs passend zum Militär bauen
4. Abwehrsysteme und Silos ergänzen

### Defensiv (Ukraine)
1. Bis zu 2 Fabriken bauen
2. Bis zu 2 Abwehrsysteme bauen
3. 1 Militärbasis, 1 Lab errichten
4. Auf 4 Fabriken und 3 Abwehrsysteme erweitern
5. Zuletzt 1 Raketensilo bauen

---

## 🎨 Visuelle Effekte

- **Pilzwolken:** Animierter Stamm + Kappe mit Gradient, glühende Partikel
- **Schockwellen:** Expandierende farbige Ringe
- **EMP-Blitze:** 3 verzweigte Blitzbolzen + Weißblitz
- **Bildschirm-Riss:** 8 verzweigte Risse vom Zentrum aus (bei schwerem Schaden)
- **CRT-Scanlines:** Subtile horizontale Linien + Vignette (immer aktiv)
- **Bildschirm-Shake:** Proportional zur Explosionsintensität
- **Zeitlupe:** Große Explosionen lösen 0.8s Zeitlupe bei 0.3× Geschwindigkeit aus
- **Rote/Blau-Puls:** Bei DEFCON 1–2 / Nuklearwinter
- **Geister-Vorschau:** Halbtransparentes Gebäude am Mauszeiger
- **Schwebetext:** Schadenszahlen und Statusnachrichten

---

## 📁 Projektstruktur

```
neoncommand/
├── index.html              # Geopolitik Hauptseite
├── old-index.html          # Tower Defense (Zweitprojekt)
├── vite.config.js          # Vite Build-Konfiguration
├── package.json
├── public/
│   └── audio/
│       ├── defcon-ice-room.mp3
│       ├── red-alert-at-dawn.mp3
│       └── fallout-protocol.mp3
└── src/
    ├── geo/
    │   ├── game.js         # Haupspielloop, State, Keybindings
    │   ├── state.js        # Spielzustand & Nationen-Definitionen
    │   ├── render.js       # Canvas Rendering, Wetter, Effekte
    │   ├── combat.js       # Kampfsystem, Nuklearwinter
    │   ├── ai.js           # KI-Verhalten & Baustategie
    │   ├── audio.js        # Web Audio API + MP3 Musiksystem
    │   ├── events.js       # Zufällige Ereignisse
    │   ├── ui.js           # HUD, DEFCON-Anzeige, Eventlog
    │   └── intel.js        # Intel-Panel (Spionage-Infos)
    └── tower/              # Tower Defense Module
```

---

## 💡 Tipps für Anfänger

1. **Baue zuerst Fabriken** — Einkommen ist das Wichtigste am Anfang
2. **Diplomatie lohnt sich** — 20$ pro Aktion ist billig verglichen mit Krieg
3. **Halte Alliierte** — Handelsrouten bringen passives Einkommen
4. **Spionage-HQs sind mächtig** — Intel und Sabotage können Krieg vermeiden
5. **Vorsicht mit Atomwaffen** — 3 Nukes = Nuklearwinter, und der ist irreversibel
6. **Beobachte die DEFCON-Anzeige** — Die Musik warnt dich vor eskalierenden Spannungen
7. **Upgrades sind effizient** — Ein Level-3-Gebilde ist stärker als drei Level-1-Gebäude
8. **Die KI baut auch** — Beobachte das Intel-Panel, um die Stärke der Gegner einzuschätzen

---

## 🛠️ Technologie

- **Vite 5** — Build-Tool und Dev-Server
- **ES Modules** — Modulare JavaScript-Architektur
- **Canvas 2D** — Rendering-Engine
- **Web Audio API** — Synthetische Soundeffekte + MP3-Musikwiedergabe
- **Keine Frameworks** — Reines Vanilla JavaScript

---

## 📜 Lizenz

Dieses Projekt ist Teil des [neoncommand](https://github.com/Ruddat/neoncommand) Repositories.
