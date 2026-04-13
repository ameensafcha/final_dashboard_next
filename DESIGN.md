# Design System Documentation: The Luminous Dashboard
 
## 1. Overview & Creative North Star
 
**Creative North Star: The Organic Atelier**
This design system rejects the clinical coldness of traditional enterprise software. Instead, it draws inspiration from high-end editorial layouts and organic, sun-drenched architectural spaces. It is designed to feel like a "living" workspace—fluid, warm, and highly curated.
 
To move beyond the "template" look, we leverage **intentional asymmetry** and **tonal layering**. We replace rigid grid lines with soft transitions of light. The interface doesn't just display data; it cradles it within a series of semi-translucent, high-radius surfaces that mimic frosted glass resting on a warm, creamy parchment. This is a "High-End Editorial" experience where negative space is as functional as the content itself.
 
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
 
## 3. Typography
 
The system utilizes a dual-font strategy to balance character with readability.
 
*   **Display & Headlines (Manrope):** Chosen for its geometric purity and modern proportions. Use large scales (`display-lg` at 3.5rem) with tighter letter-spacing (-2%) to create an editorial, "poster-like" feel in dashboard summaries.
*   **Title & Body (Inter):** The workhorse. Its neutral, high-legibility architecture ensures that complex data remains digestible. Use `title-md` for card headings and `body-md` for standard data.
*   **Hierarchy as Brand:** Use extreme contrast in scale. A massive `display-sm` metric (e.g., "78 Employe") paired with a tiny, uppercase `label-sm` creates an "App-like" luxury feel rather than a standard "Website" feel.
 
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
*   **Primary:** High-contrast `on-secondary` text on a `secondary` (#5f5e5e) background. Corner radius: `full`.
*   **Secondary:** `primary-container` (#ffd54f) with `on-primary-container` text. This provides a "warm glow" without the heaviness of the dark grey.
*   **States:** Hover states should involve a subtle scale-up (1.02x) rather than just a color change to maintain the "physical" feel.
 
### Chips & Tags
*   **Selection Chips:** Use `secondary_fixed` with `full` roundness.
*   **Layout:** Forbid divider lines between list items. Use 12px-16px of vertical padding and a background shift on hover to indicate interactivity.
 
### Cards & Data Visualization
*   **Roundness:** All cards must use `xl` (3rem) or `lg` (2rem) corner radius.
*   **The Progress Track:** Progress bars (like the "Output" meter in the reference) should use a subtle striped texture or a semi-transparent `outline-variant` track to maintain lightness.
 
### Input Fields
*   **Styling:** No bottom borders. Use a `surface-container-highest` background with a `sm` (0.5rem) radius for the container. Labels should be `label-md` and placed outside the container for an airy feel.
 
---
 
## 6. Do's and Don'ts
 
### Do:
*   **Use Asymmetry:** Place smaller metrics next to large graphic elements to create visual interest.
*   **Embrace the Glow:** Use the `primary-container` (#FFD54F) as a highlight for progress rings and icons to guide the eye.
*   **Maximize Roundness:** Use at least 24px (`md` scale) for all containers. This is the hallmark of the "Soft" aesthetic.
 
### Don't:
*   **Don't Use Dividers:** Never use a solid line to separate content. Use whitespace or a subtle background tone change.
*   **Don't Use Pure White:** Avoid using `#ffffff` for the main background. The `surface` (#fbfaf1) provides the necessary warmth. Use white only for the "top-most" glass layers.
*   **Don't Over-Shadow:** If more than three elements on a screen have shadows, the interface will feel cluttered. Use tonal layering first; use shadows only for transient elements (modals/tooltips).