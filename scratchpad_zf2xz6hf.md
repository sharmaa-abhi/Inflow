# Testing Z-Index and Context Menu in Excelidraw

## Checklist
- [x] Open http://localhost:5173
  - **Issue**: Port 5173 is currently running "StadiumGenius — AI-Powered Smart Stadium Platform" instead of Excelidraw.
  - Tried ports: 5173 (StadiumGenius), 5174 (Refused), 5175 (Refused), 5176 (Refused), 5177 (Refused), 3000 (Refused), 3001 (Refused), 4173 (Refused), 8080 (Refused), 8000 (Refused).
- [ ] Draw rectangle and overlapping circle
- [ ] Select circle, verify 'Arrange' buttons in properties panel
- [ ] Click 'Send to Back' in properties panel, verify z-index change
- [ ] Click 'Bring to Front' in properties panel, verify z-index change
- [ ] Right-click circle, verify custom context menu appears
- [ ] Click 'Send to Back' in context menu, verify z-index change
- [ ] Test keyboard shortcuts: '[' (send to back) and ']' (bring to front)

