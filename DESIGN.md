---
name: Heritage Security
colors:
  surface: '#111415'
  surface-dim: '#111415'
  surface-bright: '#37393b'
  surface-container-lowest: '#0c0e10'
  surface-container-low: '#1a1c1e'
  surface-container: '#1e2022'
  surface-container-high: '#282a2c'
  surface-container-highest: '#333537'
  on-surface: '#e2e2e5'
  on-surface-variant: '#d0c5af'
  inverse-surface: '#e2e2e5'
  inverse-on-surface: '#2f3133'
  outline: '#99907c'
  outline-variant: '#4d4635'
  surface-tint: '#e9c349'
  primary: '#f2ca50'
  on-primary: '#3c2f00'
  primary-container: '#d4af37'
  on-primary-container: '#554300'
  inverse-primary: '#735c00'
  secondary: '#c8c8b0'
  on-secondary: '#303221'
  secondary-container: '#494a38'
  on-secondary-container: '#b9baa3'
  tertiary: '#ceced1'
  on-tertiary: '#2f3133'
  tertiary-container: '#b2b3b5'
  on-tertiary-container: '#444547'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffe088'
  primary-fixed-dim: '#e9c349'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#e4e4cc'
  secondary-fixed-dim: '#c8c8b0'
  on-secondary-fixed: '#1b1d0e'
  on-secondary-fixed-variant: '#474836'
  tertiary-fixed: '#e2e2e5'
  tertiary-fixed-dim: '#c6c6c9'
  on-tertiary-fixed: '#1a1c1e'
  on-tertiary-fixed-variant: '#454749'
  background: '#111415'
  on-background: '#e2e2e5'
  surface-variant: '#333537'
typography:
  h1:
    fontFamily: Newsreader
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
spacing:
  unit: 8px
  gutter: 24px
  margin: 48px
  max_width: 1280px
---

## Brand & Style

This design system is built upon the concept of "Digital Fortification." It bridges the gap between historical architectural strength and modern cryptographic security. The brand personality is authoritative, timeless, and impenetrable, designed to evoke the same emotional reassurance as a physical vault or an ancient citadel.

The design style is **Tactile & Architectural**. It utilizes physical metaphors—heavy borders, stone-like textures, and metallic accents—to create a sense of permanence. Unlike fleeting digital trends, this system prioritizes a "built-to-last" aesthetic, using subtle skeuomorphism and structured layouts to imply that the user's data is housed within a secure, physical structure.

## Colors

The palette is centered on a high-contrast, prestigious trinity:
*   **Deep Charcoal (#1A1C1E):** The primary foundation. It represents the shadowed stone of a fortress, providing a heavy, secure base for all interfaces.
*   **Burnished Gold (#D4AF37):** Used sparingly for primary actions, high-level branding, and "key" security moments. It suggests value, nobility, and the literal "golden key."
*   **Parchment White (#F5F5DC):** The primary surface color for high-readability areas and content containers, offering a tactile, historical feel that contrasts against the charcoal depths.

Secondary neutrals should include muted slate and oxidized metal tones to bridge the gap between the charcoal and gold.

## Typography

This design system employs a tiered typographic hierarchy to balance heritage and utility. 

**Newsreader** serves as the authoritative voice for all headings. It should be used for titles, page headers, and significant callouts to reinforce the "stately" nature of the brand.

**Inter** is the functional workhorse. It is used for all UI elements, data tables, and body copy. Its neutrality ensures that even complex security settings remain legible and professional. Small labels and metadata should use Inter in all-caps with increased letter-spacing to mimic the look of architectural inscriptions.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model to maintain a sense of structural integrity. Interfaces should feel symmetrical and balanced, avoiding overly "organic" or fluid placements.

A 12-column grid is used for desktop layouts, with generous margins (48px) to allow the content to breathe. Spacing is strictly based on an 8px scale. Components should use larger internal padding (e.g., 24px or 32px) to emphasize a sense of "heft" and spatial significance. Vertical rhythm should be disciplined, favoring large gaps between sections to denote importance.

## Elevation & Depth

In this design system, depth is achieved through **Tonal Layers and Subtle Textures** rather than aggressive shadows. 

1.  **Backgrounds:** Use a faint, low-opacity "stone" texture on Charcoal backgrounds and a "grainy parchment" texture on light surfaces. 
2.  **Inset Surfaces:** Input fields and secondary containers should appear "carved" into the surface using subtle inner shadows or 1px borders that are slightly darker than the background.
3.  **Raised Elements:** Modals and primary cards should use a 2px solid border in Burnished Gold or a lighter Charcoal shade, paired with a very soft, large-radius ambient shadow (#000000 at 25% opacity) to suggest they are sitting on top of the foundation.

## Shapes

The shape language is strictly **Sharp (0px)**. To reflect the geometry of a castle and traditional architecture, all buttons, containers, and input fields must have square corners. 

Rounded corners are seen as too soft and modern for this system's authoritative tone. The only exceptions are the "Castle Icon" and specific illustrative elements. This sharp-edged approach creates a visual language of blocks, stones, and structural beams.

## Components

*   **Buttons:** Primary buttons use a solid Burnished Gold background with Deep Charcoal text. Secondary buttons are Deep Charcoal with a 2px Gold border. All buttons have a "heavy" hover state where the border thickness increases or the gold takes on a metallic gradient sheen.
*   **The Castle Icon:** This is the primary anchor of the UI. It should be used in the top-left navigation and as a watermark or centered graphic on authentication screens.
*   **Input Fields:** These should look like recessed slots. Use a dark background (#151719) with a 1px border. On focus, the border glows with a soft Burnished Gold.
*   **Cards:** Content cards should use a Parchment White background when containing text-heavy data, with a thin 1px border in a darker parchment shade to define its edges against the Charcoal background.
*   **Navigation:** The main navigation bar should feel like a heavy architectural lintel, spanning the top of the page with a faint stone texture and gold-accented active states.
*   **Security Badges:** Use custom-drawn "seal" components—circular elements with a gold wax-seal texture—to indicate "Verified" or "Encrypted" status.