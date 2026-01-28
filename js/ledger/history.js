// Ledger History - Undo/Redo manager for Transactions page
// Available globally as LedgerHistory

const LedgerHistory = {
    // Up to 3 previous actions
    maxDepth: 3,
    undoStack: [],
    lastUndone: null,

    init() {
        // Cache buttons
        this.undoBtn = document.getElementById('ledger-undo-btn');
        this.redoBtn = document.getElementById('ledger-redo-btn');

        if (this.undoBtn) {
            this.undoBtn.addEventListener('click', () => {
                this.undo().catch(err => {
                    console.error('[LedgerHistory] Undo failed:', err);
                    alert('Failed to undo the last action. Please try again.');
                });
            });
        }

        if (this.redoBtn) {
            this.redoBtn.addEventListener('click', () => {
                this.redo().catch(err => {
                    console.error('[LedgerHistory] Redo failed:', err);
                    alert('Failed to redo the last action. Please try again.');
                });
            });
        }

        this.updateButtons();
    },

    push(command) {
        if (!command || typeof command.apply !== 'function' || typeof command.revert !== 'function') {
            console.warn('[LedgerHistory] Invalid command pushed:', command);
            return;
        }

        this.undoStack.push(command);
        // Enforce max depth
        if (this.undoStack.length > this.maxDepth) {
            this.undoStack.shift();
        }

        // Any new action clears redo availability
        this.lastUndone = null;
        this.updateButtons();
    },

    async undo() {
        if (this.undoStack.length === 0) return;

        const command = this.undoStack.pop();
        await command.revert();

        // Only the most recent undone action is redo-able
        this.lastUndone = command;
        this.updateButtons();
    },

    async redo() {
        if (!this.lastUndone) return;

        const command = this.lastUndone;
        await command.apply();

        // After redo, the command is considered the latest completed action again
        this.undoStack.push(command);
        if (this.undoStack.length > this.maxDepth) {
            this.undoStack.shift();
        }

        // Redo is now exhausted until another undo happens
        this.lastUndone = null;
        this.updateButtons();
    },

    clear() {
        this.undoStack = [];
        this.lastUndone = null;
        this.updateButtons();
    },

    updateButtons() {
        if (this.undoBtn) {
            this.undoBtn.disabled = this.undoStack.length === 0;
        }
        if (this.redoBtn) {
            this.redoBtn.disabled = !this.lastUndone;
        }
    }
};

// Make available globally
window.LedgerHistory = LedgerHistory;

