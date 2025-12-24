# Banter System: Lotus Mind Engine (v5.1.2)

The Lotus Mind is a tri-layer cognitive architecture that brings the four characters to life. It creates the atmosphere of a strategy night with friends—without distracting from gameplay.

> **"Like the lotus flower that rises pure from muddy waters, our AI emerges with personality, wisdom, and purpose."**

---

## Architecture Overview

The Lotus Mind consists of three interconnected layers:

```
┌─────────────────────────────────────────────────────┐
│                  LAYER A: EventBus                  │
│              (Detection & Routing)                  │
│  Monitors game events, triggers appropriate         │
│  character responses                                │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                  LAYER B: BanterEngine              │
│              (Personality & Selection)              │
│  Maintains character state, selects contextual     │
│  dialogue from pools                                │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                  LAYER C: BubbleManager             │
│              (Expression & Rendering)               │
│  Renders comic-style speech bubbles with           │
│  priority queue and timing control                  │
└─────────────────────────────────────────────────────┘
```

---

## Layer A: EventBus (Detection)

The EventBus monitors game events and routes them to appropriate handlers:

### Tracked Events
| Event | Trigger | Typical Responders |
|-------|---------|-------------------|
| `game_started` | New game begins | Joko (hype) |
| `hand_started` | New hand begins | MuBot (strategy) |
| `ai_turn_started` | AI begins turn | — |
| `ai_card_discarded` | AI discards | Habot/Jabot |
| `ai_card_bought` | AI buys | Joko (reaction) |
| `player_published` | Human publishes | MuBot (wisdom) |
| `ai_published` | AI publishes | Joko (hype) |
| `buy_window_opened` | Human can buy | MuBot (advice) |
| `hand_won` | Hand concludes | All characters |
| `game_won` | Championship decided | All characters |

---

## Layer B: BanterEngine (Personality)

Each character has a distinct voice and responds to events in character:

### Character Voices

**Habot (Rabbit)** — Aggressive, confident, taunting
- *"Speed wins games!"*
- *"Too slow, too bad!"*
- *"Momentum is everything!"*

**Jabot (Tortoise)** — Patient, wise, measured
- *"Patience reveals the path."*
- *"Steady progress wins wars."*
- *"No rush. The cards will come."*

**MuBot (Zen Master)** — Strategic wisdom, teaching moments
- *"Consider the war, not just this battle."*
- *"A buy spent rashly is a buy wasted."*
- *"Watch their patterns. Learn their tells."*

**Joko (Hype Commentator)** — Excitement, drama, energy
- *"OH! What a play!"*
- *"The tension is REAL!"*
- *"This is getting GOOD!"*

### Response Probability
- **Primary speaker:** 100% (the character involved in the event)
- **Commentator reaction:** ~30% (MuBot or Joko)
- **Chain response:** ~15% (second character reacts to first)

---

## Layer C: BubbleManager (Expression)

### Visual Rendering
Speech bubbles appear as comic-style overlays:
- White background with character-colored accents
- Tail pointing toward character's position
- Fade-in animation (0.3s)
- Auto-dismiss after calculated duration

### Bubble Positioning (v5.1.2)

Characters are grouped by screen position to prevent overlap:

| Position | Primary | Secondary |
|----------|---------|-----------|
| **LEFT** (above Deck) | MuBot | Habot |
| **RIGHT** (above Discard) | Joko | Jabot |

**Desktop positioning:**
- MuBot/Habot: `left: 15px, top: 130px / 200px`
- Joko/Jabot: `right: 15px, top: 130px / 200px`

**Mobile positioning:**
- Scaled proportionally with safe-area considerations

### Timing Control (v5.1.2)

**Side-Based Delay:** Characters on the same side must wait before speaking:
- **Minimum gap:** 4 seconds between bubbles on same side
- **Purpose:** Prevents MuBot/Habot overlap and Joko/Jabot overlap

**Duration Calculation:**
- Base duration: 6 seconds
- Adjusted by text length (longer text = longer display)
- Maximum: 10 seconds

### Priority System
| Character | Priority | Notes |
|-----------|----------|-------|
| Emergency | 15 | System messages |
| MuBot | 10 | Strategic advisor |
| Joko | 10 | Hype commentator |
| Habot | 5 | AI opponent |
| Jabot | 5 | AI opponent |
| Narration | 1 | Game events |

Higher priority bubbles can replace lower priority ones when the screen is full.

---

## Constraints

### Visual Limits
- **Maximum concurrent bubbles:** 2
- **Queue overflow:** 10 (excess bubbles dropped)
- **Display duration:** 4–10 seconds based on content

### Design Principles
- Banter enhances atmosphere without blocking gameplay
- Characters never interrupt critical game actions
- Strategic advice is helpful but not prescriptive
- Humor is present but never mean-spirited

---

## Implementation Notes

The v5.1.2 engine is intentionally self-contained:
- No external API dependencies
- Static dialogue pools (YouTube Playables compatible)
- Event-driven architecture for easy expansion

### Future Enhancements
- Externalize dialogue to JSON for easier updates
- Localization support for multiple languages
- "Mood" system based on series score
- Comic FX for Joko (fireballs, confetti)
- LLM integration for dynamic responses

---

## Related Pages

- **[Characters](Characters.md)** — Full personality profiles
- **[Technical Architecture](Technical-Architecture.md)** — System design
- **[Accessibility](Accessibility.md)** — Visual accessibility features

---

**Version:** 5.1.2  
**Last updated:** 2025-12-23
