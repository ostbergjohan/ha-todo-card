/**
 * SportGuiden - Home Assistant Card
 * ══════════════════════════════════
 * Visar dagens sport på TV/streaming med kanaler, ligor och tider.
 * Hämtar data från en command_line sensor som skrapar tv.nu.
 *
 * YAML Config:
 *   type: custom:sportguiden-card
 *   entity: sensor.sportguiden_fotboll     # or any sportguiden sensor
 *   title: "⚽ Fotboll idag"
 *   accent_color: "#4CAF50"
 *   background: "gradient"                 # gradient | glass | solid | none
 *   card_bg_color: "#0f1923"
 *   text_color: "#ffffff"
 *   show_channel: true
 *   show_league: true
 *   show_time: true
 *   compact: false
 *   max_items: 0                           # 0 = show all
 */

const SPORTGUIDEN_VERSION = "1.0.0";

class SportguidenCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }

  static getConfigElement() {
    return document.createElement("sportguiden-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "sensor.sportguiden_sport",
      title: "🏆 Sport på TV idag",
      accent_color: "#667eea",
      background: "gradient",
      show_channel: true,
      show_league: true,
      show_time: true,
    };
  }

  set hass(hass) {
    this._hass = hass;
    this._renderCard();
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Du måste ange entity (t.ex. sensor.sportguiden_fotboll)");
    }
    this._config = {
      title: "🏆 Sport på TV idag",
      accent_color: "#667eea",
      accent_color_2: "#764ba2",
      background: "gradient",
      card_bg_color: "",
      text_color: "",
      show_channel: true,
      show_league: true,
      show_time: true,
      show_header_icon: true,
      header_icon: "mdi:television-classic",
      compact: false,
      max_items: 0,
      source: "",  // source ID from config (e.g. "fotboll", "champions_league"). Empty = all_events
      ...config,
    };
  }

  getCardSize() {
    return 5;
  }

  _getEvents() {
    if (!this._hass || !this._config.entity) return [];
    const entity = this._hass.states[this._config.entity];
    if (!entity) return [];

    let events = [];
    const attr = entity.attributes || {};

    try {
      // Config mode: sensor has "sources" attribute with keyed data
      if (attr.sources && this._config.source) {
        const sourceData = attr.sources[this._config.source];
        if (sourceData && sourceData.events) {
          events = sourceData.events;
          // Auto-set title/icon from source config if not overridden
          if (!this._config._titleOverridden && sourceData.name) {
            this._autoTitle = sourceData.name;
          }
          if (!this._config._iconOverridden && sourceData.icon) {
            this._autoIcon = sourceData.icon;
          }
          if (!this._config._accentOverridden && sourceData.accent_color) {
            this._autoAccent = sourceData.accent_color;
          }
        }
      }
      // Config mode: show all events if no source specified
      else if (attr.all_events) {
        events = attr.all_events;
      }
      // Single-sensor mode: events directly in attributes
      else if (attr.events) {
        events = attr.events;
      }
      // Legacy/fallback
      else if (attr.matches) {
        events = attr.matches;
      }
      // Try parsing state as JSON
      else {
        try {
          const parsed = JSON.parse(entity.state);
          events = parsed.events || parsed.matches || parsed.all_events || [];
        } catch (e) {}
      }
    } catch (e) {}

    const max = parseInt(this._config.max_items) || 0;
    if (max > 0) {
      events = events.slice(0, max);
    }
    return events;
  }

  _getConfiguredSources() {
    // Return list of available sources from sensor
    if (!this._hass || !this._config.entity) return [];
    const entity = this._hass.states[this._config.entity];
    if (!entity) return [];
    return entity.attributes.configured_sources || [];
  }

  _renderCard() {
    if (!this._hass || !this._config.entity) return;

    const entity = this._hass.states[this._config.entity];
    if (!entity) {
      this.shadowRoot.innerHTML = `
        <ha-card>
          <div style="padding:16px;color:#ef4444;">
            <strong>⚠️ Entity "${this._config.entity}" hittades inte.</strong><br>
            Kontrollera att sensorn är konfigurerad korrekt.
          </div>
        </ha-card>`;
      return;
    }

    const events = this._getEvents();
    const c = this._config;
    const bg = this._getBackground();
    const textColor = c.text_color || "#ffffff";
    const accent = this._autoAccent || c.accent_color || "#667eea";
    const accent2 = c.accent_color_2 || "#764ba2";
    const title = c.title === "🏆 Sport på TV idag" && this._autoTitle ? this._autoTitle : c.title;
    const headerIcon = c.header_icon === "mdi:television-classic" && this._autoIcon ? this._autoIcon : c.header_icon;

    const channelLogos = {
      "svt1": "https://img.tv.nu/img-tvnu/channellogos/svt1.svg",
      "svt2": "https://img.tv.nu/img-tvnu/channellogos/svt2.svg",
      "svt play": "https://img.tv.nu/img-tvnu/channellogos/svtplay.svg",
      "tv4": "https://img.tv.nu/img-tvnu/channellogos/tv4.svg",
      "tv4 play": "https://img.tv.nu/img-tvnu/channellogos/tv4play.svg",
      "tv4 sport": "https://img.tv.nu/img-tvnu/channellogos/tv4sport.svg",
      "viaplay": "https://img.tv.nu/img-tvnu/channellogos/viaplay.svg",
      "v sport 1": "https://img.tv.nu/img-tvnu/channellogos/vsport1.svg",
      "v sport 2": "https://img.tv.nu/img-tvnu/channellogos/vsport2.svg",
      "v sport fotboll": "https://img.tv.nu/img-tvnu/channellogos/vsportfotboll.svg",
      "v sport hockey": "https://img.tv.nu/img-tvnu/channellogos/vsporthockey.svg",
      "eurosport 1": "https://img.tv.nu/img-tvnu/channellogos/eurosport.svg",
      "eurosport 2": "https://img.tv.nu/img-tvnu/channellogos/eurosport2.svg",
      "discovery+": "https://img.tv.nu/img-tvnu/channellogos/discoveryplus.svg",
      "c more": "https://img.tv.nu/img-tvnu/channellogos/cmore.svg",
      "tv3": "https://img.tv.nu/img-tvnu/channellogos/tv3.svg",
      "tv6": "https://img.tv.nu/img-tvnu/channellogos/tv6.svg",
      "tv8": "https://img.tv.nu/img-tvnu/channellogos/tv8.svg",
      "max": "https://img.tv.nu/img-tvnu/channellogos/max.svg",
      "dazn": "https://img.tv.nu/img-tvnu/channellogos/dazn.svg",
      "sportkanalen": "https://img.tv.nu/img-tvnu/channellogos/sportkanalen.svg",
    };

    const leagueColors = {
      "champions league": "#1a237e",
      "europa league": "#e65100",
      "conference league": "#004d40",
      "premier league": "#38003c",
      "allsvenskan": "#002f6c",
      "superettan": "#1565c0",
      "damallsvenskan": "#6a1b9a",
      "bundesliga": "#d50000",
      "la liga": "#ff6f00",
      "serie a": "#1b5e20",
      "ligue 1": "#0d47a1",
      "fa women's super league": "#880e4f",
      "svenska cupen": "#f9a825",
      "shl": "#002855",
      "hockeyallsvenskan": "#003d7a",
      "nhl": "#000000",
      "atp": "#00529b",
      "wta": "#5c068c",
      "world tour": "#e91e63",
      "pga tour": "#003366",
    };

    const sportIcons = {
      "fotboll": "mdi:soccer",
      "ishockey": "mdi:hockey-puck",
      "tennis": "mdi:tennis",
      "motorsport": "mdi:racing-helmet",
      "golf": "mdi:golf",
      "basket": "mdi:basketball",
      "handboll": "mdi:handball",
      "bordtennis": "mdi:table-tennis",
      "cykling": "mdi:bike",
      "friidrott": "mdi:run",
      "simning": "mdi:swim",
      "vintersport": "mdi:skiing",
      "baseball": "mdi:baseball",
    };

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .sg-card {
          ${bg}
          border-radius: 16px;
          padding: ${c.compact ? "16px" : "24px"};
          color: ${textColor};
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .sg-card::before {
          content: '';
          position: absolute;
          top: -50%; right: -50%;
          width: 100%; height: 100%;
          background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
          pointer-events: none;
        }
        .sg-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: ${c.compact ? "12px" : "20px"};
        }
        .sg-header-icon {
          width: 42px; height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, ${accent}, ${accent2});
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px ${accent}55;
          flex-shrink: 0;
        }
        .sg-header-icon ha-icon {
          --mdc-icon-size: 22px;
          color: #fff;
        }
        .sg-title {
          font-size: ${c.compact ? "1.1em" : "1.3em"};
          font-weight: 700;
          letter-spacing: -0.02em;
          flex: 1;
        }
        .sg-count {
          background: linear-gradient(135deg, ${accent}, ${accent2});
          color: #fff;
          font-size: 0.7em;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          box-shadow: 0 2px 8px ${accent}44;
        }
        .sg-list {
          list-style: none;
          margin: 0; padding: 0;
          display: flex;
          flex-direction: column;
          gap: ${c.compact ? "6px" : "10px"};
        }
        .sg-event {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: ${c.compact ? "10px 12px" : "14px 16px"};
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.2s ease;
        }
        .sg-event:hover {
          background: rgba(255,255,255,0.09);
          transform: translateX(3px);
          border-color: rgba(255,255,255,0.12);
        }
        .sg-time {
          flex-shrink: 0;
          font-size: ${c.compact ? "0.8em" : "0.9em"};
          font-weight: 700;
          color: ${accent};
          min-width: 44px;
          text-align: center;
          padding: 4px 8px;
          background: ${accent}12;
          border-radius: 8px;
          border: 1px solid ${accent}25;
        }
        .sg-channel-logo {
          flex-shrink: 0;
          width: 32px; height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.9);
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          padding: 4px;
        }
        .sg-channel-logo img {
          width: 100%; height: 100%;
          object-fit: contain;
        }
        .sg-channel-text {
          flex-shrink: 0;
          font-size: 0.65em;
          font-weight: 600;
          padding: 3px 7px;
          border-radius: 6px;
          background: rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.8);
          max-width: 70px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sg-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .sg-event-title {
          font-size: ${c.compact ? "0.88em" : "0.95em"};
          font-weight: 600;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sg-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .sg-league {
          display: inline-block;
          font-size: 0.65em;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .sg-sport-label {
          font-size: 0.65em;
          opacity: 0.5;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .sg-empty {
          text-align: center;
          padding: 32px 16px;
          opacity: 0.6;
        }
        .sg-empty-icon { font-size: 2.5em; margin-bottom: 8px; }
        .sg-footer {
          margin-top: 12px;
          text-align: right;
          font-size: 0.65em;
          opacity: 0.3;
        }
      </style>
      <div class="sg-card">
        <div class="sg-header">
          ${c.show_header_icon ? `
            <div class="sg-header-icon">
              <ha-icon icon="${headerIcon}"></ha-icon>
            </div>
          ` : ""}
          <div class="sg-title">${title}</div>
          ${events.length > 0 ? `<div class="sg-count">${events.length}</div>` : ""}
        </div>
        <ul class="sg-list">
          ${events.length === 0 ? `
            <div class="sg-empty">
              <div class="sg-empty-icon">📺</div>
              <div>Ingen sport på TV just nu</div>
            </div>
          ` : events.map((ev) => this._renderEvent(ev, channelLogos, leagueColors, sportIcons)).join("")}
        </ul>
        <div class="sg-footer">SportGuiden · tv.nu</div>
      </div>
    `;
  }

  _renderEvent(ev, channelLogos, leagueColors, sportIcons) {
    const c = this._config;
    const time = ev.time || "";
    const title = this._escapeHtml(ev.title || "");
    const league = ev.league || "";
    const sport = ev.sport || "";
    const channel = ev.channel || "";

    // Channel display
    let channelHtml = "";
    if (c.show_channel && channel) {
      const logoUrl = channelLogos[channel.toLowerCase()];
      if (logoUrl) {
        channelHtml = `<div class="sg-channel-logo"><img src="${logoUrl}" alt="${this._escapeHtml(channel)}" loading="lazy"></div>`;
      } else {
        channelHtml = `<div class="sg-channel-text">${this._escapeHtml(channel)}</div>`;
      }
    }

    // League badge
    let leagueHtml = "";
    if (c.show_league && league) {
      const cleanLeague = league.replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
      const color = leagueColors[cleanLeague.toLowerCase()] || "#444";
      leagueHtml = `<span class="sg-league" style="background:${color};color:#fff;">${this._escapeHtml(cleanLeague)}</span>`;
    }

    // Sport label (show if no league)
    let sportHtml = "";
    if (sport && !league) {
      sportHtml = `<span class="sg-sport-label">${this._escapeHtml(sport)}</span>`;
    }

    return `
      <li class="sg-event">
        ${c.show_time && time ? `<div class="sg-time">${time}</div>` : ""}
        ${channelHtml}
        <div class="sg-info">
          <div class="sg-event-title">${title}</div>
          <div class="sg-meta">
            ${leagueHtml}
            ${sportHtml}
          </div>
        </div>
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
    const accent = c.accent_color || "#667eea";
    const bgColor = c.card_bg_color || "#0f1923";
    switch (c.background) {
      case "gradient":
        return `background: linear-gradient(135deg, ${bgColor} 0%, ${accent}15 50%, ${bgColor} 100%);`;
      case "glass":
        return `background: rgba(15,25,35,0.85); backdrop-filter: blur(20px);`;
      case "solid":
        return `background: ${bgColor};`;
      case "none":
        return `background: var(--ha-card-background, var(--card-background-color, ${bgColor}));`;
      default:
        return `background: linear-gradient(135deg, ${bgColor} 0%, ${accent}15 50%, ${bgColor} 100%);`;
    }
  }
}

// ─── Visual Editor ─────────────────────────────────────────────────
class SportguidenCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) this._renderEditor();
  }

  setConfig(config) {
    this._config = config;
    this._rendered = false;
    this._renderEditor();
  }

  _renderEditor() {
    if (!this._hass) return;
    this._rendered = true;

    const sportguidenEntities = Object.keys(this._hass.states)
      .filter((e) => e.startsWith("sensor.sportguiden"))
      .sort();

    // Try to get configured sources from the selected entity
    let availableSources = [];
    if (this._config.entity && this._hass.states[this._config.entity]) {
      const attr = this._hass.states[this._config.entity].attributes || {};
      availableSources = attr.configured_sources || [];
    }

    this.shadowRoot.innerHTML = `
      <style>
        .editor { display:flex; flex-direction:column; gap:12px; padding:12px; }
        .row { display:flex; flex-direction:column; gap:4px; }
        label { font-size:0.85em; font-weight:500; opacity:0.8; }
        input, select { padding:8px 12px; border-radius:8px; border:1px solid var(--divider-color,#444); background:var(--card-background-color,#1a1a2e); color:var(--primary-text-color,#fff); font-size:0.95em; }
        .checkbox-row { display:flex; align-items:center; gap:8px; }
        h3 { margin:8px 0 4px; font-size:0.9em; opacity:0.6; text-transform:uppercase; letter-spacing:0.05em; }
        .hint { font-size:0.75em; opacity:0.5; margin-top:2px; }
      </style>
      <div class="editor">
        <div class="row">
          <label>Sensor Entity</label>
          <select id="entity">
            <option value="">-- Välj sensor --</option>
            ${sportguidenEntities.map((e) => `<option value="${e}" ${e === this._config.entity ? "selected" : ""}>${e}</option>`).join("")}
          </select>
        </div>
        <div class="row">
          <label>Sportkälla (från config)</label>
          <select id="source">
            <option value="" ${!this._config.source ? "selected" : ""}>Alla (alla konfigurerade)</option>
            ${availableSources.map((s) => `<option value="${s.id}" ${s.id === this._config.source ? "selected" : ""}>${s.name}</option>`).join("")}
          </select>
          <div class="hint">Välj vilken sport/liga som kortet visar. Konfigureras i sportguiden_config.json</div>
        </div>
        <div class="row">
          <label>Rubrik (lämna tomt för auto från källa)</label>
          <input id="title" type="text" value="${this._config.title || ""}">
        </div>
        <div class="row">
          <label>Max antal (0 = visa alla)</label>
          <input id="max_items" type="number" min="0" max="50" value="${this._config.max_items || 0}">
        </div>
        <h3>Utseende</h3>
        <div class="row">
          <label>Bakgrund</label>
          <select id="background">
            <option value="gradient" ${this._config.background === "gradient" ? "selected" : ""}>Gradient</option>
            <option value="glass" ${this._config.background === "glass" ? "selected" : ""}>Glas</option>
            <option value="solid" ${this._config.background === "solid" ? "selected" : ""}>Enfärgad</option>
            <option value="none" ${this._config.background === "none" ? "selected" : ""}>Tema</option>
          </select>
        </div>
        <div class="row">
          <label>Accent-färg (lämna standard för auto)</label>
          <input id="accent_color" type="color" value="${this._config.accent_color || "#667eea"}">
        </div>
        <div class="row">
          <label>Accent-färg 2</label>
          <input id="accent_color_2" type="color" value="${this._config.accent_color_2 || "#764ba2"}">
        </div>
        <div class="row">
          <label>Bakgrundsfärg</label>
          <input id="card_bg_color" type="color" value="${this._config.card_bg_color || "#0f1923"}">
        </div>
        <div class="row">
          <label>Textfärg</label>
          <input id="text_color" type="color" value="${this._config.text_color || "#ffffff"}">
        </div>
        <div class="row">
          <label>Header-ikon (lämna tomt för auto)</label>
          <input id="header_icon" type="text" value="${this._config.header_icon || ""}">
        </div>
        <h3>Visa / Dölj</h3>
        <div class="checkbox-row">
          <input id="show_time" type="checkbox" ${this._config.show_time !== false ? "checked" : ""}>
          <label>Visa tid</label>
        </div>
        <div class="checkbox-row">
          <input id="show_channel" type="checkbox" ${this._config.show_channel !== false ? "checked" : ""}>
          <label>Visa kanal</label>
        </div>
        <div class="checkbox-row">
          <input id="show_league" type="checkbox" ${this._config.show_league !== false ? "checked" : ""}>
          <label>Visa liga/turnering</label>
        </div>
        <div class="checkbox-row">
          <input id="show_header_icon" type="checkbox" ${this._config.show_header_icon !== false ? "checked" : ""}>
          <label>Visa header-ikon</label>
        </div>
        <div class="checkbox-row">
          <input id="compact" type="checkbox" ${this._config.compact ? "checked" : ""}>
          <label>Kompakt läge</label>
        </div>
      </div>
    `;

    const fields = ["entity","source","title","max_items","background","accent_color","accent_color_2","card_bg_color","text_color","header_icon"];
    fields.forEach((field) => {
      const el = this.shadowRoot.getElementById(field);
      if (el) el.addEventListener("change", (e) => { this._config = {...this._config, [field]: e.target.value}; this._dispatch(); });
    });
    const checkboxes = ["show_time","show_channel","show_league","show_header_icon","compact"];
    checkboxes.forEach((field) => {
      const el = this.shadowRoot.getElementById(field);
      if (el) el.addEventListener("change", (e) => { this._config = {...this._config, [field]: e.target.checked}; this._dispatch(); });
    });
  }

  _dispatch() {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true }));
  }
}

// ─── Register ──────────────────────────────────────────────────────
customElements.define("sportguiden-card", SportguidenCard);
customElements.define("sportguiden-card-editor", SportguidenCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "sportguiden-card",
  name: "SportGuiden",
  description: "Visar dagens sport på TV och streaming med kanaler, ligor och tider (tv.nu)",
  preview: true,
  documentationURL: "https://github.com/ostbergjohan/ha-sportguiden",
});

console.info(
  `%c SPORTGUIDEN %c v${SPORTGUIDEN_VERSION} `,
  "background: linear-gradient(135deg,#667eea,#764ba2); color: #fff; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: 700;",
  "background: #0f1923; color: #667eea; padding: 4px 8px; border-radius: 0 4px 4px 0;"
);
