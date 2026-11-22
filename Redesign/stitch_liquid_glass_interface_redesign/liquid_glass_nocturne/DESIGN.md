---
name: Liquid Glass Nocturne
colors:
  surface: '#14121f'
  surface-dim: '#14121f'
  surface-bright: '#3a3746'
  surface-container-lowest: '#0e0c1a'
  surface-container-low: '#1c1a27'
  surface-container: '#201e2c'
  surface-container-high: '#2b2836'
  surface-container-highest: '#363342'
  on-surface: '#e5e0f3'
  on-surface-variant: '#ddc1b5'
  inverse-surface: '#e5e0f3'
  inverse-on-surface: '#312f3d'
  outline: '#a48b81'
  outline-variant: '#56423a'
  surface-tint: '#ffb694'
  primary: '#ffb694'
  on-primary: '#571f00'
  primary-container: '#ff8c53'
  on-primary-container: '#6f2900'
  inverse-primary: '#9e430d'
  secondary: '#ffb0ce'
  on-secondary: '#64003a'
  secondary-container: '#c00175'
  on-secondary-container: '#ffd5e3'
  tertiary: '#ffb2b7'
  on-tertiary: '#67001b'
  tertiary-container: '#ff8791'
  on-tertiary-container: '#840025'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb694'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7b2f00'
  secondary-fixed: '#ffd9e5'
  secondary-fixed-dim: '#ffb0ce'
  on-secondary-fixed: '#3e0022'
  on-secondary-fixed-variant: '#8c0054'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#14121f'
  on-background: '#e5e0f3'
  surface-variant: '#363342'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 60px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Inter
    fontSize: 44px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  margin: 1.25rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.375rem
  space-sm: 0.625rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

This design system expresses a forward-leaning, tactile luxury crafted for intimate social gaming. Built on futuristic iOS design cues, the UI creates the sensation of holding a physical pane of illuminated obsidian glass under ambient candlelight.

### Emotional Target & Character
- **Intimacy & Mystery:** The experience feels nocturnal, confidential, and electric—ideal for game nights that evolve into deep confessions or provocative dares.
- **Ultra-Sensory Tactility:** Elements respond like viscous, hyper-polished liquids and refractive glass. Every tap feels physically responsive, rich, and high-fidelity.
- **Effortless Clarity:** Despite multi-layered refracive materials, the hierarchy prioritizes legibility across a crowded, dim table.

### Design Movement
**Futuristic Liquid Glassmorphism:** Deep volumetric diffusion, specular rim illumination, translucent frosted bodies, and dynamic chromatic reaction based on emotional game states (Suave, Picante, Extremo).

## Colors

The palette revolves around deep midnight foundations layered with warm amber fire, twilight magenta, and radiant ruby energy.

### Color Tokens & Emotional States
- **Base Canvas (`#0D0B18`):** Deep midnight violet canvas, providing the grounding anchor for optical blur dispersion.
- **Primary / Suave (`#FF8C53`):** Warm amber-peach liquid gradient. Used for standard calls to action, active primary pills, and mellow/social game levels.
- **Secondary / Picante (`#D92688`):** Saturated twilight fuchsia/magenta. Evokes heightened tension, flirtation, and provocative questions.
- **Tertiary / Extremo (`#E6194B`):** Vibrant neon ruby crimson. Reserved for high-stakes dares and extreme game modes.
- **Specular Accent (`rgba(255, 255, 255, 0.35)`):** Dynamic top-edge light source highlighting glass curvature and refractive depth.
- **Liquid Fill (`rgba(255, 255, 255, 0.08)`):** Base interior fill for non-active floating interactive surfaces.

## Typography

The type structure utilizes tightly tracked humanist grotesk proportions, echoing the modern Apple design philosophy.

- **Weight Contrasts:** Headlines utilize heavy 700 and 800 weights with negative tracking (`-0.03em` to `-0.015em`), achieving high optical gravity that cuts through glowing, blurred backdrops.
- **Reading Distance Adaptability:** Questions on game cards employ `body-lg` (20px) with open line height (1.4) to maintain effortless legibility when a single phone rests flat on a table shared by multiple players.
- **Labels & Microcopy:** All navigation labels and chip identifiers use `label-md` or `label-sm` with balanced letter spacing to ensure rapid peripheral recognition.

## Layout & Spacing

The layout is grounded in a mobile-first, vertical viewport rhythm designed around thumb reach and table visibility.

### Layout Mechanics
- **Device Anchoring:** Critical primary actions are persistently pinned to the lower safe zone (`margin` of `1.25rem` to `1.5rem` from screen bottom), accommodating comfortable thumb execution.
- **Card Viewport Stacking:** The central play area uses an adaptive proportional container that flexes vertically between 45% and 60% of viewport height, keeping top brand marks and bottom triggers in optical balance.
- **Horizontal Rhythm:** Standard edge margins remain fixed at `1.25rem` (20px) on mobile viewports up to 430px, scaling up to `2rem` on tablets. Chip arrays and selector lists wrap with consistent `space-sm` (10px) vertical and horizontal gaps.

## Elevation & Depth

Visual hierarchy is constructed through optical transmission, fluid refraction, and specular highlight layers rather than conventional flat dropshadows.

### Material Specifications
- **Liquid Glass Medium:** `backdrop-filter: blur(28px) saturate(190%);` applied with `background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%)`.
- **Specular Rim Illumination:** Outer 1px stroke crafted via a directional gradient: `linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.08) 100%)`.
- **Primary Volumetric Glow:** Active amber components cast soft, chromatic shadows: `box-shadow: 0 12px 32px -4px rgba(255, 140, 83, 0.42), 0 2px 6px rgba(0, 0, 0, 0.3)`.
- **Passive Stack Elevation:** Stacked background cards reduce opacity (`0.5` and `0.25`), scale slightly down (`0.95` and `0.90`), and incorporate subtle vertical translation (-8px, -16px) to emulate physical glass layers hovering over one another.

## Shapes

The system relies exclusively on continuous pill profiles and hyper-smooth continuous curves (`squircle` aesthetics).

- **Buttons & Pills:** Strict full-radius caps (`rounded-full` / `9999px`) provide sleek, organic capsules that mirror physical handheld counters and smooth river glass.
- **Cards & Sheets:** Stacked card surfaces utilize smooth, large-radius geometry (`2rem` / `32px`), softening the silhouette while ensuring internal text blocks remain neatly framed.
- **Micro-Chips:** Chips and segmented buttons leverage medium pill silhouettes (`1.5rem` / `24px`), feeling punchy, distinct, and tactile.

## Components

### Primary Pill Button
- **Geometry:** Height 56px, fully pill-shaped (`border-radius: 9999px`), spanning full available container width.
- **Surface:** Gradient fill transitioning from `#FFA36B` through `#FF7A3D`.
- **Glow & Interior:** An inset top glow (`inset 0 1px 1px rgba(255, 255, 255, 0.6)`) paired with the ambient volumetric drop-glow.
- **Typography:** `label-lg` in solid dark midnight violet (`#0D0B18`) for crisp, punchy contrast.

### Secondary Glass Pills & Menu Triggers
- **Geometry:** Height 48px to 52px, pill-shaped.
- **Surface:** Liquid glass fill `rgba(255, 255, 255, 0.07)` with `backdrop-filter: blur(20px)`.
- **Border:** 1px directional specular gradient (`rgba(255, 255, 255, 0.28)` top down to `0.06`).
- **Typography & Icons:** Pure white (`#FFFFFF`) with 20px SF Symbols-styled icons positioned with `space-xs` gap.

### Floating Card Decks (Game Question Card)
- **Geometry:** Generous radius (`2rem` / 32px), min-height 340px, padding `space-lg`.
- **Refraction:** Dynamic liquid glass surface with double specular border. Top edge captures overhead lighting with a subtle interior glare.
- **Stacking Physics:** Underneath the primary card, up to two secondary glass rims sit offset and slightly rotated, generating dimensional depth before the user swipes.

### Dynamic Mode & Level Selectors
- **States:**
  - *Default/Inactive:* Translucent glass (`rgba(255, 255, 255, 0.08)`), white text.
  - *Active Suave:* Solid liquid amber glow (`#FF8C53`), dark typography.
  - *Active Picante:* Radiant magenta glow (`#D92688`), crisp white typography.
  - *Active Extremo:* Radiant crimson ruby glow (`#E6194B`), crisp white typography.
- **Motion & Feedback:** Spring transition (300ms, damping 0.75) on toggle with simulated haptic scale pop (`scale(0.96)` to `scale(1.0)`).

### Interactive Player & Option Rows
- **Surface:** Pill-shaped glass container holding avatar/name, contextual edit icons, and checked state indicators.
- **Checkmarks:** Inset circular indicator filled with active amber or mode accent and clean white vector check.