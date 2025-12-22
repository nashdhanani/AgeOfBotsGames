# Banter System (Minimal Engine v1)

Goal: create the atmosphere of a strategy night with friends—without distracting from the game.

**Key constraints**
- Max 2 bubbles visible at once (desktop)
- On small screens: 1 bubble routed to a bottom “banter bar”
- Short-lived display (3–4 seconds)
- Banter reacts to events, and sometimes chains into a second character response

---

## Visual Anchors (Current Board)

- **Habot bubble** appears near Habot’s points panel
- **Jabot bubble** appears near Jabot’s points panel
- **MuBot bubble** appears near the deck (draw pile)
- **Joko bubble** appears near the discard pile

---

## Trigger Model (v1)

Event → optional chain:

1) **Game event** (buy / publish / nuke / last-card warning / etc.)  
2) **Speaker** (Habot/Jabot)  
3) **Commentator reaction** (MuBot/Joko at ~30% chance)  
4) Optional second reaction (15%)

---

## Implementation Notes

The v1 engine is intentionally minimal:
- no external dependencies
- simple line pools per character
- event hooks sprinkled into existing game logic

Future upgrades:
- externalize lines to JSON
- localize by language
- “mood” system based on series score
- comic FX (e.g., Joko fireballs)
