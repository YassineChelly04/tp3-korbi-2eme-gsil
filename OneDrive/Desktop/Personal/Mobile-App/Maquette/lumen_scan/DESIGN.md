# Design System Document: Precision Scan Protocol

## 1. Overview & Creative North Star
**Creative North Star: The Digital Architect**
This design system moves away from the "consumer app" aesthetic and toward a "high-performance tool" environment. It is inspired by architectural blueprints and terminal interfaces—environments where precision is paramount and distraction is a liability. 

We break the "template" look by utilizing **intentional asymmetry** and **brutalist spacing**. Instead of centered, rounded layouts, we lean into hard edges, monospace metadata, and a strict adherence to a grid that feels "engineered" rather than "decorated." The interface should feel like a piece of high-end hardware: cold, reliable, and incredibly fast.

---

## 2. Colors & Surface Logic
The palette is rooted in deep obsidian tones, punctuated by a high-frequency "Electric Blue."

### The "No-Line" Rule
Traditional 1px borders are forbidden for sectioning. We define space through **Tonal Stepping**. A section does not "end" with a line; it transitions from `surface` to `surface_container_low`. This creates a seamless, sophisticated flow that feels like a single, machined object.

### Surface Hierarchy & Nesting
*   **Base Layer:** `surface` (#131313) – The primary canvas.
*   **Secondary Content:** `surface_container_low` (#1c1b1b) – Used for sidebars or secondary lists.
*   **Active Elements:** `surface_container_high` (#2a2a2a) – Used for active states or "lifted" interactive zones.
*   **The Depth Principle:** Nesting should always move from Dark to Light. An input field (`surface_container_highest`) should sit inside a card (`surface_container_low`), which sits on the `background`. This "inverted" depth mimics light hitting the top of a recessed physical button.

### Glass & Signature Accents
*   **The Utility Glow:** Use `primary` (#a1c9ff) at 10% opacity for "Glassmorphism" overlays in the camera viewfinder. Apply a `20px` backdrop blur to create a "frosted lens" effect for floating controls.
*   **No Gradients:** We maintain a "Flat-Precision" aesthetic. Color shifts are immediate and binary.

---

## 3. Typography
We utilize a dual-font strategy to balance editorial authority with technical precision.

*   **Display & Headlines (Public Sans):** High-contrast sizing. `display-lg` should be used sparingly for empty states or branding, creating an "Editorial" feel.
*   **Body (Public Sans):** Set with generous line-height (1.5x) to ensure readability against the dark background.
*   **Labels & Metadata (Public Sans):** This is our "signature" font. All technical data—file sizes, timestamps, OCR confidence scores—must use `label-md` or `label-sm` in Public Sans. The monospace-adjacent feel reinforces the "Precision" brand.

**Hierarchy Tip:** Always pair a `headline-sm` (Public Sans, Bold) with a `label-sm` (Public Sans, Regular) for a "Form-meets-Function" header style.

---

## 4. Elevation & Depth
In this system, elevation is a product of **Light, not Shadow.**

*   **Tonal Layering:** To "elevate" a document preview, do not use a drop shadow. Instead, give the preview a `0.5px` "Ghost Border" using `outline_variant` at 15% opacity. 
*   **Ambient Shadows:** If a floating action button (FAB) requires a shadow for legibility over a busy camera feed, use the `on_surface` color at 6% opacity with a `48px` blur. It should feel like a soft atmospheric glow, not a "drop" shadow.
*   **The "Illuminated Edge":** For active states (like a selected scan), use a 2px `primary` stroke. This is the only time a high-contrast border is permitted.

---

## 5. Components

### The Scanner Interface (Core Component)
*   **Edge Detection Polygon:** 2px stroke using `primary_container`. No fill.
*   **Corner Handles:** 12px circles using `primary`. Must have a 2px `surface` (white-equivalent in dark mode) outer stroke to "pop" against dark document backgrounds.
*   **Real-time Metadata:** Use `label-sm` (Public Sans) inside a `surface_container_highest` badge with `0.25rem` (sm) roundedness.

### Buttons
*   **Primary:** Solid `primary_container`. Text in `on_primary_container`. No rounded corners (use `sm` scale - 0.125rem).
*   **Secondary (Ghost):** No background. 1px `outline_variant` (at 20% opacity).
*   **Tertiary:** Text-only using `primary` color.

### Inputs & Metadata Fields
*   **The Monospace Input:** File names should be edited in a field that uses `label-md` (Public Sans). 
*   **Validation:** Use `error` (#ffb4ab) for edge-case alerts, but apply it only to the text or a 2px left-border accent, never a full red box.

### Lists & Navigation
*   **No Dividers:** Separate list items using `spacing-4` (0.9rem) of vertical whitespace. 
*   **Active State:** Indicate selection by changing the background to `surface_container_high` and adding a 2px vertical "pill" of `primary` color to the far left edge.

---

## 6. Do's and Don'ts

### Do
*   **DO** use `Public Sans` for anything that feels like "Data."
*   **DO** lean into "Near-Black" (#0D0D0D) for the background to save battery and reduce eye strain.
*   **DO** use `0.25rem` (DEFAULT) roundedness for almost everything; it feels more "engineered" than circular corners.
*   **DO** use the `surface_container` tiers to create hierarchy.

### Don't
*   **DON'T** use a standard #000000 black; it kills the "premium" depth of the `surface` tokens.
*   **DON'T** use 1px solid white borders. They are too aggressive. Use `outline_variant` at low opacity.
*   **DON'T** use icons with fills. Use "Linear" icons with a 1.5px stroke weight to match the "Precision" vibe.
*   **DON'T** use center-alignment for headers. Keep everything flush-left to maintain the "Architectural" grid.