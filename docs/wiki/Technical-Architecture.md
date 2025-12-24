# Technical Architecture (v5.1.2)

Habib Punja is built as a **self-contained, single-file HTML application** optimized for broad platform compatibility, including YouTube Playables.

---

## Design Philosophy

### Core Principles
1. **Zero External Dependencies** — No CDN calls, no API requirements
2. **Single File Deployment** — One HTML file contains everything
3. **Offline Capable** — Works without internet after initial load
4. **Platform Agnostic** — Runs on any modern browser

### Why Single File?
- **YouTube Playables compatibility** — Strict sandboxing requirements
- **Simplified deployment** — Upload one file, done
- **Guaranteed availability** — No broken CDN links
- **Version control** — Clear, atomic versioning

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    habib_punja_v5_1_2.html                      │
│                         (~10,700 lines)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    CSS      │  │    HTML     │  │       JavaScript        │  │
│  │  (~3,000)   │  │   (~400)    │  │       (~7,000)          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                  │
│  JavaScript Components:                                          │
│  ├── Card / Deck Classes                                        │
│  ├── GameState (core game logic)                                │
│  ├── AI System (Habot/Jabot decision making)                    │
│  ├── Lotus Mind (EventBus + BanterEngine + BubbleManager)       │
│  ├── UI Rendering                                                │
│  └── Event Handlers                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Lotus Mind Architecture

The banter system uses a tri-layer cognitive architecture:

### Layer A: EventBus (Detection)
```javascript
class EventBus {
    listeners = {};      // Event → Callback mappings
    eventHistory = [];   // Recent event log
    maxHistory = 100;    // Rolling window
    
    on(event, callback)  // Subscribe
    off(event, callback) // Unsubscribe
    emit(event, data)    // Trigger
}
```

### Layer B: BanterEngine (Personality)
```javascript
class BanterEngine {
    characters = {       // Habot, Jabot, MuBot, Joko
        dialoguePools,   // Context-specific lines
        personality,     // Response tendencies
        triggers         // Event subscriptions
    };
    
    init()              // Wire up event listeners
    respond(event)      // Select appropriate dialogue
}
```

### Layer C: BubbleManager (Expression)
```javascript
class BubbleManager {
    activeBubbles = [];  // Max 2 concurrent
    queue = [];          // Overflow queue
    priorities = {};     // Speaker priorities
    sides = {};          // left/right grouping
    lastBubbleTime = {}; // Side-based timing
    sideDelay = 4000;    // 4s minimum gap
    
    show(speaker, type, text, duration)
    display(bubble)
    dismiss(id)
}
```

---

## AI Decision System

### Habot (Aggressive)
```
Evaluation Threshold: LOW (eager to act)
Buy Tendency: HIGH
Publish Timing: EARLY
Risk Tolerance: HIGH
```

### Jabot (Conservative)
```
Evaluation Threshold: HIGH (waits for certainty)
Buy Tendency: LOW
Publish Timing: LATE
Risk Tolerance: LOW
```

### Decision Flow
```
1. Evaluate current hand
2. Find sequences (triples, ladders)
3. Calculate discard values
4. Check publish conditions
5. Evaluate buy opportunities
6. Execute optimal action
```

### Card Evaluation Matrix
The AI tracks all cards:
- Cards in own hand
- Cards discarded (visible)
- Cards in opponent published sequences
- Probability calculations for remaining cards

---

## Buy Window System (v5.1.2)

### State Machine
```
         ┌──────────────────┐
         │    INACTIVE      │ (Red, ✗)
         │   No buy window  │
         └────────┬─────────┘
                  │ Discard event
                  ▼
         ┌──────────────────┐
         │   AI_DECIDING    │ (Amber, ⏳)
         │   3s timeout     │
         └────────┬─────────┘
                  │ AI passes or rotates
                  ▼
         ┌──────────────────┐
         │  HUMAN_ACTIVE    │ (Green, 👆)
         │   16s timeout    │
         └────────┬─────────┘
                  │ Buy or timeout
                  ▼
         ┌──────────────────┐
         │    INACTIVE      │
         └──────────────────┘
```

### Timing
- Visual update first (300ms delay)
- Then buy window activates
- Card must be visible before button turns green

---

## Mobile Optimization (v5.1.2)

### Viewport Strategy
```css
@media (max-width: 768px) and (orientation: portrait) {
    .game-container {
        transform: scale(0.88);
        transform-origin: top center;
    }
}
```

### Why 88% Scale?
- Fits entire game on screen without scrolling
- Matches YouTube Playables portrait requirements
- All elements visible and touchable
- Equivalent to user "pinch to zoom out"

### Touch Optimization
```css
.btn {
    touch-action: manipulation;  /* No 300ms delay */
    -webkit-tap-highlight-color: transparent;
    min-height: 44px;            /* Touch target */
}
```

---

## CSS Architecture

### Custom Properties (Variables)
```css
:root {
    --gold: #ffd700;
    --accent: #3ddc84;
    --radius: 16px;
    --elev: 0 4px 12px rgba(0,0,0,.35);
}
```

### Responsive Breakpoints
| Breakpoint | Target |
|------------|--------|
| `> 768px` | Desktop |
| `≤ 768px` portrait | Mobile portrait |
| `≤ 768px` landscape | Mobile landscape |

### Media Query Strategy
- Mobile-first base styles
- Desktop enhancements via media queries
- Safe area insets for notched devices

---

## Accessibility Implementation

### Multi-Cue Design Pattern
Every state indicator uses multiple cues:
```
Color + Icon + Text + Border + Animation
```

### ARIA Support
```html
<button aria-label="Buy card from discard pile" 
        aria-disabled="true"
        role="button">
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
    * { animation: none !important; }
}
```

---

## Performance Considerations

### Optimization Techniques
- **CSS containment** for isolated repaints
- **Event delegation** for card interactions
- **RequestAnimationFrame** for animations
- **Lazy evaluation** in AI calculations

### File Size
| Component | Approximate Size |
|-----------|------------------|
| HTML Structure | ~15 KB |
| CSS Styles | ~45 KB |
| JavaScript | ~100 KB |
| Embedded Assets | ~0 KB |
| **Total** | **~160 KB** |

---

## Browser Compatibility

### Tested Browsers
| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full support |
| Safari | 14+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |

### Required Features
- CSS Grid / Flexbox
- CSS Custom Properties
- ES6+ JavaScript
- Touch Events API

---

## Deployment

### Static Hosting
The game requires only static file hosting:
- Cloudflare Pages (current)
- GitHub Pages
- Netlify
- Any web server

### Version Control
```
habib_punja_v5_1_2.html
          │
          ├── Major: Breaking changes
          ├── Minor: New features
          └── Patch: Bug fixes
```

---

## Future Architecture Considerations

### Potential Enhancements
- **Module splitting** for code organization
- **Service Worker** for true offline support
- **IndexedDB** for game state persistence
- **WebAssembly** for AI performance
- **Claude API** for dynamic banter

### Current Constraints (YouTube Playables)
- Must remain single-file
- No external API calls during gameplay
- No localStorage/sessionStorage
- Portrait mode primary

---

## Related Pages

- **[Banter System](Banter-System.md)** — Lotus Mind details
- **[Buy Mechanism](Buy-Mechanism.md)** — State machine implementation
- **[YouTube Playables](YouTube-Playables.md)** — Platform requirements

---

**Version:** 5.1.2  
**Last updated:** 2025-12-23
