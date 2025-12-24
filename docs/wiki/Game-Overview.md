# Habib Punja: Strategic 7-Hand War (v5.1.2)

Play: https://AgeOfBotsGames.com

Habib Punja is a 3-player strategic card game presented as a **7-hand championship**.  
Your goal is not to "win every hand," but to **win the war** by managing risk and avoiding devastating losses.

---

## Core Concepts

### The 7-Hand War
- One hand lost ≠ game lost
- Avoid catastrophic "nuke" hands
- Winning **4+ hands** typically secures the championship
- Consistent small losses are better than a single devastating loss
- Maintain a **"battle vs war"** mentality

### Builds and Requirements
Each hand has a different build requirement (triples and/or ladders). Requirements increase in complexity across the seven hands.

| Hand | Name | Requirement | Difficulty |
|------|------|-------------|------------|
| 1 | Foundations | 2 Triples | ⭐ |
| 2 | Balance | 1 Triple + 1 Ladder | ⭐⭐ |
| 3 | Ascent | 2 Ladders | ⭐⭐ |
| 4 | Crowd | 3 Triples | ⭐⭐⭐ |
| 5 | Architect | 2 Triples + 1 Ladder | ⭐⭐⭐ |
| 6 | Duel | 1 Triple + 2 Ladders | ⭐⭐⭐⭐ |
| 7 | Master | 3 Ladders (fewer buys) | ⭐⭐⭐⭐⭐ |

### Buying
Buying adds a card to your hand (plus a penalty card from the deck), but buys are limited. Each player starts with **3 buys per hand** (fewer in Hand 7).

**Key buying principles:**
- Buys are a strategic resource, not a reflex
- Buy only when it materially improves your build path
- Track remaining buys—they don't carry over between hands

See: **[Buy Mechanism](Buy-Mechanism.md)** for the complete buy window system.

### Publishing
Publishing locks your build for the hand. Once published, your sequences are visible to all players and can be extended by anyone.

**Publishing timing trade-offs:**
- **Early publishing:** Wins tempo, reduces hand size, but locks you in
- **Late publishing:** More stability, but risks being outpaced

### The Glass Vault (Discard Pile)
The discard pile follows a "glass vault" rule:
- Only the **top card** (most recently discarded) is available
- When someone takes from the discard pile, the vault **locks**
- Next player must draw from the deck
- The vault **unlocks** when a new card is discarded

---

## Win Condition (Championship)

The championship is determined across all seven hands. Optimize for:

- Maximizing hand wins
- Minimizing large negative outcomes (nukes)
- Exploiting opponent tendencies (Habot vs Jabot)
- Making endgame decisions based on current series score

---

## The Opponents

### Habot (Rabbit) 🐰
Fast, aggressive, momentum-driven. Publishes early, buys aggressively.
- **Counter:** Bait into overcommitting, play the long game

### Jabot (Tortoise) 🐢
Patient, threshold-based, surgical. Waits for stability before publishing.
- **Counter:** Apply tempo pressure, deny predictable ladder paths

See: **[Characters](Characters.md)** for full personality profiles.

---

## Links

- **Play Now:** https://AgeOfBotsGames.com
- **Strategy Guide:** https://AgeOfBotsGames.com/strategic-guide.html
- **Characters:** https://AgeOfBotsGames.com/characters.html
- **Accessibility:** https://AgeOfBotsGames.com/accessibility.html

---

**Version:** 5.1.2  
**Last updated:** 2025-12-23
