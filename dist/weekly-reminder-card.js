/**
 * Weekly Reminder Card for Home Assistant
 * ─────────────────────────────────────────
 * A beautiful, eye-catching card that displays your HA todo list
 * with support for custom colors, bold text, and icons per item.
 *
 * INLINE SYNTAX (in todo item summary):
 *   [color:red]       → set item text color
 *   [bg:yellow]       → set item background color
 *   [bold]            → make item bold
 *   [icon:mdi:fire]   → show icon before item
 *   [size:large]      → large text (small, normal, large)
 *   [blink]           → subtle pulse animation to draw attention
 *
 * Example todo item: "[bold][color:#ff5555][icon:mdi:alert] Betala hyran"
 *
 * YAML Config:
 *   type: custom:weekly-reminder-card
 *   entity: todo.shopping_list
 *   title: "Veckans Påminnelser"
 *   show_completed: false
 *   accent_color: "#667eea"
 *   background: "gradient"   (gradient | glass | solid | none)
 *   card_bg_color: "#1a1a2e"
 *   text_color: "#ffffff"
 *   show_header_icon: true
 *   header_icon: "mdi:clipboard-check-outline"
 *   compact: false
 */

const CARD_VERSION = "1.0.0";

class WeeklyReminderCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._items = [];
    this._loading = true;
    this._fetchTimer = null;
  }

  static get properties() {
    return { hass: {}, config: {} };
  }

  static getConfigElement() {
    return document.createElement("weekly-reminder-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "",
      title: "Veckans Påminnelser",
      show_completed: false,
      accent_color: "#667eea",
      background: "gradient",
      show_header_icon: true,
      header_icon: "mdi:clipboard-check-outline",
    };
  }

  set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;

    const entityId = this._config.entity;
    if (!entityId) {
      this._renderCard();
      return;
    }

    // Always fetch on first load
    if (!this._fetched) {
      this._fetchItems();
      return;
    }

    // Refetch when entity state changes (item added/removed/toggled)
    const oldState = oldHass && oldHass.states[entityId];
    const newState = hass.states[entityId];
    if (newState && (!oldState || oldState.state !== newState.state || oldState.last_updated !== newState.last_updated)) {
      this._fetchItems();
      return;
    }

    this._renderCard();
  }

  async _fetchItems() {
    if (!this._hass || !this._config.entity) return;

    try {
      // Try WebSocket API first (HA 2023.11+)
      const result = await this._hass.callWS({
        type: "todo/item/list",
        entity_id: this._config.entity,
      });
      this._items = result.items || [];
      this._loading = false;
      this._fetched = true;
    } catch (e) {
      // Fallback: try calling the service via REST-style
      try {
        const response = await this._hass.callApi(
          "GET",
          `todo/items/${this._config.entity}`
        );
        this._items = response.items || response || [];
        this._loading = false;
        this._fetched = true;
      } catch (e2) {
        console.error("Weekly Reminder Card: Could not fetch items", e, e2);
        this._items = [];
        this._loading = false;
        this._fetched = true;
      }
    }

    this._renderCard();
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Du måste ange en entity (todo-lista)");
    }
    this._config = {
      title: "Veckans Påminnelser",
      show_completed: false,
      max_items: 0,
      accent_color: "#667eea",
      accent_color_2: "#764ba2",
      background: "gradient",
      card_bg_color: "",
      text_color: "",
      header_icon_color: "#ffffff",
      show_header_icon: true,
      header_icon: "mdi:clipboard-check-outline",
      compact: false,
      show_badge: true,
      ...config,
    };
    if (this._hass) {
      this._fetchItems();
    }
  }

  getCardSize() {
    return 4;
  }

  // ─── Parse inline tags from item summary ───────────────────────
  _parseTags(summary) {
    const tags = {};
    const tagRegex = /\[([^\]]+)\]/g;
    let clean = summary;
    let match;

    while ((match = tagRegex.exec(summary)) !== null) {
      const tag = match[1];
      if (tag === "bold") {
        tags.bold = true;
      } else if (tag === "blink") {
        tags.blink = true;
      } else if (tag.startsWith("color:")) {
        tags.color = tag.slice(6);
      } else if (tag.startsWith("bg:")) {
        tags.bg = tag.slice(3);
      } else if (tag.startsWith("icon:")) {
        tags.icon = tag.slice(5);
      } else if (tag.startsWith("icon_color:")) {
        tags.icon_color = tag.slice(11);
      } else if (tag.startsWith("size:")) {
        tags.size = tag.slice(5);
      }
    }

    clean = clean.replace(tagRegex, "").trim();
    return { tags, text: clean };
  }

  // ─── Render ────────────────────────────────────────────────────
  _renderCard() {
    if (!this._hass || !this._config.entity) return;

    const entity = this._hass.states[this._config.entity];
    if (!entity) {
      this.shadowRoot.innerHTML = `
        <ha-card>
          <div style="padding:16px;color:#ef4444;">
            <strong>⚠️ Entity "${this._config.entity}" not found.</strong><br>
            Make sure your todo list entity exists.
          </div>
        </ha-card>`;
      return;
    }

    const items = this._items;
    const showCompleted = this._config.show_completed;
    let filteredItems = showCompleted
      ? items
      : items.filter((i) => i.status !== "completed");

    const maxItems = parseInt(this._config.max_items) || 0;
    if (maxItems > 0) {
      filteredItems = filteredItems.slice(0, maxItems);
    }

    const activeCount = items.filter((i) => i.status !== "completed").length;

    const c = this._config;
    const bg = this._getBackground();
    const textColor = c.text_color || "#ffffff";
    const accent = c.accent_color || "#667eea";
    const accent2 = c.accent_color_2 || "#764ba2";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .wr-card {
          ${bg}
          border-radius: 16px;
          padding: ${c.compact ? "16px" : "24px"};
          color: ${textColor};
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .wr-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
          pointer-events: none;
        }
        .wr-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: ${c.compact ? "12px" : "20px"};
          position: relative;
        }
        .wr-header-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, ${accent}, ${accent2});
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(102,126,234,0.4);
        }
        .wr-header-icon ha-icon {
          --mdc-icon-size: 22px;
          color: ${c.header_icon_color || "#fff"};
        }
        .wr-title {
          font-size: ${c.compact ? "1.1em" : "1.3em"};
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .wr-badge {
          margin-left: auto;
          background: linear-gradient(135deg, ${accent}, ${accent2});
          color: #fff;
          font-size: 0.75em;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(102,126,234,0.4);
          min-width: 20px;
          text-align: center;
        }
        .wr-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: ${c.compact ? "6px" : "10px"};
        }
        .wr-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: ${c.compact ? "10px 12px" : "14px 16px"};
          border-radius: 12px;
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.08);
          transition: all 0.2s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .wr-item:hover {
          background: rgba(255,255,255,0.12);
          transform: translateX(4px);
          border-color: rgba(255,255,255,0.15);
        }
        .wr-item.completed {
          opacity: 0.5;
          text-decoration: line-through;
        }
        .wr-item-icon {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .wr-item-icon ha-icon {
          --mdc-icon-size: 20px;
        }
        .wr-checkbox {
          flex-shrink: 0;
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 2px solid rgba(255,255,255,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .wr-checkbox:hover {
          border-color: ${accent};
          background: rgba(102,126,234,0.2);
        }
        .wr-checkbox.checked {
          background: linear-gradient(135deg, ${accent}, ${accent2});
          border-color: transparent;
        }
        .wr-checkbox.checked::after {
          content: '✓';
          color: #fff;
          font-size: 12px;
          font-weight: 700;
        }
        .wr-item-text {
          flex: 1;
          font-size: ${c.compact ? "0.9em" : "1em"};
          line-height: 1.4;
        }
        .wr-item-text.size-small { font-size: 0.85em; }
        .wr-item-text.size-large { font-size: 1.2em; }
        .wr-empty {
          text-align: center;
          padding: 32px 16px;
          opacity: 0.6;
          font-size: 0.95em;
        }
        .wr-empty-icon {
          font-size: 2.5em;
          margin-bottom: 8px;
        }
        @keyframes pulse-attention {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; transform: scale(1.01); }
        }
        .blink {
          animation: pulse-attention 2s ease-in-out infinite;
        }
      </style>
      <div class="wr-card">
        <div class="wr-header">
          ${c.show_header_icon ? `
            <div class="wr-header-icon">
              <ha-icon icon="${c.header_icon}"></ha-icon>
            </div>
          ` : ""}
          <div class="wr-title">${c.title}</div>
          ${c.show_badge && activeCount > 0 ? `
            <div class="wr-badge">${activeCount}</div>
          ` : ""}
        </div>
        <ul class="wr-list">
          ${filteredItems.length === 0 ? `
            <div class="wr-empty">
              <div class="wr-empty-icon">🎉</div>
              <div>Inga påminnelser – bra jobbat!</div>
            </div>
          ` : filteredItems.map((item, index) => this._renderItem(item, index)).join("")}
        </ul>
      </div>
    `;

    // Add click handlers for checkboxes
    this.shadowRoot.querySelectorAll(".wr-checkbox").forEach((cb) => {
      cb.addEventListener("click", (e) => {
        e.stopPropagation();
        const uid = cb.dataset.uid;
        const status = cb.dataset.status;
        this._toggleItem(uid, status);
      });
    });
  }

  _renderItem(item, index) {
    const { tags, text } = this._parseTags(item.summary || item.name || "");
    const isCompleted = item.status === "completed";

    let itemStyle = "";
    let textClasses = "wr-item-text";
    let itemClasses = `wr-item ${isCompleted ? "completed" : ""}`;

    if (tags.bg) {
      itemStyle += `background: ${tags.bg}20; border-color: ${tags.bg}40;`;
    }
    if (tags.blink && !isCompleted) {
      itemClasses += " blink";
    }
    if (tags.size) {
      textClasses += ` size-${tags.size}`;
    }

    let textStyle = "";
    if (tags.color) textStyle += `color: ${tags.color};`;
    if (tags.bold) textStyle += `font-weight: 700;`;

    const iconColor = tags.icon_color || tags.color || "";
    const iconHtml = tags.icon
      ? `<div class="wr-item-icon"><ha-icon icon="${tags.icon}" style="${iconColor ? `color:${iconColor}` : ""}"></ha-icon></div>`
      : "";

    const uid = item.uid || index;

    return `
      <li class="${itemClasses}" style="${itemStyle}">
        <div class="wr-checkbox ${isCompleted ? "checked" : ""}" 
             data-uid="${uid}" 
             data-status="${isCompleted ? "completed" : "needs_action"}">
        </div>
        ${iconHtml}
        <span class="${textClasses}" style="${textStyle}">${this._escapeHtml(text)}</span>
      </li>
    `;
  }

  _escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  _getBackground() {
    const c = this._config;
    switch (c.background) {
      case "gradient":
        return `background: linear-gradient(135deg, ${c.card_bg_color || "#1a1a2e"} 0%, ${c.accent_color || "#667eea"}22 50%, ${c.card_bg_color || "#16213e"} 100%);`;
      case "glass":
        return `background: rgba(30,30,60,0.7); backdrop-filter: blur(20px);`;
      case "solid":
        return `background: ${c.card_bg_color || "#1a1a2e"};`;
      case "none":
        return `background: var(--ha-card-background, var(--card-background-color, #1a1a2e));`;
      default:
        return `background: linear-gradient(135deg, #1a1a2e 0%, #667eea22 50%, #16213e 100%);`;
    }
  }

  async _toggleItem(uid, currentStatus) {
    const newStatus = currentStatus === "completed" ? "needs_action" : "completed";
    try {
      await this._hass.callService("todo", "update_item", {
        entity_id: this._config.entity,
        item: uid,
        status: newStatus,
      });
      // Refetch items after toggling
      await this._fetchItems();
    } catch (e) {
      console.error("Weekly Reminder Card: Could not toggle item", e);
    }
  }
}

// ─── Visual Editor ─────────────────────────────────────────────────
class WeeklyReminderCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
  }

  set hass(hass) {
    this._hass = hass;
    // Only render once on first hass set, not on every update
    if (!this._rendered) {
      this._renderEditor();
    }
  }

  setConfig(config) {
    this._config = config;
    this._rendered = false;
    this._renderEditor();
  }

  _renderEditor() {
    if (!this._hass) return;
    this._rendered = true;

    // Get all todo entities
    const todoEntities = Object.keys(this._hass.states)
      .filter((e) => e.startsWith("todo."))
      .sort();

    this.shadowRoot.innerHTML = `
      <style>
        .editor {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px;
        }
        .row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        label {
          font-size: 0.85em;
          font-weight: 500;
          opacity: 0.8;
        }
        input, select {
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid var(--divider-color, #444);
          background: var(--card-background-color, #1a1a2e);
          color: var(--primary-text-color, #fff);
          font-size: 0.95em;
        }
        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        h3 {
          margin: 8px 0 4px;
          font-size: 0.9em;
          opacity: 0.6;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      </style>
      <div class="editor">
        <div class="row">
          <label>Todo Entity</label>
          <select id="entity">
            <option value="">-- Välj todo-lista --</option>
            ${todoEntities.map((e) => `<option value="${e}" ${e === this._config.entity ? "selected" : ""}>${e}</option>`).join("")}
          </select>
        </div>
        <div class="row">
          <label>Rubrik / Heading</label>
          <input id="title" type="text" value="${this._config.title || "Veckans Påminnelser"}" placeholder="T.ex. Kom ihåg!">
        </div>
        <div class="row">
          <label>Max antal synliga punkter (0 = visa alla)</label>
          <input id="max_items" type="number" min="0" max="50" value="${this._config.max_items || 0}">
        </div>
        <h3>Utseende</h3>
        <div class="row">
          <label>Bakgrund</label>
          <select id="background">
            <option value="gradient" ${this._config.background === "gradient" ? "selected" : ""}>Gradient</option>
            <option value="glass" ${this._config.background === "glass" ? "selected" : ""}>Glas (Frosted)</option>
            <option value="solid" ${this._config.background === "solid" ? "selected" : ""}>Enfärgad</option>
            <option value="none" ${this._config.background === "none" ? "selected" : ""}>Tema-standard</option>
          </select>
        </div>
        <div class="row">
          <label>Accent-färg</label>
          <input id="accent_color" type="color" value="${this._config.accent_color || "#667eea"}">
        </div>
        <div class="row">
          <label>Accent-färg 2 (gradient)</label>
          <input id="accent_color_2" type="color" value="${this._config.accent_color_2 || "#764ba2"}">
        </div>
        <div class="row">
          <label>Bakgrundsfärg</label>
          <input id="card_bg_color" type="color" value="${this._config.card_bg_color || "#1a1a2e"}">
        </div>
        <div class="row">
          <label>Textfärg</label>
          <input id="text_color" type="color" value="${this._config.text_color || "#ffffff"}">
        </div>
        <div class="row">
          <label>Header-ikon (t.ex. mdi:clipboard-check-outline)</label>
          <input id="header_icon" type="text" value="${this._config.header_icon || "mdi:clipboard-check-outline"}">
        </div>
        <div class="row">
          <label>Header-ikon färg</label>
          <input id="header_icon_color" type="color" value="${this._config.header_icon_color || "#ffffff"}">
        </div>
        <h3>Beteende</h3>
        <div class="checkbox-row">
          <input id="show_completed" type="checkbox" ${this._config.show_completed ? "checked" : ""}>
          <label>Visa avklarade uppgifter</label>
        </div>
        <div class="checkbox-row">
          <input id="show_header_icon" type="checkbox" ${this._config.show_header_icon !== false ? "checked" : ""}>
          <label>Visa header-ikon</label>
        </div>
        <div class="checkbox-row">
          <input id="show_badge" type="checkbox" ${this._config.show_badge !== false ? "checked" : ""}>
          <label>Visa antal-badge</label>
        </div>
        <div class="checkbox-row">
          <input id="compact" type="checkbox" ${this._config.compact ? "checked" : ""}>
          <label>Kompakt läge</label>
        </div>
      </div>
    `;

    // Bind events
    const fields = ["entity", "title", "max_items", "background", "accent_color", "accent_color_2", "card_bg_color", "text_color", "header_icon", "header_icon_color"];
    fields.forEach((field) => {
      const el = this.shadowRoot.getElementById(field);
      if (el) {
        el.addEventListener("change", (e) => {
          this._config = { ...this._config, [field]: e.target.value };
          this._dispatch();
        });
      }
    });

    const checkboxes = ["show_completed", "show_header_icon", "show_badge", "compact"];
    checkboxes.forEach((field) => {
      const el = this.shadowRoot.getElementById(field);
      if (el) {
        el.addEventListener("change", (e) => {
          this._config = { ...this._config, [field]: e.target.checked };
          this._dispatch();
        });
      }
    });
  }

  _dispatch() {
    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}

// ─── Register ──────────────────────────────────────────────────────
customElements.define("weekly-reminder-card", WeeklyReminderCard);
customElements.define("weekly-reminder-card-editor", WeeklyReminderCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "weekly-reminder-card",
  name: "Weekly Reminder Card",
  description: "En snygg, iögonfallande påminnelse-/todolista för veckan med stöd för anpassade färger, ikoner och fetstil per punkt.",
  preview: true,
  documentationURL: "https://github.com/ostbergjohan/weekly-reminder-card",
});

console.info(
  `%c WEEKLY-REMINDER-CARD %c v${CARD_VERSION} `,
  "background: linear-gradient(135deg,#667eea,#764ba2); color: #fff; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: 700;",
  "background: #1a1a2e; color: #667eea; padding: 4px 8px; border-radius: 0 4px 4px 0;"
);
