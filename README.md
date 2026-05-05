# 📋 Weekly Reminder Card

> **An eye-catching Lovelace card for Home Assistant that displays your todo list as weekly reminders – designed to stand out so you never miss what matters.**

<p align="center">
  <img src="https://img.shields.io/badge/HACS-Custom-orange?style=for-the-badge" alt="HACS">
  <img src="https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Home%20Assistant-2023.1+-green?style=for-the-badge" alt="HA Version">
</p>

---

## 🖼️ Preview

```
╔══════════════════════════════════════════════════════╗
║  🟪📋  Weekly Reminders                      [ 3 ] ║
║                                                      ║
║  ☐  🔥  𝗣𝗮𝘆 𝗯𝗶𝗹𝗹𝘀 𝗯𝘆 𝗙𝗿𝗶𝗱𝗮𝘆!                    ║
║  ☐  🛒  Buy groceries for the weekend               ║
║  ☐  📅  𝗧𝗲𝗮𝗺 𝗺𝗲𝗲𝘁𝗶𝗻𝗴 𝗧𝘂𝗲𝘀𝗱𝗮𝘆 𝟭𝟬:𝟬𝟬            ║
║  ☑  ̶B̶o̶o̶k̶ ̶d̶e̶n̶t̶i̶s̶t̶                                ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
```

Dark gradient background • Glassmorphism • Hover animations • Pulsing important items

---

## ✨ Features

| | Feature | Description |
|---|---------|-------------|
| 🎨 | **Custom colors** | Set color per item with inline syntax |
| 💪 | **Bold text** | Highlight important items |
| 🔥 | **Icons** | All 7000+ mdi icons available per item |
| 🌈 | **4 background styles** | Gradient, Glass, Solid, or theme default |
| ✅ | **Interactive** | Check off tasks directly in the card |
| 📱 | **Compact mode** | Perfect for smaller screens/sidebars |
| 💫 | **Pulse animation** | Draw attention to urgent items |
| 🏷️ | **Count badge** | See remaining tasks at a glance |
| 🔢 | **Max items limit** | Show only X items |
| 🖊️ | **Visual editor** | Configure everything without YAML |
| 📝 | **Custom heading** | Choose your own card title |

---

## 📦 Installation

### Via HACS (recommended)

1. Open **HACS** → **Dashboard** (Instrumentpanel)
2. Click **⋮** → **Custom repositories**
3. URL: `https://github.com/ostbergjohan/ha-todo-card`
4. Category: **Dashboard** (Instrumentpanel)
5. Click **Add** → Search **Weekly Reminder Card** → **Download**
6. Restart Home Assistant

### Manual installation

1. Download `weekly-reminder-card.js` from `dist/`
2. Copy to `config/www/weekly-reminder-card.js`
3. Add resource in Lovelace:
   - URL: `/local/weekly-reminder-card.js`
   - Type: JavaScript Module

---

## 🚀 Quick Start

```yaml
type: custom:weekly-reminder-card
entity: todo.shopping_list
```

That's it! The card picks up your todo list and displays it beautifully.

---

## ⚙️ Configuration Options

```yaml
type: custom:weekly-reminder-card
entity: todo.my_list                # (required) your todo entity
title: "Weekly Reminders"           # card heading
max_items: 5                        # max visible items (0 = show all)
show_completed: false               # show completed tasks
accent_color: "#667eea"             # primary accent color
accent_color_2: "#764ba2"           # secondary accent (gradient)
background: "gradient"              # gradient | glass | solid | none
card_bg_color: "#1a1a2e"            # card background color
text_color: "#ffffff"               # text color
show_header_icon: true              # show icon in header
header_icon: "mdi:clipboard-check-outline"  # header icon
show_badge: true                    # show count badge
compact: false                      # compact mode
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `entity` | *(required)* | Todo entity (e.g. `todo.shopping_list`) |
| `title` | `Veckans Påminnelser` | Card heading/title |
| `max_items` | `0` | Max items to display (0 = all) |
| `show_completed` | `false` | Whether to show completed items |
| `accent_color` | `#667eea` | Primary accent color |
| `accent_color_2` | `#764ba2` | Secondary accent color (gradient) |
| `background` | `gradient` | Background style: gradient/glass/solid/none |
| `card_bg_color` | `#1a1a2e` | Card background color |
| `text_color` | `#ffffff` | Default text color |
| `show_header_icon` | `true` | Show icon in header |
| `header_icon` | `mdi:clipboard-check-outline` | MDI icon for header |
| `show_badge` | `true` | Show active item count badge |
| `compact` | `false` | Compact mode (less padding) |

---

## 🎨 Inline Syntax for Styling Items

Add tags at the beginning of your todo item text to give it unique styling:

### Available Tags

| Tag | Effect |
|-----|--------|
| `[bold]` | **Bold text** |
| `[color:#ff5555]` | Custom text color (hex, name, or rgb) |
| `[bg:#ffeb3b]` | Row background color |
| `[icon:mdi:fire]` | MDI icon before text |
| `[size:large]` | Text size: `small`, `normal`, `large` |
| `[blink]` | Soft pulse animation |

### Examples

```
[bold][color:#ff5555][icon:mdi:alert][blink] Pay bills by Friday!
```
→ 🚨 Red, bold text that pulses with alert icon

```
[icon:mdi:cart][color:#4caf50] Buy groceries for the weekend
```
→ 🛒 Green text with cart icon

```
[bold][size:large][bg:#667eea] Team meeting Tuesday 10:00
```
→ Large, bold text with purple background

```
[icon:mdi:gift][color:#e91e63][bold] Buy gift for Lisa
```
→ 🎁 Pink, bold text with gift icon

---

## 🖌️ Background Styles

| Style | Look |
|-------|------|
| `gradient` | Dark gradient with subtle accent color ✨ |
| `glass` | Glassmorphism with blur effect 🪟 |
| `solid` | Solid color with your chosen background |
| `none` | Follows your Home Assistant theme |

---

## 💡 Tips & Tricks

### Compatible Todo Integrations
The card works with **any** todo entity in HA:
- 🍎 Apple Reminders
- ✅ Google Tasks
- 📋 Todoist
- 🏠 HA Local Todo (built-in)
- 📝 Microsoft To-Do

### Automations
Combine with automations to create weekly reminders automatically:

```yaml
automation:
  - alias: "Weekly reminder - Sunday"
    trigger:
      - platform: time
        at: "18:00:00"
    condition:
      - condition: time
        weekday: [sun]
    action:
      - service: todo.add_item
        target:
          entity_id: todo.weekly
        data:
          item: "[bold][icon:mdi:trash-can] Take out the trash Tuesday"
```

---

## 🤝 Contributing

Pull requests are welcome! Open an issue if you find bugs or have suggestions.

---

## 📄 License

MIT © [ostbergjohan](https://github.com/ostbergjohan)
