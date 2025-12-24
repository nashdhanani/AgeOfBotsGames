# Accessibility (v5.1.2)

Habib Punja is designed to be playable by everyone. We follow WCAG 2.1 guidelines and prioritize inclusive design throughout the game.

> **"Great games should be playable by all."**

---

## Design Philosophy

Our accessibility approach follows three principles:

1. **Never rely on color alone** — Every visual cue has multiple indicators
2. **Touch-friendly by default** — Large tap targets, generous timing
3. **Clear information hierarchy** — Important info is always visible

---

## Colorblind Support

### The Challenge
Approximately 8% of males and 0.5% of females have some form of color vision deficiency. Our game uses color extensively for suits, turn indicators, and the buy button.

### Our Solution: Multi-Cue Design

Every color-coded element includes **multiple distinguishing features**:

#### Card Suits
| Suit | Color | Symbol | Font Style |
|------|-------|--------|------------|
| ♠ Spades | Black | ♠ | Bold |
| ♥ Hearts | Red | ♥ | Italic |
| ♦ Diamonds | Orange/Gold | ♦ | Regular |
| ♣ Clubs | Blue | ♣ | Serif |

Each suit has a **unique combination** of color AND typography, ensuring players can distinguish cards even without color perception.

#### Buy Button (Three-State System)
| State | Color | Icon | Text | Border | Animation |
|-------|-------|------|------|--------|-----------|
| **Your Turn** | Green | 👆 | "BUY!" | Thick solid | Pulsing |
| **AI Deciding** | Amber | ⏳ | "AI..." | Dashed | None |
| **Inactive** | Red | ✗ | "Buy" | Thin | None |

**Five distinct cues** ensure the button state is clear regardless of color vision:
1. Color (primary)
2. Icon (👆 / ⏳ / ✗)
3. Text content
4. Border style (solid/dashed/thin)
5. Animation (pulsing only when actionable)

#### Turn Indicator
| State | Color | Animation | Text |
|-------|-------|-----------|------|
| Your Turn | Green | Pulsing glow | "Your Turn" |
| AI Turn | Gray | None | "Habot" / "Jabot" |

---

## Visual Accessibility

### Contrast Ratios
- Card text on white background: **>7:1** (AAA compliant)
- UI text on dark background: **>4.5:1** (AA compliant)
- Important indicators: **>3:1** minimum

### Text Sizing
- Minimum touch target: **44x44 pixels**
- Card rank/suit: Large, clear typography
- Responsive scaling for different screen sizes

### Reduced Motion
The game respects the `prefers-reduced-motion` media query:
- Pulsing animations can be disabled
- Transitions remain functional but simplified

---

## Mobile Accessibility

### Touch Targets
All interactive elements meet minimum size requirements:
- Buttons: 44x44 pixels minimum
- Cards: Large enough for accurate selection
- Deck/Discard: Easy to distinguish and tap

### Portrait Mode Optimization (v5.1.2)
- **88% scale transform** fits entire game on screen
- No scrolling required during gameplay
- All elements visible without zooming

### Timing Accommodations
- **16-second buy window** for human players (extended for mobile)
- Clear countdown timer with color change at 2 seconds
- No time pressure during your turn (take as long as needed)

---

## Cognitive Accessibility

### Clear Game State
- Turn indicator always shows whose turn it is
- Hand requirements displayed prominently
- Score tracker visible at all times

### Consistent Patterns
- Same interaction patterns throughout all 7 hands
- AI behavior is learnable and predictable
- No hidden mechanics or surprise rules

### Progressive Complexity
- Hand 1 is simplest (2 triples)
- Complexity increases gradually
- Strategy guide available for learning

---

## Screen Reader Considerations

While primarily a visual card game, we've implemented:
- Semantic HTML structure
- ARIA labels on interactive elements
- Logical tab order
- Text alternatives for visual states

### Current Limitations
- Card images require visual interpretation
- Some game events communicated primarily through visual bubbles
- Full screen reader support is a future enhancement goal

---

## Accessibility Testing

### Tested Configurations
| Platform | Browser | Status |
|----------|---------|--------|
| iOS | Safari | ✅ Verified |
| iOS | Chrome | ✅ Verified |
| Android | Chrome | ✅ Verified |
| Windows | Chrome | ✅ Verified |
| Windows | Firefox | ✅ Verified |
| Windows | Edge | ✅ Verified |

### Color Vision Testing
- Simulated deuteranopia (red-green)
- Simulated protanopia (red-green)
- Simulated tritanopia (blue-yellow)
- All states distinguishable through non-color cues

---

## Providing Feedback

We're committed to improving accessibility. If you encounter barriers:

1. **In-Game:** Use the thumbs-down feedback button
2. **Contact:** https://AgeOfBotsGames.com/contact.html
3. **Accessibility Page:** https://AgeOfBotsGames.com/accessibility.html

---

## WCAG 2.1 Compliance Summary

| Criterion | Level | Status |
|-----------|-------|--------|
| 1.1.1 Non-text Content | A | Partial |
| 1.3.1 Info and Relationships | A | ✅ |
| 1.4.1 Use of Color | A | ✅ |
| 1.4.3 Contrast (Minimum) | AA | ✅ |
| 1.4.11 Non-text Contrast | AA | ✅ |
| 2.1.1 Keyboard | A | ✅ |
| 2.3.1 Three Flashes | A | ✅ |
| 2.4.4 Link Purpose | A | ✅ |
| 2.5.5 Target Size | AAA | ✅ |

---

## Related Pages

- **[Buy Mechanism](Buy-Mechanism.md)** — Three-state button details
- **[Game Overview](Game-Overview.md)** — Core mechanics
- **[YouTube Playables](YouTube-Playables.md)** — Platform requirements

---

**Version:** 5.1.2  
**Last updated:** 2025-12-23
