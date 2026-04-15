# Design System Documentation: The Luminous Dashboard

## ⚠️ STRICT RULE: Use global.css for All UI
**All UI components must use CSS variables from `global.css`. Never hardcode colors, fonts, or spacing. Always reference `--variable-name` from global.css.**

Example:
```tsx
// ✅ CORRECT - Use global.css variables
<div className="bg-[var(--primary)] text-[var(--foreground)] rounded-[var(--radius-xl)]">

// ❌ WRONG - Hardcoded values
<div className="bg-[#735c00] text-gray-900 rounded-[2.5rem]">
```

---

## 1. Overview & Creative North Star

**Creative North Star: The Organic Atelier**
This design system rejects the clinical coldness of traditional enterprise software. Instead, it draws inspiration from high-end editorial layouts and organic, sun-drenched architectural spaces. It is designed to feel like a "living" workspace—fluid, warm, and highly curated.

To move beyond the "template" look, we leverage **intentional asymmetry** and **tonal layering**. We replace rigid grid lines with soft transitions of light. The interface doesn't just display data; it cradles it within a series of semi-translucent, high-radius surfaces that mimic frosted glass resting on a warm, creamy parchment. This is a "High-End Editorial" experience where negative space is as functional as the content it.

---

## 2. Colors & Surface Philosophy

The palette is anchored in a sophisticated "warm-on-warm" strategy, punctuated by deep charcoal for authoritative focus.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Structural boundaries must be defined solely through:
1.  **Background Color Shifts:** E.g., placing a `surface-container-low` component onto a `surface` background.
2.  **Soft Tonal Transitions:** Using subtle value changes to suggest an edge.
3.  **Vertical Space:** Utilizing the spacing scale to create mental groupings.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials. 
*   **Base Layer (`surface` / `#fbfaf1`):** The foundational "desk" surface.
*   **Nested Containers:** Use `surface-container-lowest` to `surface-container-highest` to create depth. To make a card "pop," don't add a border; simply drop its background color by one step in the tier (e.g., a `surface-container-lowest` card sitting inside a `surface-container-low` section).

### The "Glass & Gradient" Rule
To achieve professional "soul," use **Glassmorphism** for floating elements (modals, dropdowns, navigation bars).
*   **Recipe:** `surface-container-lowest` at 60-80% opacity + `backdrop-filter: blur(20px)`.
*   **Signature Textures:** For high-impact CTAs, use a linear gradient from `primary` (#735c00) to `primary-container` (#ffd54f) at a 135° angle to create a sense of tactile glow.

---

## 3. Typography Scale

The system utilizes a dual-font strategy to balance character with readability.

| Style | Font | Size | Weight | Line Height | Usage |
|-------|------|------|--------|-------------|-------|
| **Display Hero** | Manrope | 96px (6rem) | 400 | 1.20 | Hero sections, large metrics |
| **Section Heading** | Manrope | 36px (2.25rem) | 500 | 1.33 | Page titles, section headers |
| **Sub-heading** | Manrope | 24px (1.5rem) | 500 | 1.33 | Card headings, subsection titles |
| **Body Light** | Inter | 16px (1rem) | 300 | 1.50 | Taglines, descriptive text |
| **Body** | Inter | 16px (1rem) | 400 | 1.50 | Standard body text |
| **Code Label** | Source Code Pro | 14px | 400 | - | Uppercase labels, collection names |
| **Code Body** | Source Code Pro | 16px | 400 | - | Code snippets, queries |
| **Code Micro** | Source Code Pro | 9px | 600 | - | Uppercase labels, small annotations |
| **Label Small** | Inter | 12px | 700 | - | Uppercase labels, badges |

### Font Families (defined in global.css)
- **Display/Headlines:** `var(--font-display)` = 'Manrope'
- **Body/UI:** `var(--font-body)` = 'Inter'  
- **Code:** `var(--font-mono)` = 'Source Code Pro'

### Typography Usage Guidelines
```tsx
// ✅ CORRECT - Use typography classes from global.css
<h1 className="text-section font-display">Page Title</h1>
<p className="text-body-light">Tagline goes here</p>
<span className="text-code-label">DATABASE</span>
<span className="text-code-micro">AGGREGATION</span>

// ❌ WRONG - Hardcoded typography
<h1 className="text-4xl font-bold">Page Title</h1>
```

---

## 4. Elevation & Depth

We convey importance through **Tonal Layering** and ambient light physics.

*   **The Layering Principle:** Depth is achieved by stacking. A `surface-container-lowest` (#ffffff) element provides a natural "lift" when placed against the creamy `surface` (#fbfaf1).
*   **Ambient Shadows:** For floating components, shadows must be "extra-diffused." Use a blur radius of at least 40px and an opacity of 4%-6%. The shadow color should be a warm grey/brown (derived from `on-surface`) to mimic natural light, never pure black.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` token at 15% opacity. High-contrast, 100% opaque borders are forbidden.
*   **Glassmorphism Depth:** When using backdrop blurs, the content behind should be slightly visible. This "bleed-through" softens the UI, making it feel integrated into the environment rather than a separate layer.

---

## 5. Components

### Buttons
*   **Primary:** Use `.btn-primary` class or `var(--secondary)` background with `var(--secondary-foreground)` text. Corner radius: `var(--radius-full)`.
*   **Secondary:** Use `.btn-secondary` class or `var(--primary-container)` background with `var(--primary)` text.
*   **States:** Hover states should involve `transform: var(--hover-scale)` (1.02x) rather than just a color change.

### Chips & Tags
*   **Selection Chips:** Use `var(--secondary)` with `var(--radius-full)` roundness.
*   **Layout:** Forbid divider lines between list items. Use 12px-16px of vertical padding and a background shift on hover to indicate interactivity.

### Cards & Data Visualization
*   **Roundness:** All cards must use `var(--radius-xl)` (40px) or `var(--radius-lg)` (32px). Minimum is `var(--radius-md)` (24px).
*   **Card Class:** Use `.glass-card` or `.surface-card` utility classes.

### Input Fields
*   **Styling:** Use `.input-field` class or set:
  - Background: `var(--surface-container-low)`
  - Border: none
  - Radius: `var(--radius-md)` (24px minimum)
  - No bottom borders

---

## 6. Do's and Don'ts

### Do:
*   **Use Asymmetry:** Place smaller metrics next to large graphic elements to create visual interest.
*   **Embrace the Glow:** Use `var(--primary-container)` (#FFD54F) as a highlight for progress rings and icons to guide the eye.
*   **Maximize Roundness:** Use at least 24px (`var(--radius-md)`) for all containers. This is the hallmark of the "Soft" aesthetic.
*   **Use Global CSS:** Always reference variables from `global.css`. Never hardcode values.

### Don't:
*   **Don't Use Dividers:** Never use a solid line to separate content. Use whitespace or a subtle background tone change.
*   **Don't Use Pure White:** Avoid using `#ffffff` for the main background. Use `var(--surface)` (#fbfaf1) for warmth. Use white only for the "top-most" glass layers.
*   **Don't Over-Shadow:** If more than three elements on a screen have shadows, the interface will feel cluttered. Use tonal layering first; use shadows only for transient elements (modals/tooltips).
*   **Don't Hardcode:** Never hardcode colors, fonts, spacing, or border-radius. Always use `var(--variable-name)` from global.css.
