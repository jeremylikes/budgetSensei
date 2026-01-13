// Note Tooltips - Available globally as LedgerTooltips

const LedgerTooltips = {
    tooltip: null,

    init() {
        if (window._noteTooltipsSetup) return;
        window._noteTooltipsSetup = true;
        
        // Use event delegation for note boxes (works for dynamically created elements)
        document.addEventListener('mouseenter', (e) => {
            // Check if target is an Element (not a text node)
            if (!e.target || typeof e.target.closest !== 'function') return;
            
            const noteBox = e.target.closest('.note-box.has-note');
            if (noteBox && !noteBox.closest('tr.editing')) {
                const note = noteBox.getAttribute('data-note');
                if (note) {
                    this.show(noteBox, note);
                }
            }
        }, true);
        
        document.addEventListener('mouseleave', (e) => {
            // Check if target is an Element (not a text node)
            if (!e.target || typeof e.target.closest !== 'function') return;
            
            const noteBox = e.target.closest('.note-box.has-note');
            if (noteBox) {
                this.hide();
            }
        }, true);
    },

    show(element, note) {
        // Don't show tooltip if we're editing
        if (element.closest('tr.editing')) {
            return;
        }
        
        // Remove existing tooltip immediately
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
        
        // Create tooltip element
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'note-tooltip';
        this.tooltip.textContent = note;
        document.body.appendChild(this.tooltip);
        
        // Force a reflow to get accurate dimensions with width: max-content
        this.tooltip.style.visibility = 'hidden';
        this.tooltip.style.display = 'block';
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        // Position above the element, centered
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        let top = rect.top - tooltipRect.height - 8;
        
        // Adjust if tooltip goes off screen
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top < 10) {
            // Show below if not enough space above
            top = rect.bottom + 8;
        }
        
        this.tooltip.style.left = left + 'px';
        this.tooltip.style.top = top + 'px';
        this.tooltip.style.opacity = '1';
        this.tooltip.style.visibility = 'visible';
    },

    hide() {
        if (this.tooltip) {
            // Remove immediately (no fade) when hiding for edit mode
            this.tooltip.remove();
            this.tooltip = null;
        }
    }
};

// Global click-away handler for inline editing
// Single handler that works for all editing fields - more reliable than per-row handlers
if (!window._clickAwayHandlerSetup) {
    window._clickAwayHandlerSetup = true;
    
    document.addEventListener('mousedown', (e) => {
        // Find any active editing input
        const editingInput = document.querySelector('.inline-edit-input');
        if (!editingInput) return; // No active editing
        
        const editingRow = editingInput.closest('tr.editing');
        if (!editingRow) return; // Not in edit mode
        
        const editingCell = editingInput.closest('td.editing');
        if (!editingCell) return;
        
        // Check if click is outside the input
        if (!editingInput.contains(e.target)) {
            // If clicking outside the row entirely (whitespace, body, container, etc.), save immediately
            if (!editingRow.contains(e.target)) {
                // Clicked outside the row - save and close immediately
                e.preventDefault(); // Prevent any default behavior
                editingInput.blur();
                return;
            }
            
            // If clicking in the row but not in the editing cell, might be clicking another cell
            // Don't prevent default - let the cell click handler process it
            if (!editingCell.contains(e.target)) {
                // Small delay to let cell click handler process first
                setTimeout(() => {
                    // Double-check the input is still active and wasn't replaced
                    const stillEditing = document.querySelector('.inline-edit-input');
                    if (stillEditing === editingInput && editingRow.classList.contains('editing')) {
                        editingInput.blur();
                    }
                }, 10);
            }
        }
    }, true);
}

// Make available globally
window.LedgerTooltips = LedgerTooltips;

// Initialize tooltips on load
LedgerTooltips.init();
