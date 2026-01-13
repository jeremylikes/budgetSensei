# App.js Refactoring Plan

## Current State
- `app.js`: ~1475 lines - needs organization

## Proposed Structure

```
js/
├── utils.js           - Utility functions (formatCurrency, formatDate, getTransactionsForMonth)
├── api.js             - API calls (loadData)
├── data.js            - Shared state (DataStore object)
├── ui.js              - UI setup (tabs, date selectors, modals)
├── dashboard.js       - Dashboard functionality
├── ledger.js          - Ledger table (sorting, inline editing, row creation)
├── transactions.js    - Transaction CRUD operations
└── data-management.js - Categories & Methods management

app.js                 - Main initialization (~100 lines)
```

## Approach: Namespace Pattern
- Each module exports a namespace object (e.g., `Utils`, `API`, `DataStore`)
- No build step required
- Works in all browsers
- Simple to maintain

## Benefits
- **Maintainability**: Each file has a single responsibility
- **Readability**: Smaller, focused files (~100-300 lines each)
- **Testability**: Easier to test individual modules
- **Scalability**: Easy to add new features

## Implementation Order
1. ✅ Create core modules (utils, api, data)
2. Create UI module
3. Create dashboard module
4. Create ledger module (largest - ~500 lines)
5. Create transactions module
6. Create data-management module
7. Update app.js to use modules
8. Update index.html to load modules
9. Test thoroughly
