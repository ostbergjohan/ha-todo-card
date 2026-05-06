"""
SportGuiden - Scraper for tv.nu sport listings
═══════════════════════════════════════════════
Fetches today's sport events from tv.nu and outputs JSON for Home Assistant.

Modes:
  1. Config mode (recommended):
     python sportguiden_scraper.py --config sportguiden_config.json
     → Scrapes ALL configured sources in one run, outputs combined JSON

  2. Single URL mode:
     python sportguiden_scraper.py --url sport/fotboll
     → Scrapes one specific path

Options:
  --config FILE  Path to sportguiden_config.json (scrapes all sources)
  --url PATH     Single tv.nu sport path (e.g. "sport/fotboll")
  --source ID    When using --config, only scrape this source ID
  --filter TERM  Only include events matching this text (case-insensitive)
  --output FILE  Write JSON to file instead of stdout

Config mode output (one sensor, all sources):
{
  "sources": {
    "fotboll": {
      "name": "Fotboll",
      "events": [...],
      "count": 7,
      "icon": "mdi:soccer",
      "accent_color": "#4CAF50"
    },
    "champions_league": {...},
    ...
  },
  "all_events": [...],
  "total_count": 22,
  "date": "2026-05-06"
}
"""

import argparse
import json
import os
import re
import sys
import warnings
from datetime import date

# Suppress SSL warnings when verify=False is used
warnings.filterwarnings("ignore", message="Unverified HTTPS request")

try:
    import requests
except ImportError:
    print(json.dumps({"sources": {}, "all_events": [], "total_count": 0, "date": str(date.today()), "error": "requests library not installed"}))
    sys.exit(0)


def fetch_html(url):
    """Fetch HTML from tv.nu with SSL fallback."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
    }
    try:
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        return resp.text
    except requests.exceptions.SSLError:
        resp = requests.get(url, headers=headers, timeout=15, verify=False)
        resp.raise_for_status()
        return resp.text


def parse_events(html, today_str, text_filter=None):
    """
    Parse sport events from tv.nu HTML.
    
    The HTML has two views:
    1. Card view: links with href="/s/X_YYYYMMDD" containing:
       - div._3wy1n: "Idag HH:MM" (time)
       - p._3P__M: "Liga (H/D), sport" (league info)
       - p._3C8FT: "Team A - Team B" (match title)
    
    2. List view: links with aria-label="Link - HH:MM, Title"
       containing channel info in nested divs
    """
    events = []
    seen = set()

    # === Strategy 1: Parse card view (more structured) ===
    # Find all <a> blocks pointing to today's events
    # Pattern: <a href="/s/X_YYYYMMDD" ...> ... </a>
    link_starts = [m.start() for m in re.finditer(
        r'<a\s+href="/s/[sp]_\d+_' + today_str + r'"',
        html
    )]

    for start in link_starts:
        # Get the block until closing </a> (approximate: take ~2500 chars)
        block = html[start:start + 2500]
        end_a = block.find("</a>")
        if end_a > 0:
            block = block[:end_a]

        # Extract time from _3wy1n div
        time_match = re.search(r'class="_3wy1n"[^>]*>\s*(?:Idag\s+)?(\d{2}:\d{2})', block)
        time_str = time_match.group(1) if time_match else ""

        # Extract league/sport info from _3P__M
        league_match = re.search(r'class="_3P__M"[^>]*>\s*([^<]+)', block)
        subtitle = league_match.group(1).strip() if league_match else ""

        # Extract match title from _3C8FT
        title_match = re.search(r'class="_3C8FT"[^>]*>\s*([^<]+)', block)
        title = title_match.group(1).strip() if title_match else ""

        # Also try aria-label as fallback
        if not title:
            aria_match = re.search(r'aria-label="Link\s*-\s*(\d{2}:\d{2}),\s*(.+?)"', block)
            if aria_match:
                if not time_str:
                    time_str = aria_match.group(1)
                title = aria_match.group(2).strip()

        if not title:
            continue

        # Parse league and sport from subtitle like "Champions League (H), fotboll"
        league = ""
        sport = ""
        if subtitle:
            sub_match = re.match(r"(.+?)\s*\([HD]\)\s*,?\s*(\w+.*)", subtitle)
            if sub_match:
                league = sub_match.group(1).strip()
                sport = sub_match.group(2).strip()
            else:
                sport = subtitle

        # Extract channel - look for channel text patterns
        channel = ""
        # Channel might be in nearby list-view sibling, try common patterns
        chan_match = re.search(
            r'(?:SVT|TV4|Viaplay|Discovery\+|Eurosport|C More|Max|DAZN|Sportkanalen|TV3|TV6|TV8|Kanal 5|Kanal 9|ESPN|V Sport|Cmore)[^<]*',
            block, re.IGNORECASE
        )
        if chan_match:
            channel = chan_match.group(0).strip()

        # Dedup by title + time
        key = f"{time_str}_{title}".lower()
        if key in seen:
            continue
        seen.add(key)

        # Apply text filter
        if text_filter:
            search_text = f"{title} {subtitle} {league} {sport} {channel}".lower()
            if text_filter.lower() not in search_text:
                continue

        events.append({
            "time": time_str,
            "title": title,
            "subtitle": subtitle,
            "league": league,
            "sport": sport,
            "channel": channel,
        })

    # === Strategy 2: Parse list view (aria-label based) ===
    # These have aria-label="Link - HH:MM, Title" and channel info
    aria_links = re.finditer(
        r'<a[^>]+href="/s/[sp]_\d+_' + today_str + r'"[^>]*aria-label="Link\s*-\s*(\d{2}:\d{2}),\s*([^"]+)"',
        html
    )

    for m in aria_links:
        time_str = m.group(1)
        title = m.group(2).strip()
        
        if not title or " - " not in title:
            continue

        key = f"{time_str}_{title}".lower()
        if key in seen:
            continue
        seen.add(key)

        # Get surrounding block for channel info
        block = html[m.start():m.start() + 2000]
        channel = ""
        # Look for channel names
        chan_patterns = [
            r'>\s*(SVT[^<]*?)(?:\s*<!--|\s*<)',
            r'>\s*(TV4[^<]*?)(?:\s*<!--|\s*<)',
            r'>\s*(Viaplay[^<]*?)(?:\s*<!--|\s*<)',
            r'>\s*(Discovery\+[^<]*?)(?:\s*<!--|\s*<)',
            r'>\s*(Eurosport[^<]*?)(?:\s*<!--|\s*<)',
            r'>\s*(C More[^<]*?)(?:\s*<!--|\s*<)',
            r'>\s*(Max[^<]*?)(?:\s*<!--|\s*<)',
            r'>\s*(DAZN[^<]*?)(?:\s*<!--|\s*<)',
            r'>\s*(V Sport[^<]*?)(?:\s*<!--|\s*<)',
            r'>\s*(TV3[^<]*?)(?:\s*<!--|\s*<)',
            r'>\s*(TV6[^<]*?)(?:\s*<!--|\s*<)',
            r'>\s*(Sportkanalen[^<]*?)(?:\s*<!--|\s*<)',
            r'>\s*(SVT Play[^<]*?)(?:\s*<!--|\s*<)',
            r'>\s*(TV4 Play[^<]*?)(?:\s*<!--|\s*<)',
        ]
        for pat in chan_patterns:
            chan_m = re.search(pat, block, re.IGNORECASE)
            if chan_m:
                channel = chan_m.group(1).strip()
                break

        if text_filter:
            if text_filter.lower() not in f"{title} {channel}".lower():
                continue

        events.append({
            "time": time_str,
            "title": title,
            "subtitle": "",
            "league": "",
            "sport": "",
            "channel": channel,
        })

    # Sort by time
    events.sort(key=lambda e: e.get("time") or "99:99")
    return events


def get_channel_logos():
    """Map of known channel names to their logo URLs."""
    # tv.nu uses images from their CDN. These are common Swedish sport channels.
    base = "https://img.tv.nu/img-tvnu/channellogos"
    return {
        "SVT1": f"{base}/svt1.svg",
        "SVT2": f"{base}/svt2.svg",
        "SVT Play": f"{base}/svtplay.svg",
        "TV4": f"{base}/tv4.svg",
        "TV4 Play": f"{base}/tv4play.svg",
        "Viaplay": "https://img.tv.nu/img-tvnu/channellogos/viaplay.svg",
        "V Sport 1": f"{base}/vsport1.svg",
        "V Sport 2": f"{base}/vsport2.svg",
        "V Sport Football": f"{base}/vsportfotboll.svg",
        "V Sport Hockey": f"{base}/vsporthockey.svg",
        "Eurosport 1": f"{base}/eurosport.svg",
        "Eurosport 2": f"{base}/eurosport2.svg",
        "Discovery+": f"{base}/discoveryplus.svg",
        "C More": f"{base}/cmore.svg",
        "TV3": f"{base}/tv3.svg",
        "TV6": f"{base}/tv6.svg",
        "TV8": f"{base}/tv8.svg",
        "Max": f"{base}/max.svg",
        "DAZN": "https://img.tv.nu/img-tvnu/channellogos/dazn.svg",
        "Sportkanalen": f"{base}/sportkanalen.svg",
    }


def main():
    parser = argparse.ArgumentParser(description="SportGuiden - Scrape sport TV listings from tv.nu")
    parser.add_argument("--config", default="", help="Path to sportguiden_config.json (scrapes all configured sources)")
    parser.add_argument("--url", default="", help="Single tv.nu path (e.g. sport, sport/fotboll)")
    parser.add_argument("--source", default="", help="When using --config, only scrape this source ID")
    parser.add_argument("--filter", default="", help="Only include events matching this text")
    parser.add_argument("--output", default="", help="Write JSON to file instead of stdout")
    args = parser.parse_args()

    today_str = date.today().strftime("%Y%m%d")

    # === Config mode: scrape all sources from config file ===
    if args.config:
        config_path = args.config
        # If relative path, resolve from script directory
        if not os.path.isabs(config_path):
            config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), config_path)

        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
        except Exception as e:
            _output({"sources": {}, "all_events": [], "total_count": 0, "date": str(date.today()), "error": f"Config error: {e}"}, args.output)
            sys.exit(0)

        sources_config = config.get("sources", [])
        
        # Filter to single source if --source is specified
        if args.source:
            sources_config = [s for s in sources_config if s.get("id") == args.source]
            if not sources_config:
                _output({"sources": {}, "all_events": [], "total_count": 0, "date": str(date.today()), "error": f"Source '{args.source}' not found in config"}, args.output)
                sys.exit(0)

        result_sources = {}
        all_events = []

        for source in sources_config:
            source_id = source.get("id", "unknown")
            url_path = source.get("url", "sport").strip("/")
            if not url_path.startswith("sport"):
                url_path = f"sport/{url_path}"
            url = f"https://www.tv.nu/{url_path}"

            try:
                html = fetch_html(url)
                events = parse_events(html, today_str, args.filter or None)
            except Exception as e:
                events = []

            result_sources[source_id] = {
                "name": source.get("name", source_id),
                "events": events,
                "count": len(events),
                "icon": source.get("icon", "mdi:trophy"),
                "accent_color": source.get("accent_color", "#667eea"),
                "url": url,
            }
            all_events.extend(events)

        # Deduplicate all_events by time+title
        seen = set()
        unique_events = []
        for ev in all_events:
            key = f"{ev.get('time','')}_{ev.get('title','')}".lower()
            if key not in seen:
                seen.add(key)
                unique_events.append(ev)
        unique_events.sort(key=lambda e: e.get("time") or "99:99")

        result = {
            "sources": result_sources,
            "all_events": unique_events,
            "total_count": len(unique_events),
            "date": str(date.today()),
            "configured_sources": [{"id": s.get("id"), "name": s.get("name")} for s in config.get("sources", [])],
        }
        _output(result, args.output)

    # === Single URL mode ===
    else:
        url_path = (args.url or "sport").strip("/")
        if not url_path.startswith("sport"):
            url_path = f"sport/{url_path}"
        url = f"https://www.tv.nu/{url_path}"

        try:
            html = fetch_html(url)
        except Exception as e:
            _output({"events": [], "date": str(date.today()), "count": 0, "error": str(e), "source_url": url}, args.output)
            sys.exit(0)

        events = parse_events(html, today_str, args.filter or None)
        result = {
            "events": events,
            "date": str(date.today()),
            "count": len(events),
            "source_url": url,
        }
        _output(result, args.output)


def _output(data, output_file=""):
    """Output JSON to stdout or file."""
    output = json.dumps(data, ensure_ascii=False)
    if output_file:
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(output)
    else:
        print(output)


if __name__ == "__main__":
    main()
