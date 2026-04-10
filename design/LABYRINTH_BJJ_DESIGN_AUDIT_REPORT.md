# Labyrinth BJJ — Full UX/UI Design Audit Report
**Audited by:** Senior UX/UI Designer + Front-End Engineer  
**Date:** April 10, 2026  
**Scope:** Admin CRM (`admin.labyrinth.vision`) + Member App (`app.labyrinth.vision`)  
**Audit Lens:** Visual Consistency · Hierarchy & Clarity · Component Quality · Interaction Design · Mobile Readiness

---

## Table of Contents

1. [🔴 Design Debt](#-design-debt)
2. [🟡 UX Friction Points](#-ux-friction-points)
3. [🟢 Polish Opportunities](#-polish-opportunities)
4. [✅ Design Wins](#-design-wins)
5. [🎨 Design System Gap Analysis](#-design-system-gap-analysis)
6. [📊 Design Scorecard](#-design-scorecard)
7. [🚀 Top 5 Design Fixes](#-top-5-design-fixes)
8. [🎨 One Big Redesign Recommendation](#-one-big-redesign-recommendation)

---

## 🔴 Design Debt

*Inconsistencies, broken layouts, and accessibility failures that need immediate attention.*

---

### DD-01 — Member App Has No Web Fonts Loaded
**App:** Member App  
**Severity:** Critical — Brand Coherence  

The Admin CRM loads General Sans (Fontshare) + Inter (Google Fonts), giving it a polished, premium feel. The Member App uses the system font stack exclusively (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`). On Android, this renders as Roboto. On Windows, it's Segoe UI. The gym brand feels entirely different depending on the device — this is a direct brand fragmentation issue.

```
Member App --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
Admin CRM  --font-display: 'General Sans'   --font-body: 'Inter'
```

💡 **CODE FIX — Add Inter to Member App `index.html`:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;500;600;700&display=swap" rel="stylesheet">
```
```css
/* In Member App global CSS */
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
body {
  font-family: var(--font-sans);
}
```

---

### DD-02 — Form Labels Missing `for` Attributes (Accessibility Failure)
**App:** Admin CRM  
**Severity:** Critical — WCAG 2.1 Level A Violation  

All form `<label>` elements in the GAS HTML files lack `for` attributes pointing to their associated `<input>` IDs. This means:
- Screen readers cannot associate the label with the input
- Clicking the label does not focus the input (broken UX for all users)
- Fails WCAG 2.1 Success Criterion 1.3.1 (Info and Relationships) and 4.1.2 (Name, Role, Value)

💡 **CODE FIX — Every label/input pair:**
```html
<!-- WRONG (current) -->
<label>First Name</label>
<input type="text" id="firstName">

<!-- CORRECT -->
<label for="firstName">First Name</label>
<input type="text" id="firstName" name="firstName">
```

---

### DD-03 — Sub-12px Text Used Across Both Apps
**App:** Admin CRM + Member App  
**Severity:** Critical — Accessibility + Readability  

Font sizes below 12px are not readable by users without perfect vision and fail WCAG contrast/readability guidance. Both apps use these aggressively:

| Size | Admin CRM Occurrences | Member App Occurrences | Used For |
|------|-----------------------|------------------------|----------|
| 9px  | 2                     | Present                | Micro-labels |
| 10px | 16                    | Nav labels (tab bar)   | Trial labels, arrows, schedule notes |
| 11px | 50                    | Belt badges            | Table headers, stat labels, card titles |

The 10px bottom nav labels in the Member App are particularly harmful — they are the primary navigation and render illegibly on most Android devices.

💡 **CODE FIX — Member App bottom nav labels:**
```css
/* Member App — raise nav labels from 10px to 12px minimum */
.tab-item .tab-label,
[class*="tab-"] span,
.nav-label {
  font-size: 12px !important; /* was: 10px */
  line-height: 1.2;
}
```

💡 **CODE FIX — Admin CRM stat labels and table headers:**
```css
/* Raise minimum from 11px to 12px */
.stat-label,
th,
.badge,
.card-title,
.group-label {
  font-size: 12px; /* was: 11px */
}
```

---

### DD-04 — Dashboard Loading: 5–8 Second Black Screen
**App:** Admin CRM  
**Severity:** High — First Impression / Perceived Performance  

When the Admin CRM loads, the page renders a solid black screen for 5–8 seconds while the dashboard fetches data. The CSS has a full skeleton loader system (`shimmer` animation, gold-tinted gradient defined in `--shimmer-gold`) but it is never invoked. The page uses a spinner-only approach, leaving the layout completely empty.

This is the single worst first impression in the entire product. A new user or a gym owner opening the app on a slow connection will think it's broken.

💡 **CODE FIX — Inline skeleton HTML to show before data loads:**
```html
<!-- Add this structure to the dashboard BEFORE data-fetching fires -->
<div class="skeleton-dashboard" id="skeletonDashboard">
  <!-- Stat cards row -->
  <div class="stats-grid">
    <div class="stat-card skeleton-card"></div>
    <div class="stat-card skeleton-card"></div>
    <div class="stat-card skeleton-card"></div>
    <div class="stat-card skeleton-card"></div>
  </div>
  <!-- Members table preview -->
  <div class="card">
    <div class="skeleton-row" style="height: 40px; margin-bottom: 8px;"></div>
    <div class="skeleton-row"></div>
    <div class="skeleton-row"></div>
    <div class="skeleton-row"></div>
    <div class="skeleton-row"></div>
  </div>
</div>
```
```css
.skeleton-card,
.skeleton-row {
  background: var(--surface-2);
  border-radius: var(--radius-sm);
  height: 80px;
  position: relative;
  overflow: hidden;
}
.skeleton-row { height: 44px; margin-bottom: 4px; border-radius: 4px; }
.skeleton-card::after,
.skeleton-row::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--shimmer-gold);
  animation: shimmer 1.6s ease-in-out infinite;
  background-size: 200% 100%;
}
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
```
```javascript
// In your GAS fetch success callback:
document.getElementById('skeletonDashboard').style.display = 'none';
document.getElementById('realDashboard').style.display = 'block';
```

---

### DD-05 — Admin CRM: No Responsive Sidebar / Mobile Layout
**App:** Admin CRM  
**Severity:** High — Mobile Users Locked Out  

The Admin CRM sidebar is fixed at `240px` with no responsive breakpoints, no hamburger menu, no drawer pattern. On any screen below ~900px the layout breaks — the main content area is squeezed or overflows. A gym owner checking stats on their phone between classes sees a completely broken interface.

💡 **CODE FIX — Responsive sidebar toggle:**
```css
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -240px;
    top: 0;
    height: 100vh;
    z-index: 200;
    transition: left 300ms var(--smooth);
  }
  .sidebar.open {
    left: 0;
  }
  .main-content {
    margin-left: 0;
    padding: 60px 16px 16px;
  }
  .mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 56px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 0 16px;
    z-index: 100;
  }
  .hamburger {
    display: flex;
    flex-direction: column;
    gap: 4px;
    cursor: pointer;
    padding: 8px;
  }
  .hamburger span {
    width: 20px;
    height: 2px;
    background: var(--text);
    border-radius: 2px;
    transition: all 200ms;
  }
  .sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 199;
  }
  .sidebar.open ~ .sidebar-overlay {
    display: block;
  }
}
@media (min-width: 769px) {
  .mobile-header { display: none; }
}
```

---

### DD-06 — Member App: iOS Input Auto-Zoom (Input Font < 16px)
**App:** Member App  
**Severity:** High — Mobile UX Breakage  

iOS Safari automatically zooms the page when any `<input>` is focused with a font-size below 16px. The Member App login inputs appear to use `font-size: 14px` (via `text-sm` Tailwind class). This causes the page to zoom in unexpectedly on login — a disorienting experience for every iOS user on first launch.

💡 **CODE FIX:**
```css
/* Member App — ensure all inputs are ≥ 16px on mobile */
input,
textarea,
select {
  font-size: 16px !important; /* prevents iOS auto-zoom */
  font-family: var(--font-sans);
}

/* If you need visual 14px, scale DOWN after input, not the font: */
.input-wrapper {
  transform-origin: left center;
}
```

---

### DD-07 — Member App: Bottom Nav Has 7 Items (Overcrowded)
**App:** Member App  
**Severity:** High — Navigation Clarity  

The bottom navigation bar contains 7 items: Home, Chat, Belts, Schedule, More, Blast, Admin. Mobile navigation best practice is 3–5 items maximum. At 7 items, each icon and label is too small to reliably tap (especially with 10px labels), and the hierarchy is unclear — "Blast" and "Admin" are not primary navigation items and do not belong at the same visual level as Home or Schedule.

Items like "Admin" should be behind a role-based gate visible only to owners/admins, and "Blast" should live inside either Chat or an Admin panel.

---

### DD-08 — Member App: Tap Target Sizes Below 44px Minimum
**App:** Member App  
**Severity:** High — Mobile Accessibility (WCAG 2.5.5)  

"Sign Now" buttons on the alert banners measure approximately 36px height, below Apple's HIG minimum of 44px and Google Material's minimum of 48px. Combined with the 10px label font size on nav items (also small tap targets), the app has systemic touch target issues.

💡 **CODE FIX:**
```css
/* Enforce minimum tap targets */
.btn,
button,
[role="button"],
a.btn,
.tab-item {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Alert "Sign Now" CTAs */
.alert-cta,
.sign-now-btn {
  min-height: 44px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
}
```

---

### DD-09 — Admin CRM: Financials Tab is Non-Functional
**App:** Admin CRM  
**Severity:** High — Feature Integrity  

The Financials tab in the sidebar renders a page that contains no functional data — it either shows a blank state, a placeholder, or errors silently. For a gym management tool, financial data (revenue, billing history, payment status by member) is core functionality. Having a completely broken primary nav item destroys trust in the entire application.

No CSS fix applicable — this is a data/backend issue. Must be either:
1. Connected to real payment data and displayed
2. Replaced with a clear "Coming Soon" empty state with expected timeline

---

### DD-10 — Admin CRM: Table Headers Not Sticky
**App:** Admin CRM  
**Severity:** Medium — Data Navigation  

The members table `<th>` rows are set to `position: static`, meaning column headers disappear when scrolling through a large member list. A gym with 50+ members requires sticky headers to maintain context.

💡 **CODE FIX:**
```css
.members-table thead th,
table thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(20, 20, 24, 0.95);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

---

### DD-11 — Admin CRM: Button Border-Radius Inconsistency
**App:** Admin CRM  
**Severity:** Medium — Visual Consistency  

Multiple button sizes use different border-radii with no clear logic:
- Primary `.btn-primary`: `var(--radius)` = 10px
- Secondary/ghost buttons: `var(--radius-sm)` = 8px  
- Some icon buttons: 6px hardcoded  
- Modal action buttons: 8px

Three different radii across similar-sized interactive elements with no documented sizing rule creates visual noise.

💡 **CODE FIX — Standardize to 2 values:**
```css
:root {
  --btn-radius: 8px;        /* all standard buttons */
  --btn-radius-sm: 6px;     /* icon-only buttons, compact actions */
  --btn-radius-lg: 10px;    /* only for modal primary CTAs or hero buttons */
}
.btn          { border-radius: var(--btn-radius); }
.btn-icon     { border-radius: var(--btn-radius-sm); }
.btn-hero     { border-radius: var(--btn-radius-lg); }
```

---

### DD-12 — Admin CRM: Duplicate `@keyframes` Definitions
**App:** Admin CRM  
**Severity:** Low — Code Quality / Maintainability  

The `styles.css` file defines `@keyframes toastSpring`, `@keyframes slideIn`, and `@keyframes modalEntrance` twice each. This adds ~2–3KB to an already 207KB stylesheet and creates unpredictable behavior if the two definitions ever diverge.

**Fix:** Remove duplicate keyframe blocks. Consolidate all animations into a single `animations.css` section at the top of the stylesheet.

---

### DD-13 — Member App: "Member Since" Shows "—" (Unpopulated)
**App:** Member App  
**Severity:** Medium — Data Trust  

The Member App profile card shows "Member since —" with a dash instead of the actual join date. This is either a data mapping error (field not passed from the backend) or a display formatting issue. A member seeing this on their profile loses confidence that the app has accurate data about them.

---

## 🟡 UX Friction Points

*Confusing flows, missing feedback, and poor information hierarchy that slow users down.*

---

### UX-01 — Admin CRM: No Max-Width on Main Content Area
The main content area expands to fill 100% of the viewport minus the 240px sidebar — on a 1440px+ display, content stretches across 1200px. Paragraph text, stat cards, and table columns become too wide to read comfortably. Industry standard for admin content is `max-width: 1200px` with `margin: 0 auto` inside the content well.

💡 **CSS Fix:**
```css
.main-content > .content-wrapper,
.page-content {
  max-width: 1200px;
  margin: 0 auto;
}
```

---

### UX-02 — Admin CRM: Empty Search State Has No Action
When a member search returns no results, the interface shows only the text "No members found." There is no illustration, no suggestion, and no action (e.g., "Add this member" or "Clear search"). Users are left stranded with no next step.

**Fix:** Design an empty state component with:
- A simple icon (magnifying glass with X, or person-plus)
- Body text: "No members match '[search term]'"
- Action button: "+ Add [search term] as New Member"

---

### UX-03 — Admin CRM: Spacing Uses 20+ Non-Grid Values
The Admin CRM uses 20+ distinct spacing values including `6.5px`, `7px`, and `-8px`. A grid-based spacing scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64px) would eliminate these arbitrary values and make new features feel visually consistent with existing ones.

---

### UX-04 — Member App: Alert Banners Have Low Visual Urgency
The unsigned waiver/membership agreement banners blend into the dark theme. On a dark background, low-opacity warning colors don't create urgency. The banners lack:
- A high-contrast left border strip (like GitHub/Linear danger notices)
- An icon with a filled warning shape
- Contrast ratio ≥ 4.5:1 for the "Sign Now" CTA against its background

---

### UX-05 — Member App: No Attendance Stats or Streak on Home Screen
The home screen shows member name, plan, belt, and quick links — but no motivational data. Attendance streaks, classes attended this month, and belt progress percentage are all data the system likely has. Not showing them is a missed engagement opportunity. Members who can see their progress are more likely to maintain their membership.

---

### UX-06 — Admin CRM: Table Row Height is Tight (37px)
Member table rows have `padding: 8px 12px`, resulting in ~37px row height. For a data table that users scan frequently, 44–48px row height improves readability and reduces click/tap errors. The gold hover accent (left border) is well-designed but the tight row height undermines it.

💡 **CSS Fix:**
```css
.members-table td,
table tbody td {
  padding: 12px 16px; /* was: 8px 12px */
}
```

---

### UX-07 — Member App: Login Page Has No Value Proposition
The login page shows only the Labyrinth BJJ logo and two input fields. A new member receiving an invitation has no context about what they're logging into or what the app does for them. Adding a one-line tagline ("Track your belt journey. Stay connected with your gym.") would reduce abandonment for new users.

---

### UX-08 — Admin CRM: No Confirmation Dialog for Destructive Actions
Deleting a member or revoking access should trigger a destructive action confirmation dialog with:
1. Clear warning text ("This will permanently delete [Name]'s data")
2. A red destructive button with explicit wording ("Yes, Delete Member")
3. A safe cancel button as the default focus

Currently, destructive actions appear to execute immediately or with minimal confirmation copy.

---

### UX-09 — Admin CRM: Sidebar Has No Visual Grouping of Nav Items
All sidebar nav items are displayed as a flat list with no visual grouping. Linear, Vercel, and Stripe all group navigation into labeled sections (e.g., "Members / Finance / Settings" with section labels between groups). This would help gym owners find features faster as the product grows.

---

### UX-10 — Member App: "More" Tab is a Navigation Dead End
The "More" tab in the bottom nav acts as an overflow menu — but this pattern has been widely abandoned in favor of making primary items accessible directly. If 7 nav items are necessary, a bottom sheet "More" menu that reveals contextual items is preferable to a dedicated tab that feels like a dead end.

---

### UX-11 — Member App: No Tournament Registration Flow from Schedule
The Schedule page shows upcoming tournaments but provides no path to register, set a reminder, or view bracket. This is a high-value feature gap — members who are interested in competing need friction removed, not added.

---

### UX-12 — Admin CRM: Form Inputs Lack Placeholder Context
Form inputs across the Add Member / Edit Member flows show field labels but minimal placeholder text. Placeholders like "e.g. john@example.com" or "Select belt rank" guide users and reduce input errors, especially for admin staff who aren't the gym owner.

---

## 🟢 Polish Opportunities

*Enhancements that would elevate perceived quality from "functional" to "professional."*

---

### P-01 — Member App: Add Attendance Streak Widget to Home Screen
A visual streak counter (e.g., "🔥 7-class streak" or a small heatmap calendar) on the home screen drives daily app opens and attendance. This is the #1 retention mechanic in gym apps. Data required: attendance timestamps per member, which likely already exist in the GAS backend.

---

### P-02 — Admin CRM: Add Sparkline Charts to Stat Cards
The dashboard stat cards (Active Members, Revenue, etc.) show a number and a percentage change but no trend line. A 30-day sparkline SVG underneath the number (6–8 lines of SVG + D3.js or plain SVG path) would make the data feel alive and give the gym owner immediate context.

---

### P-03 — Member App: Belt Progression Page Needs Visual Treatment
The Belt Journey page likely shows a timeline of belt ranks. This is an emotionally significant milestone tracker for BJJ practitioners — it should feel ceremonial. Consider:
- Belt-colored gradient backgrounds for each rank card
- A progress bar showing % of time at current rank vs. typical promotion timeline
- A subtle "Years to Black Belt" projection

---

### P-04 — Admin CRM: Add Keyboard Shortcuts for Power Users
Admin staff who use the CRM daily would benefit from keyboard shortcuts:
- `Cmd/Ctrl + K` — Global search/command palette
- `A` — Add new member (when not in input focus)
- `M` — Go to Members
- `/` — Focus search bar

---

### P-05 — Member App: Empty Chat State Should Feel Warm
When a member has no messages, the chat list is empty with no guidance. A warm empty state ("No messages yet. Your coaches will post updates here.") with the gym's logo or a simple illustration sets the right tone.

---

### P-06 — Admin CRM: Add Bulk Action Toolbar to Members Table
When a gym owner wants to send a mass message, export, or update a group of members (e.g., "freeze all members on semester plans"), there's no multi-select. A checkbox column + floating action toolbar (appears when ≥1 row selected) is the standard pattern from Notion, Linear, and Airtable.

---

### P-07 — Member App: Haptic Feedback for Primary Actions
On iOS/Android, primary actions (check in, sign document, submit form) should trigger haptic feedback via the Vibration API. This is a 2-line code addition that dramatically elevates the native feel:
```javascript
// On primary button tap:
if (navigator.vibrate) navigator.vibrate(10);
```

---

### P-08 — Admin CRM: Color-Coded Activity Feed
The members table or a sidebar activity feed could show real-time events (new sign-up, payment processed, attendance check-in) with colored left-border pills matching the event type. This brings the dashboard to life and gives the gym owner a sense of what's happening now.

---

### P-09 — Member App: Profile Photo Upload
The home screen shows the member's name but no avatar or photo. A profile photo (or auto-generated avatar from initials + belt color) makes the app feel personal. Initials avatar is a 10-line CSS implementation with zero backend changes.

💡 **CSS for initials avatar:**
```css
.member-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--gold);
  color: #0A0A0A;
  font-size: 18px;
  font-weight: 700;
  font-family: var(--font-sans);
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  letter-spacing: -0.5px;
  flex-shrink: 0;
}
```

---

### P-10 — Admin CRM: Print / Export Styles
Gym owners need to occasionally print membership lists or financial summaries. Adding `@media print` styles that hide the sidebar, collapse filters, and format the table cleanly would be a high-value, low-effort addition.

---

## ✅ Design Wins

*Already well-designed — no changes needed.*

---

### W-01 — Admin CRM: CSS Variable System (63 Tokens)
The `:root` block in `styles.css` is genuinely well-architected. 63 tokens covering 4 surface levels, 4 semantic colors, 4 font weights, multiple shadow scales, 4 easing curves, and both a glass system and a gold glow system. This is production-quality design system infrastructure. ✅

### W-02 — Admin CRM: 4-Level Surface Hierarchy
`--bg` → `--surface` → `--surface-2` → `--surface-3` creates a clear depth system that keeps the dark UI readable without relying on bright colors. Cards, inputs, hover states, and modals each occupy a distinct layer. ✅

### W-03 — Admin CRM: Toast Notification System
4-variant toast system (success/error/warning/info) with spring slide-in animation from top-right, correct semantic colors, and auto-dismiss. This is well-implemented and polished. ✅

### W-04 — Admin CRM: Modal Component Quality
Modals at 600px width, 20px border-radius, blur backdrop, `--shadow-modal` shadow, and a `modalEntrance` spring animation. The combination of physics-based animation + glass backdrop is the same pattern used by Linear and Vercel's modals. ✅

### W-05 — Admin CRM: Table Row Hover Gold Accent
The `box-shadow: inset 3px 0 0 var(--gold)` left-border-strip on row hover is a subtle but effective interaction affordance. It's the correct pattern for indicating "this row is interactive" in dark data-heavy UIs. ✅

### W-06 — Both Apps: Gold Brand Color Consistency
`--gold: #C8A24C` is used identically in both applications. In the Admin CRM it appears as `#C8A24C` (hex). In the Member App it appears as `hsl(42 50% 54%)` which resolves to the same value. Brand color is consistent across both surfaces. ✅

### W-07 — Admin CRM: Semantic Color Pairs (Color + Background)
Every semantic color has a matching low-opacity background: `--success` + `--success-bg`, `--error` + `--error-bg`, etc. This enables badge patterns, alert banners, and highlighted states without inventing new colors. ✅

### W-08 — Member App: Belt Color Variable System
All 9 BJJ belt colors are defined as CSS custom properties (`--belt-white` through `--belt-black`). This enables consistent belt visualization across all belt-related UI — progression timeline, profile badge, member list chips — from a single source of truth. ✅

### W-09 — Admin CRM: Easing Curve Library
4 named easing curves beyond basic ease-in-out: `--ease-out-expo`, `--ease-out-back`, `--ease-in-out-smooth`, `--ease-spring`. Having named motion tokens is the mark of a mature design system and enables consistent animation personality across all interactions. ✅

### W-10 — Member App: Tournament Org Color Tokens
Defining `--org-jjwl`, `--org-ibjjf`, `--org-adcc`, `--org-other` as color tokens is smart domain-specific design. Tournament organizations have strong brand colors that members recognize — using these correctly would immediately signal "this app knows BJJ." ✅

### W-11 — Admin CRM: Sidebar Glass Morphism
The sidebar uses `background: rgba(15, 15, 18, 0.85)` with `backdrop-filter: blur` — a glass morphism effect that subtly separates navigation from content without a hard border. Well-executed on this dark background. ✅

### W-12 — Member App: Safe Area Inset Handling
The bottom nav correctly uses `padding-bottom: max(8px, env(safe-area-inset-bottom, 8px))` to account for iPhone notch/home indicator. This is a detail many React apps miss. ✅

---

## 🎨 Design System Gap Analysis

| Component | Admin CRM | Member App | Gap |
|-----------|-----------|------------|-----|
| **CSS Variables** | ✅ 63 tokens, full system | ✅ Tailwind + custom brand tokens | Minor: HSL format vs hex format misalignment |
| **Typography** | ✅ Inter + General Sans loaded | 🔴 System fonts only | Major: Load Inter in Member App |
| **Type Scale** | 🟡 20+ sizes, too many | 🟡 Tailwind scale, but 10px nav labels | Standardize minimum to 12px |
| **Color System** | ✅ 4 surfaces, semantic pairs | ✅ shadcn pattern with brand overrides | Minor: surface-level color values differ slightly |
| **Spacing** | 🟡 Non-grid values (6.5px, 7px) | ✅ Tailwind 4px grid | Audit Admin CRM spacing against 4px grid |
| **Border Radius** | 🟡 6/8/10px inconsistently applied | ✅ `--radius: 10px` consistent | Standardize Admin CRM buttons |
| **Shadows** | ✅ 5-level scale + gold shadows | 🔴 All shadows = `0px 2px 0px rgba(0,0,0,0)` — flat/none | Add shadow system to Member App |
| **Motion / Easing** | ✅ 4 named curves + spring system | ✅ Tailwind transitions | Good — minor unification possible |
| **Button System** | 🟡 Inconsistent radius, good colors | 🟡 Good primary, small tap targets | Fix tap target + radius |
| **Form Inputs** | 🔴 Missing `for` attributes | 🔴 Font < 16px triggers iOS zoom | Both need immediate fixes |
| **Badge/Status Pills** | ✅ 5 semantic variants | 🟡 Belt badges defined, status minimal | Expand Member App badge variants |
| **Table/Lists** | 🟡 Not sticky, tight padding | N/A (mobile list view) | Fix Admin CRM sticky headers |
| **Modals** | ✅ Spring animation, glass backdrop | Unknown | N/A |
| **Toast System** | ✅ 4 variants, spring animation | Unknown | N/A |
| **Skeleton Loaders** | 🔴 Defined in CSS, never used | Unknown | Implement in dashboard |
| **Empty States** | 🟡 Text-only | 🟡 Text-only | Both need icon + action |
| **Loading States** | 🔴 5–8s black screen | Unknown | Add skeleton before fetch |
| **Mobile Layout** | 🔴 No responsive sidebar | 🟡 Mobile-first, but nav issues | Admin CRM needs full responsive pass |
| **Accessibility** | 🔴 Missing label `for` attrs, 9px text | 🔴 Sub-16px inputs, 44px targets | Both need a11y pass |
| **Brand Fonts** | ✅ General Sans + Inter | 🔴 System fonts | Load Inter in Member App |

### The Core Gap: Two Design Systems in One Product
The Admin CRM was hand-coded with a custom design system (BEM-style CSS, custom properties, modular components). The Member App is built on React + Tailwind + shadcn/ui. These are fundamentally different paradigms. The gold color `#C8A24C` is the only true shared token.

**Strategic recommendation:** The `shared-styles.css` design system (delivered separately) establishes the CSS foundation to unify both applications on shared color, typography, and spacing tokens.

---

## 📊 Design Scorecard

| Category | Admin CRM | Member App | Notes |
|----------|-----------|------------|-------|
| **Visual Consistency** | 7/10 | 6/10 | Admin has a real system; Member App lacks web fonts |
| **Color System** | 9/10 | 8/10 | Both solid — gold is consistent |
| **Typography** | 7/10 | 5/10 | Too many sizes; Member App has no web font |
| **Spacing & Layout** | 6/10 | 7/10 | Admin has non-grid values; Member App is Tailwind-disciplined |
| **Component Quality** | 7/10 | 6/10 | Admin: great modals/toasts; Member App: button size issues |
| **Hierarchy & Clarity** | 7/10 | 6/10 | Both are readable; but new-user wayfinding needs work |
| **Interaction Design** | 8/10 | 6/10 | Admin: great animations; Member App: flat shadows, small targets |
| **Mobile Readiness** | 3/10 | 6/10 | Admin CRM has zero mobile support; Member App is mobile-first but broken nav |
| **Accessibility** | 4/10 | 4/10 | Both fail: 9px text, missing label attrs, iOS zoom |
| **Loading & Empty States** | 3/10 | 5/10 | Admin: 5–8s black screen is a crisis |
| **Navigation & IA** | 7/10 | 5/10 | Admin sidebar is clear; Member App nav is overcrowded |
| **Brand Cohesion** | 8/10 | 7/10 | Gold is consistent; fonts diverge |

### Overall Scores

| App | Score | Grade |
|-----|-------|-------|
| **Admin CRM** | **6.2 / 10** | B− |
| **Member App** | **5.9 / 10** | C+ |
| **Design System Unification** | **4.5 / 10** | C |

**Composite Score: 5.8 / 10 — "Functional but unpolished. Needs systematic investment."**

The Admin CRM is closer to production quality — its design system infrastructure is strong. The Member App needs a typography pass, shadow system, tap target audit, and navigation restructure before it can be considered polished.

---

## 🚀 Top 5 Design Fixes

*Highest impact. Lowest effort. Each includes complete CSS.*

---

### Fix #1 — Load Inter Font in Member App
**Impact:** Immediately elevates brand perception. Admin CRM and Member App will now feel like one product.  
**Effort:** 5 minutes — one `<link>` tag + one CSS rule.

```html
<!-- Add to Member App index.html <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;500;600;700&display=swap" rel="stylesheet">
```
```css
/* Member App global CSS override */
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
* { font-family: var(--font-sans); }
```

---

### Fix #2 — Implement Skeleton Loaders on Admin Dashboard
**Impact:** Eliminates 5–8 second black screen. Transforms perceived load time from "broken" to "fast."  
**Effort:** 30 minutes — HTML skeleton structure + CSS (shimmer already defined).

```css
/* The --shimmer-gold var is already in your :root — just add these rules */
.skeleton {
  background: var(--surface-2);
  border-radius: var(--radius-sm);
  position: relative;
  overflow: hidden;
}
.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(200, 162, 76, 0.06) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Stat card skeleton */
.skeleton-stat {
  height: 88px;
  border-radius: var(--radius);
}
/* Table row skeleton */
.skeleton-row {
  height: 44px;
  margin-bottom: 4px;
  border-radius: 4px;
}
```
```html
<!-- Skeleton markup — show while data loads, hide when done -->
<div id="skeletonView" class="page-content">
  <div class="stats-grid">
    <div class="skeleton skeleton-stat"></div>
    <div class="skeleton skeleton-stat"></div>
    <div class="skeleton skeleton-stat"></div>
    <div class="skeleton skeleton-stat"></div>
  </div>
  <div class="card" style="margin-top: 24px; padding: 20px;">
    <div class="skeleton skeleton-row" style="width: 40%; margin-bottom: 16px;"></div>
    <div class="skeleton skeleton-row"></div>
    <div class="skeleton skeleton-row"></div>
    <div class="skeleton skeleton-row"></div>
    <div class="skeleton skeleton-row"></div>
    <div class="skeleton skeleton-row"></div>
  </div>
</div>
```

---

### Fix #3 — Raise Minimum Font Size to 12px Everywhere
**Impact:** Fixes the single largest accessibility violation. Readable by ≥95% of users vs. 9–10px which is unreadable for users with standard vision correction.  
**Effort:** 15 minutes — global CSS overrides.

```css
/* ===== ADMIN CRM — add to styles.css ===== */
/* Raise 9px and 10px occurrences to minimum 12px */
.stat-label,
th,
.badge,
.card-title,
.group-label,
.checkout-result-label,
.search-result-group,
.schedule-badge,
.payment-bar-label {
  font-size: 12px; /* was: 9–11px */
}

/* ===== MEMBER APP — add to global CSS ===== */
/* Raise nav labels from 10px to 12px */
.tab-item span,
.tab-label,
[class*="text-\[10px\]"],
[class*="text-\[9px\]"] {
  font-size: 12px !important;
}

/* Raise all inputs to 16px to prevent iOS zoom */
input, textarea, select {
  font-size: 16px !important;
}
```

---

### Fix #4 — Add Sticky Table Headers to Admin CRM
**Impact:** Instantly makes large member lists scannable. Context is never lost when scrolling.  
**Effort:** 5 minutes — 4 CSS rules.

```css
/* Admin CRM — sticky table headers */
.members-table,
.data-table {
  border-collapse: separate;
  border-spacing: 0;
}

.members-table thead,
.data-table thead {
  position: sticky;
  top: 0;
  z-index: 20;
}

.members-table thead th,
.data-table thead th {
  position: sticky;
  top: 0;
  background: rgba(20, 20, 24, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 0 var(--border);
}
```

---

### Fix #5 — Fix All Form Label `for` Attributes
**Impact:** Fixes WCAG Level A accessibility failure. Makes label clicks work for all users. Required for ADA compliance.  
**Effort:** 1–2 hours — audit all HTML templates in GAS scripts.

```html
<!-- Pattern to apply across ALL forms in paste.txt GAS scripts -->

<!-- Add Member form -->
<label for="memberFirstName">First Name</label>
<input type="text" id="memberFirstName" name="firstName" placeholder="e.g. John">

<label for="memberLastName">Last Name</label>
<input type="text" id="memberLastName" name="lastName" placeholder="e.g. Doe">

<label for="memberEmail">Email Address</label>
<input type="email" id="memberEmail" name="email" placeholder="e.g. john@example.com">

<label for="memberBelt">Belt Rank</label>
<select id="memberBelt" name="belt">
  <option value="">Select belt rank…</option>
  <option value="white">White Belt</option>
  <option value="blue">Blue Belt</option>
  <option value="purple">Purple Belt</option>
  <option value="brown">Brown Belt</option>
  <option value="black">Black Belt</option>
</select>

<label for="memberPlan">Membership Plan</label>
<select id="memberPlan" name="plan">…</select>
```

---

## 🎨 One Big Redesign Recommendation

### Unify Both Apps Under One Design System — The "Labyrinth Design System" (LDS)

**The Problem:**  
Labyrinth BJJ currently has two products that feel like they were made by different companies. The Admin CRM has a sophisticated custom design system with 63 CSS tokens, spring animations, and a glass sidebar. The Member App is a Tailwind/shadcn app that looks like a starter template with brand colors applied on top.

When a gym owner logs into the Admin CRM and then pulls up the Member App to show a prospective member what they'll use, the visual disconnect undermines confidence in both products.

**The Recommendation: A Shared Token Layer**

Create a single `labyrinth-tokens.css` file — delivered as `shared-styles.css` — that defines every design decision as a CSS custom property. Both the GAS HTML files (Admin CRM) and the React/Tailwind app (Member App) import this file. Tailwind's `tailwind.config.js` is updated to reference these CSS variables directly.

The token file covers:
- Colors (exact same hex values, same names)
- Typography (Inter loaded universally, same type scale)
- Spacing (4px grid, consistent tokens)
- Border radius (2–3 values, clearly documented)
- Shadows (real shadow values, not zeros)
- Motion (shared easing curve names)
- Component patterns (buttons, inputs, badges, tables)

**The Result:**
When you build a new feature in either product, you pull from the same token library. A badge that means "Active" looks the same in the Admin CRM member table and the Member App profile card. A danger button in the admin delete modal uses the same red as an error alert in the member app. The gym's gold color behaves consistently everywhere.

This is a 2–4 hour implementation task. The `shared-styles.css` file delivered with this report is the first version of this system. It is designed to be pasted as a `<style>` block into every GAS HTML file today, and imported into the React app's `index.css` tomorrow.

**Priority order:**
1. Paste `shared-styles.css` into all GAS HTML `<style>` blocks → immediate visual uplift in Admin CRM
2. Add Inter font to Member App's `index.html`
3. Override Tailwind defaults in `tailwind.config.js` to reference shared CSS tokens
4. Replace Member App's flat shadow system with the proper shadow scale
5. Audit and standardize spacing using the 4px token grid

---

*End of Labyrinth BJJ Design Audit Report.*  
*Total findings: 13 Design Debt items · 12 UX Friction Points · 10 Polish Opportunities · 12 Design Wins*
