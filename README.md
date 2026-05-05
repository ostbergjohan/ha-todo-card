# 📋 Weekly Reminder Card

> **En iögonfallande Lovelace-kort för Home Assistant som visar din todo-lista som veckopåminnelser – designat för att stå ut så du aldrig missar det viktiga.**

<p align="center">
  <img src="https://img.shields.io/badge/HACS-Custom-orange?style=for-the-badge" alt="HACS">
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Home%20Assistant-2023.1+-green?style=for-the-badge" alt="HA Version">
</p>

---

## 🖼️ Förhandsgranskning

```
╔══════════════════════════════════════════════════════╗
║  🟪📋  Veckans Påminnelser                  [ 3 ]  ║
║                                                      ║
║  ☐  🔥  𝗕𝗲𝘁𝗮𝗹𝗮 𝗿ä𝗸𝗻𝗶𝗻𝗴𝗮𝗿 𝘀𝗲𝗻𝗮𝘀𝘁 𝗳𝗿𝗲𝗱𝗮𝗴!         ║
║  ☐  🛒  Handla mat till helgen                      ║
║  ☐  📅  𝗧𝗲𝗮𝗺𝗺𝗲𝗲𝘁𝗶𝗻𝗴 𝘁𝗶𝘀𝗱𝗮𝗴 𝟭𝟬:𝟬𝟬               ║
║  ☑  ̶B̶o̶k̶a̶ ̶t̶a̶n̶d̶l̶ä̶k̶a̶r̶e̶                              ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
```

Mörk gradient-bakgrund • Glasmorfism • Hover-animationer • Pulsande viktiga punkter

---

## ✨ Funktioner

| | Funktion | Beskrivning |
|---|----------|-------------|
| 🎨 | **Anpassningsbara färger** | Ändra färg per punkt med inline-syntax |
| 💪 | **Fetstil** | Markera viktiga punkter med fet text |
| 🔥 | **Ikoner** | Alla 7000+ mdi-ikoner tillgängliga per punkt |
| 🌈 | **4 bakgrundstyper** | Gradient, Glass, Solid eller tema-standard |
| ✅ | **Interaktiv** | Markera uppgifter som klara direkt i kortet |
| 📱 | **Kompakt läge** | Perfekt för mindre skärmar/sidopaneler |
| 💫 | **Pulsanimation** | Dra uppmärksamhet till akuta punkter |
| 🏷️ | **Antal-badge** | Se direkt hur många uppgifter som återstår |
| 🔢 | **Max-begränsning** | Visa bara X antal punkter |
| 🖊️ | **Visuell editor** | Konfigurera allt utan YAML |
| 📝 | **Anpassad rubrik** | Välj egen heading för kortet |

---

## 📦 Installation

### Via HACS (rekommenderat)

1. Öppna **HACS** → **Frontend**
2. Klicka **⋮** → **Custom repositories**
3. URL: `https://github.com/ostbergjohan/weekly-reminder-card`
4. Kategori: **Plugin (Lovelace)**
5. Klicka **Add** → Sök **Weekly Reminder Card** → **Download**
6. Starta om Home Assistant

### Manuell installation

1. Ladda ner `weekly-reminder-card.js` från `dist/`
2. Kopiera till `config/www/weekly-reminder-card.js`
3. Lägg till resurs i Lovelace:
   - URL: `/local/weekly-reminder-card.js`
   - Typ: JavaScript Module

---

## 🚀 Snabbstart

```yaml
type: custom:weekly-reminder-card
entity: todo.shopping_list
```

Det var allt! Kortet hittar din todo-lista och visar den snyggt.

---

## ⚙️ Alla konfigurationsalternativ

```yaml
type: custom:weekly-reminder-card
entity: todo.min_lista              # (obligatorisk) din todo-entity
title: "Kom ihåg denna vecka!"      # rubrik/heading
max_items: 5                        # max antal synliga (0 = alla)
show_completed: false               # visa avklarade uppgifter
accent_color: "#667eea"             # primär accent-färg
accent_color_2: "#764ba2"           # sekundär accent (gradient)
background: "gradient"              # gradient | glass | solid | none
card_bg_color: "#1a1a2e"            # bakgrundsfärg
text_color: "#ffffff"               # textfärg
show_header_icon: true              # visa ikon i headern
header_icon: "mdi:clipboard-check-outline"  # vilken ikon
show_badge: true                    # visa antal-badge
compact: false                      # kompakt läge
```

| Parameter | Standard | Beskrivning |
|-----------|----------|-------------|
| `entity` | *(krävs)* | Todo-entity (t.ex. `todo.shopping_list`) |
| `title` | `Veckans Påminnelser` | Rubrik/heading på kortet |
| `max_items` | `0` | Max antal punkter att visa (0 = alla) |
| `show_completed` | `false` | Om avklarade punkter ska visas |
| `accent_color` | `#667eea` | Primär accentfärg |
| `accent_color_2` | `#764ba2` | Sekundär accentfärg (gradient) |
| `background` | `gradient` | Bakgrundstyp: gradient/glass/solid/none |
| `card_bg_color` | `#1a1a2e` | Kortets bakgrundsfärg |
| `text_color` | `#ffffff` | Standard textfärg |
| `show_header_icon` | `true` | Visa ikon i header |
| `header_icon` | `mdi:clipboard-check-outline` | MDI-ikon i headern |
| `show_badge` | `true` | Visa badge med antal aktiva |
| `compact` | `false` | Kompakt läge (mindre padding) |

---

## 🎨 Styla individuella punkter (inline-syntax)

Lägg till taggar i början av din todo-text för att ge den unik styling:

### Tillgängliga taggar

| Tagg | Effekt |
|------|--------|
| `[bold]` | **Fetstil** |
| `[color:#ff5555]` | Valfri textfärg (hex, namn, rgb) |
| `[bg:#ffeb3b]` | Bakgrundsfärg på raden |
| `[icon:mdi:fire]` | MDI-ikon före texten |
| `[size:large]` | Textstorlek: `small`, `normal`, `large` |
| `[blink]` | Mjuk pulsanimation |

### Exempel

```
[bold][color:#ff5555][icon:mdi:alert][blink] Betala räkningar senast fredag!
```
→ 🚨 Röd, fet text som pulsar med alert-ikon

```
[icon:mdi:cart][color:#4caf50] Handla mat till helgen
```
→ 🛒 Grön text med varukorg-ikon

```
[bold][size:large][bg:#667eea] Teammeeting tisdag 10:00
```
→ Stor, fet text med lila bakgrund

```
[icon:mdi:gift][color:#e91e63][bold] Köp present till Lisa
```
→ 🎁 Rosa, fet text med present-ikon

---

## 🖌️ Bakgrundstyper

| Typ | Utseende |
|-----|----------|
| `gradient` | Mörk gradient med subtil accent-färg ✨ |
| `glass` | Glasmorfism med blur-effekt 🪟 |
| `solid` | Enfärgad med din valda bakgrundsfärg |
| `none` | Följer ditt Home Assistant-tema |

---

## 💡 Tips & Tricks

### Kompatibla todo-integrationer
Kortet fungerar med **alla** todo-entities i HA:
- 🍎 Apple Reminders
- ✅ Google Tasks
- 📋 Todoist
- 🏠 HA Local Todo (inbyggd)
- 📝 Microsoft To-Do

### Automationer
Kombinera med automationer för att skapa veckopåminnelser automatiskt:

```yaml
automation:
  - alias: "Veckopåminnelse - Söndag"
    trigger:
      - platform: time
        at: "18:00:00"
    condition:
      - condition: time
        weekday: [sun]
    action:
      - service: todo.add_item
        target:
          entity_id: todo.veckan
        data:
          item: "[bold][icon:mdi:trash-can] Ställ ut soporna tisdag"
```

---

## 🤝 Bidra

Pull requests välkomnas! Öppna en issue om du hittar buggar eller har förslag.

---

## 📄 Licens

MIT © [ostbergjohan](https://github.com/ostbergjohan)
