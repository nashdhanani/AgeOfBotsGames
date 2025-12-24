# Buy Mechanism (v5.1.2)

The buy mechanism allows players to claim a recently discarded card "out of turn." This is a powerful strategic tool—but buys are limited, so use them wisely.

---

## How Buying Works

### The Buy Window
When a player discards, a **buy window** opens for the player who is "out of turn" (skipped in normal rotation):

| Who Discarded | First Buy Opportunity | Second Buy Opportunity |
|---------------|----------------------|------------------------|
| **Human** | Jabot | — |
| **Habot** | Human | — |
| **Jabot** | Habot | Human (if Habot passes) |

### Buy Cost
Buying a card comes with a cost:
- You receive the discarded card
- You **also draw a penalty card** from the deck
- Your buy count decreases by 1

### Buy Limits
- **Hands 1–6:** 3 buys per player per hand
- **Hand 7:** Fewer buys (increased difficulty)
- Unused buys **do not** carry over between hands

---

## The Three-State Buy Button (v5.1.2)

The Buy button uses a **three-state visual system** with multiple accessibility cues:

### 🟢 GREEN — Your Turn to Buy
| Attribute | Value |
|-----------|-------|
| **Color** | Green gradient |
| **Icon** | 👆 |
| **Text** | "BUY! (Xs)" |
| **Border** | Thick solid (3px) |
| **Animation** | Pulsing glow |
| **Action** | Tap/click to buy |

**Meaning:** The discarded card is on the pile and YOU can buy it. Timer shows remaining seconds.

### 🟡 AMBER — AI Deciding
| Attribute | Value |
|-----------|-------|
| **Color** | Amber/Yellow gradient |
| **Icon** | ⏳ |
| **Text** | "AI... (Xs)" |
| **Border** | Dashed (3px) |
| **Animation** | None |
| **Action** | Wait (disabled) |

**Meaning:** An AI opponent (Habot or Jabot) has the buy window. Watch and wait.

### 🔴 RED — No Buy Window
| Attribute | Value |
|-----------|-------|
| **Color** | Red gradient |
| **Icon** | ✗ |
| **Text** | "Buy" |
| **Border** | Thin (1px) |
| **Animation** | None |
| **Action** | None (disabled) |

**Meaning:** No buy window is active. This is the default state.

---

## Accessibility Design

The buy button was designed to be **colorblind-friendly** using four distinct visual cues:

1. **Color** — Green / Amber / Red (works for most users)
2. **Icon** — 👆 / ⏳ / ✗ (universally distinct)
3. **Text** — "BUY!" / "AI..." / "Buy" (clearly different)
4. **Border Style** — Solid / Dashed / Thin (distinguishable by shape)
5. **Animation** — Pulsing (only on actionable state)

This approach follows **WCAG 2.1 guidelines** for not relying on color alone to convey information.

---

## Timing (v5.1.2)

### Visual-First Approach
The buy window activates **after** the discarded card appears on the pile:
1. Player discards card
2. Card renders on discard pile (300ms delay)
3. Buy window opens with appropriate button state
4. Timer begins countdown

### Duration
| Player | Buy Window Duration |
|--------|---------------------|
| **Human** | 16 seconds |
| **AI** | 3 seconds |

The extended human duration (16s) accommodates mobile touch interfaces.

---

## Strategic Considerations

### When to Buy
✅ Card completes or nearly completes a sequence  
✅ Card is a key rank you've been tracking  
✅ Denying an opponent a critical card  
✅ Early in a hand when you have buys to spare

### When NOT to Buy
❌ Card only marginally improves your hand  
❌ You're low on buys and it's not Hand 7 yet  
❌ The penalty card risk outweighs the gain  
❌ You're already close to publishing

### AI Buy Behavior
- **Habot** buys aggressively, especially for momentum plays
- **Jabot** buys conservatively, only when it clearly improves position

---

## The Buy Window Flow (Example)

```
Turn: Habot
┌──────────────────────────────────────────┐
│ 1. Habot evaluates hand                  │
│ 2. Habot discards 7♠                     │
│ 3. 7♠ appears on discard pile            │
│ 4. Buy button turns 🟢 GREEN             │
│    "👆 BUY! (16s)"                       │
│ 5. Human has 16 seconds to decide        │
│    - If Human buys: receives 7♠ + penalty│
│    - If Human passes: window closes      │
│ 6. Buy button turns 🔴 RED               │
│ 7. Human's turn begins                   │
└──────────────────────────────────────────┘

Turn: Jabot
┌──────────────────────────────────────────┐
│ 1. Jabot discards K♦                     │
│ 2. K♦ appears on discard pile            │
│ 3. Buy button turns 🟡 AMBER             │
│    "⏳ AI... (3s)"                       │
│ 4. Habot has 3 seconds to decide         │
│    - If Habot passes and has no buys...  │
│ 5. Buy window rotates to Human           │
│ 6. Buy button turns 🟢 GREEN             │
│    "👆 BUY! (16s)"                       │
│ 7. Human can now buy K♦                  │
└──────────────────────────────────────────┘
```

---

## Related Pages

- **[Game Overview](Game-Overview.md)** — Core game mechanics
- **[Strategy & Tactics](Strategy-and-Tactics.md)** — When to buy strategically
- **[Accessibility](Accessibility.md)** — Full accessibility features

---

**Version:** 5.1.2  
**Last updated:** 2025-12-23
