# Examples and Demo

## What the Extension Does

The "Me @ GitHub" extension enhances your GitHub browsing experience by:

1. **Finding all your mentions** - Scans the entire page for `@yourusername`
2. **Adding a visual counter** - Shows `@N` badge next to the page title
3. **Highlighting mentions** - Makes your mentions stand out with background color
4. **Providing quick navigation** - Jump to any mention with one click

## Visual Examples

### Before Extension
```
Normal GitHub issue page:
- Mentions scattered throughout comments
- No easy way to find all mentions
- Must manually scroll and search
```

### After Extension
```
Enhanced GitHub issue page:
✓ Blue @5 badge in title (5 mentions found)
✓ All mentions highlighted in light blue
✓ Click badge → see dropdown list
✓ Hover mention → see prev/next buttons
✓ Use Alt+N/Alt+P keyboard shortcuts
```

## Use Cases

### 1. Active Code Review
You're mentioned multiple times in a PR review:
- Quickly see how many comments mention you (`@7`)
- Jump to each mention to address feedback
- Use keyboard shortcuts to move between mentions efficiently

### 2. Issue Triage
You're assigned to an issue with a long discussion:
- See where you were mentioned in the conversation
- Navigate between mentions to follow the thread
- Click from dropdown list to jump to specific context

### 3. Discussion Participation
Multiple people mention you in a GitHub Discussion:
- Identify all mentions at a glance
- Review context before responding
- Navigate sequentially through mentions

## Counter Badge

The counter appears as a blue pill-shaped badge after the page title:

```
[Issue Title] @3
              ↑↑↑
         Click to see all mentions
```

### Badge States
- **`@1`** - One mention found
- **`@5`** - Five mentions found
- **`@15`** - Fifteen mentions found

## Dropdown Menu

Clicking the counter badge shows a dropdown with:

```
┌────────────────────────────────────────┐
│ #1  ...can you look at this @yourna... │
│ #2  ...thanks @yourname for the feed... │
│ #3  ...@yourname should we merge thi... │
└────────────────────────────────────────┘
```

Each item shows:
- **Index number** (#1, #2, etc.)
- **Context** (text before and after the mention)
- **Your mention** (highlighted in bold)

Click any item to scroll to that location on the page.

## Navigation Controls

When you hover over a highlighted mention, navigation controls appear:

```
@yourname
[← | 2/5 | →]
```

- **← button**: Go to previous mention (wraps to last if at first)
- **Counter**: Shows current position (e.g., "2/5" means 2nd of 5)
- **→ button**: Go to next mention (wraps to first if at last)

## Highlight Colors

Mentions use different colors to indicate state:

- **Light blue** (`#ddf4ff`) - Normal state
- **Medium blue** (`#b6e3ff`) - Hovered state
- **Yellow** (`#ffd33d`) - Active/selected state

## Dark Mode

The extension automatically adapts to GitHub's dark mode:

- Counter badge remains visible
- Highlights use darker colors
- Dropdown matches dark theme
- Navigation controls blend in

## Keyboard Shortcuts

Navigate without using the mouse:

| Shortcut | Action |
|----------|--------|
| `Alt+N` | Next mention |
| `Alt+P` | Previous mention |

**Note**: Shortcuts only work when not typing in a text field.

## Page Support

The extension works on:

- ✅ GitHub Issues (`github.com/*/issues/*`)
- ✅ GitHub Pull Requests (`github.com/*/pull/*`)
- ✅ GitHub Discussions (`github.com/*/discussions/*`)

It does **not** work on:
- ❌ Repository home pages
- ❌ File browsers
- ❌ Search results pages
- ❌ User profiles

## Performance Notes

The extension is lightweight and efficient:

- Runs only on GitHub issue/PR/discussion pages
- Scans page once when loaded
- Re-scans only when navigating (GitHub PJAX)
- No continuous monitoring or polling
- No data sent to external servers

## Tips and Tricks

1. **Quick scan**: Look at the counter to see if you're mentioned before reading
2. **Context review**: Use the dropdown to get overview without scrolling
3. **Focused reading**: Use keyboard shortcuts for hands-free navigation
4. **Active mentions**: Currently selected mention has yellow highlight
5. **Wrap-around**: From last mention, next goes to first (and vice versa)

## Troubleshooting Common Issues

### Counter doesn't appear
- Verify you're mentioned on the page (look for `@yourusername`)
- Check you're on an issue, PR, or discussion page
- Refresh the page

### Highlights missing
- Some GitHub elements may not be scanned
- Try refreshing the page
- Check browser console for errors

### Navigation not working
- Ensure mentions were found (check counter)
- Try clicking directly in dropdown
- Use keyboard shortcuts as alternative

### Dropdown stays open
- Click outside dropdown to close
- Click counter badge again to toggle
- Refresh page if stuck

## Future Enhancements

Potential features for future versions:

- Filter mentions by comment author
- Export mention list
- Notification badge for new mentions
- Configurable highlight colors
- Search within mentions
- Mention history across pages
