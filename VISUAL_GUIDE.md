# Visual Guide

A visual walkthrough of the Me @ GitHub extension's UI elements and interactions.

## 1. Counter Badge

### Location
The counter badge appears at the end of the page title:

```
┌─────────────────────────────────────┐
│ Fix critical bug in authentication  │  @5
│                                     └──┘
└─────────────────────────────────────┘
   Page Title                      Badge shows 5 mentions
```

### Appearance
```
┌──────┐
│  @5  │  ← Blue background (#0969da)
└──────┘     White text, rounded corners
   ↑
Clickable badge
```

### States
- **Normal**: Blue (#0969da)
- **Hover**: Darker blue (#0860ca)
- **Tooltip**: "5 mentions of @username"

---

## 2. Dropdown Menu

### Trigger
Click the counter badge to reveal the dropdown:

```
Issue Title  @5  ← Click here
             └──┐
                ▼
    ┌───────────────────────────────────┐
    │ #1  ...text @username more text..│
    │ #2  ...another @username here ... │
    │ #3  ...yet another @username ...  │
    │ #4  ...@username in this comment..│
    │ #5  ...final @username mention .. │
    └───────────────────────────────────┘
```

### Dropdown Details
```
┌────────────────────────────────────────────┐
│  ┌──┐                                      │
│  │#1│  ...context before @username context│ ← Clickable item
│  └──┘  after...                           │
│  ↑                        ↑                │
│  Index              Your mention (bold)   │
│                                            │
│  Max 400px height, scrollable if needed   │
└────────────────────────────────────────────┘
```

### Context Format
```
Before text: Up to 30 characters before mention
Mention:     @username (in bold)
After text:  Up to 30 characters after mention
Ellipsis:    ... if text is truncated
```

Example:
```
...can you please review this @username because it's important...
```

---

## 3. Mention Highlighting

### On Page
Every mention is highlighted with a subtle background:

```
Regular text here @username more text
                 └─────────┘
                 Light blue background
```

### Color States
```
Normal state:     [Light blue  ] #ddf4ff
                   @username

Hover state:      [Medium blue ] #b6e3ff
                   @username

Active state:     [ Yellow     ] #ffd33d (with outline)
                   @username
```

### Visual Representation
```
Comment text continues and then @username is mentioned
                                ┌────────┐
                                │@username│ ← Highlighted
                                └────────┘
and the text continues after the mention.
```

---

## 4. Navigation Controls

### Trigger
Hover over any highlighted mention to reveal controls:

```
Here is a mention: @username ← Hover here
                   └────────┘
                       ↓
                  ┌──────────┐
                  │ ← 2/5 → │ ← Controls appear
                  └──────────┘
```

### Control Layout
```
┌────────────────────────────┐
│  ←   │   2/5   │    →     │
│ Prev │ Current │  Next    │
│      │ Position│          │
└────────────────────────────┘
```

### Button States
```
Normal:    [  ←  ]  White background
Hover:     [  ←  ]  Light gray (#f6f8fa)
Active:    [  ←  ]  Darker gray (#eaeef2)
```

---

## 5. Complete Page View

### Example GitHub Issue Page

```
┌────────────────────────────────────────────────────────────┐
│  GitHub Header                                             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Fix authentication bug  @3  ← Counter badge              │
│                          └─┘                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━               │
│                                                            │
│  @username opened this issue · 2 hours ago                │
│          ↑                                                 │
│     Highlighted (light blue)                               │
│                                                            │
│  The authentication system is broken. @username please     │
│                                            ↑               │
│                                   Highlighted (light blue) │
│  take a look at this when you have time.                   │
│                                                            │
│  ───────────────────────────────────────                  │
│                                                            │
│  @developer commented · 1 hour ago                        │
│                                                            │
│  I think @username is right about this being a critical    │
│           ↑                                                │
│      Highlighted (light blue)                              │
│  issue. Let's prioritize it.                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 6. Interaction Flow

### Navigation Sequence

**Step 1: Page Load**
```
User loads GitHub issue
         ↓
Extension detects username
         ↓
Scans page for @mentions
         ↓
[Finds 3 mentions]
         ↓
Creates counter: @3
```

**Step 2: View All Mentions**
```
User clicks counter badge
         ↓
Dropdown opens
         ↓
Shows list of 3 mentions
         ↓
User sees context for each
```

**Step 3: Navigate to Mention**
```
User clicks dropdown item #2
         ↓
Dropdown closes
         ↓
Page scrolls to mention #2
         ↓
Mention #2 turns yellow (active)
         ↓
Navigation controls appear on hover
```

**Step 4: Sequential Navigation**
```
User hovers over active mention
         ↓
Sees: ← 2/3 →
         ↓
Clicks → button
         ↓
Scrolls to mention #3
         ↓
Mention #3 becomes active (yellow)
```

---

## 7. Keyboard Navigation

### Visual Feedback

**Press Alt+N (Next)**
```
Current:  @username (yellow)
              ↓ scroll
Next:     @username (turns yellow)
```

**Press Alt+P (Previous)**
```
Current:  @username (yellow)
              ↑ scroll
Previous: @username (turns yellow)
```

### Wrap-around Behavior
```
Mentions: [1] [2] [3] [4] [5]

At [5], press Alt+N → goes to [1]
At [1], press Alt+P → goes to [5]
```

---

## 8. Dark Mode

### Color Adjustments

**Light Mode:**
```
Background:    White (#ffffff)
Text:          Black (#1f2328)
Highlight:     Light blue (#ddf4ff)
Border:        Gray (#d0d7de)
```

**Dark Mode:**
```
Background:    Dark gray (#161b22)
Text:          Light gray (#c9d1d9)
Highlight:     Dark blue (#1c2d3e)
Border:        Dark gray (#30363d)
```

### Visual Comparison

```
Light Mode:  ┌──────────────────┐
             │ White background │
             │ @username        │ ← Light blue highlight
             └──────────────────┘

Dark Mode:   ┌──────────────────┐
             │ Dark background  │
             │ @username        │ ← Dark blue highlight
             └──────────────────┘
```

---

## 9. Responsive Elements

### Counter Badge Scaling
```
Short title:  Bug fix  @2
Long title:   This is a very long issue title that... @2
                                                      └─┘
                                               Always at end
```

### Dropdown Positioning
```
Counter near left:    Dropdown opens to the right
Counter near right:   Dropdown opens aligned right
Counter in middle:    Dropdown aligns with counter
```

### Mention Highlights
```
Inline:     Text @username text
            Flows naturally with text

Multi-line: Text that wraps to
            next line @username
            continues highlighting
```

---

## 10. Edge Cases Handled

### No Mentions
```
No badge appears
Page functions normally
Extension is silent
```

### Single Mention
```
Counter shows: @1
Navigation: Only this mention highlighted
Prev/Next: Both go to same mention
```

### Many Mentions (15+)
```
Counter shows: @15
Dropdown: Scrollable list
Navigation: All work correctly
Performance: Still fast
```

---

## Summary

The extension provides:
- ✅ Clear visual indicators (counter, highlights)
- ✅ Multiple navigation methods (click, hover, keyboard)
- ✅ Contextual information (dropdown with text preview)
- ✅ Responsive design (adapts to page layout)
- ✅ Smooth animations (scrolling, state changes)
- ✅ Theme support (light and dark modes)
- ✅ Intuitive controls (familiar UI patterns)

All elements follow GitHub's design language for seamless integration!
