// Emoji Picker Component - Available globally as EmojiPicker
// Uses emoji-picker-element library for modern, comprehensive emoji support

const EmojiPicker = {
    currentPicker: null,
    currentCallback: null,

    // Show emoji picker
    show(callback, currentIcon = '') {
        // Remove any existing picker
        this.hide();
        
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'emoji-picker-overlay';
        overlay.id = 'emoji-picker-overlay';
        
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'emoji-picker-modal';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'emoji-picker-header';
        
        const title = document.createElement('h3');
        title.textContent = 'Choose an Icon';
        header.appendChild(title);
        
        // Add "Remove icon" button inline if there's a current icon
        if (currentIcon) {
            const removeBtn = document.createElement('button');
            removeBtn.className = 'emoji-picker-remove-btn-inline';
            removeBtn.innerHTML = '× Remove';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                if (callback) {
                    callback('');
                }
                this.hide();
            };
            header.appendChild(removeBtn);
        }
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'emoji-picker-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => this.hide();
        header.appendChild(closeBtn);
        
        modal.appendChild(header);
        
        // Create emoji-picker-element
        const picker = document.createElement('emoji-picker');
        picker.setAttribute('style', 'width: 100%; height: 400px;');
        
        // Handle emoji selection
        picker.addEventListener('emoji-click', (e) => {
            const selectedEmoji = e.detail.unicode;
            if (selectedEmoji && callback) {
                callback(selectedEmoji);
            }
            this.hide();
        });
        
        modal.appendChild(picker);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Store references
        this.currentPicker = picker;
        this.currentCallback = callback;
        
        // Close on overlay click (but not on modal content)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hide();
            }
        });
        
        // Prevent clicks inside modal from closing it
        modal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        // Close on Escape
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hide();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    },

    hide() {
        const overlay = document.getElementById('emoji-picker-overlay');
        if (overlay) {
            overlay.remove();
        }
        this.currentPicker = null;
        this.currentCallback = null;
    }
};

// Make available globally
window.EmojiPicker = EmojiPicker;
