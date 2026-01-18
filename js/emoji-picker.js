// Emoji Picker Component - Available globally as EmojiPicker
// Uses emoji-picker-element library for modern, comprehensive emoji support

const EmojiPicker = {
    currentPicker: null,
    currentCallback: null,

    // Show emoji picker
    async show(callback, currentIcon = '') {
        // Remove any existing picker
        this.hide();
        
        // Wait for the custom element to be defined
        if (!customElements.get('emoji-picker')) {
            try {
                // The library should be loaded via script tag, but wait for it to register
                await new Promise((resolve) => {
                    const checkInterval = setInterval(() => {
                        if (customElements.get('emoji-picker')) {
                            clearInterval(checkInterval);
                            resolve();
                        }
                    }, 50);
                    // Timeout after 3 seconds
                    setTimeout(() => {
                        clearInterval(checkInterval);
                        resolve();
                    }, 3000);
                });
            } catch (error) {
                console.error('Error waiting for emoji-picker element:', error);
            }
        }
        
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
        
        // Enhance search to handle emoji character input
        // Wait for the picker to be fully rendered
        setTimeout(() => {
            const searchInput = picker.shadowRoot?.querySelector('input[type="search"]') || 
                               picker.querySelector('input[type="search"]') ||
                               picker.shadowRoot?.querySelector('input') ||
                               picker.querySelector('input');
            
            if (searchInput) {
                // Track input value to detect when library strips Unicode code points
                let previousValue = '';
                let isProcessingEmoji = false;
                
                // Handle keydown to track typing of Unicode code points
                searchInput.addEventListener('keydown', (e) => {
                    // Store current value before the key is processed
                    previousValue = searchInput.value;
                });
                
                // Handle beforeinput to catch paste events before library processes them
                searchInput.addEventListener('beforeinput', (e) => {
                    if (e.inputType === 'insertFromPaste' || e.inputType === 'insertText') {
                        const inputData = e.data || '';
                        
                        // Check if input data is an emoji character
                        const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/u;
                        
                        if (emojiRegex.test(inputData)) {
                            e.preventDefault(); // Prevent default paste
                            const emojiChar = inputData.match(emojiRegex)[0];
                            isProcessingEmoji = true;
                            
                            // Process the emoji character search immediately
                            (async () => {
                                try {
                                    const database = picker.database || picker;
                                    
                                    console.log('Processing pasted emoji:', emojiChar, 'Database:', database);
                                    
                                    if (database && typeof database.getEmojiByUnicodeOrName === 'function') {
                                        const foundEmoji = await database.getEmojiByUnicodeOrName(emojiChar);
                                        console.log('Found emoji object:', foundEmoji);
                                        
                                        if (foundEmoji) {
                                            const searchTerm = foundEmoji.annotation || 
                                                             foundEmoji.shortcodes?.[0] || 
                                                             foundEmoji.tags?.[0] ||
                                                             foundEmoji.name || 
                                                             '';
                                            
                                            console.log('Search term extracted:', searchTerm);
                                            
                                            if (searchTerm) {
                                                // Set search to the keyword, which the library will accept
                                                searchInput.value = searchTerm;
                                                const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                                                searchInput.dispatchEvent(inputEvent);
                                            } else {
                                                console.log('No search term found for emoji');
                                            }
                                        } else {
                                            console.log('Emoji not found in database');
                                        }
                                    } else {
                                        console.log('Database API not available');
                                    }
                                } catch (error) {
                                    console.error('Error processing pasted emoji:', error);
                                } finally {
                                    isProcessingEmoji = false;
                                }
                            })();
                            return;
                        }
                    }
                });
                
                // Handle paste events to capture emojis and Unicode code points before library processes them
                searchInput.addEventListener('paste', (e) => {
                    e.stopPropagation();
                    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                    console.log('Paste event detected, text:', pastedText);
                    
                    // Check if pasted text is an emoji character
                    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/u;
                    
                    if (emojiRegex.test(pastedText)) {
                        e.preventDefault(); // Prevent default paste
                        const emojiChar = pastedText.match(emojiRegex)[0];
                        console.log('Emoji detected in paste:', emojiChar);
                        isProcessingEmoji = true;
                        
                        // Process the emoji character search immediately
                        (async () => {
                            try {
                                const database = picker.database || picker;
                                
                                console.log('Processing pasted emoji:', emojiChar, 'Database:', database);
                                
                                // Try multiple methods to find the emoji
                                let foundEmoji = null;
                                
                                if (database) {
                                    // Method 1: getEmojiByUnicodeOrName
                                    if (typeof database.getEmojiByUnicodeOrName === 'function') {
                                        foundEmoji = await database.getEmojiByUnicodeOrName(emojiChar);
                                        console.log('getEmojiByUnicodeOrName result:', foundEmoji);
                                    }
                                    
                                    // Method 2: Try with code point string
                                    if (!foundEmoji) {
                                        const codePoint = emojiChar.codePointAt(0);
                                        const codePointStr = codePoint.toString(16).toUpperCase();
                                        console.log('Trying code point:', codePointStr);
                                        
                                        if (typeof database.getEmojiByUnicodeOrName === 'function') {
                                            foundEmoji = await database.getEmojiByUnicodeOrName(codePointStr);
                                            console.log('getEmojiByUnicodeOrName with code point result:', foundEmoji);
                                        }
                                        
                                        // Try with U+ prefix
                                        if (!foundEmoji && typeof database.getEmojiByUnicodeOrName === 'function') {
                                            foundEmoji = await database.getEmojiByUnicodeOrName(`U+${codePointStr}`);
                                            console.log('getEmojiByUnicodeOrName with U+ prefix result:', foundEmoji);
                                        }
                                    }
                                    
                                    // Method 3: Try searching by the emoji character directly in the picker
                                    if (!foundEmoji) {
                                        // Access the picker's internal emoji list and find it manually
                                        const shadowRoot = picker.shadowRoot;
                                        if (shadowRoot) {
                                            // Try to find the emoji button in the rendered picker
                                            const emojiButtons = shadowRoot.querySelectorAll('button, [role="button"]');
                                            for (const btn of emojiButtons) {
                                                const btnText = btn.textContent?.trim();
                                                if (btnText === emojiChar) {
                                                    // Found it! Get its data attributes or trigger click
                                                    console.log('Found emoji in rendered buttons');
                                                    // Try to get search term from button's data
                                                    const btnData = btn.getAttribute('data-annotation') || 
                                                                  btn.getAttribute('data-name') ||
                                                                  btn.getAttribute('title') ||
                                                                  '';
                                                    if (btnData) {
                                                        foundEmoji = { annotation: btnData };
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                
                                if (foundEmoji) {
                                    const searchTerm = foundEmoji.annotation || 
                                                     foundEmoji.shortcodes?.[0] || 
                                                     foundEmoji.tags?.[0] ||
                                                     foundEmoji.name || 
                                                     '';
                                    
                                    console.log('Search term extracted:', searchTerm);
                                    
                                    if (searchTerm) {
                                        // Set search to the keyword, which the library will accept
                                        searchInput.value = searchTerm;
                                        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                                        searchInput.dispatchEvent(inputEvent);
                                    } else {
                                        console.log('No search term found for emoji');
                                    }
                                } else {
                                    console.log('Emoji not found in database, trying fallback search');
                                    
                                    // Try getEmojiBySearchQuery as a fallback
                                    if (database && typeof database.getEmojiBySearchQuery === 'function') {
                                        // Try searching with the emoji character itself
                                        const searchResults = await database.getEmojiBySearchQuery(emojiChar);
                                        console.log('getEmojiBySearchQuery results:', searchResults);
                                        
                                        if (searchResults && searchResults.length > 0) {
                                            const firstResult = searchResults[0];
                                            const searchTerm = firstResult.annotation || 
                                                             firstResult.shortcodes?.[0] || 
                                                             firstResult.tags?.[0] ||
                                                             firstResult.name || 
                                                             '';
                                            if (searchTerm) {
                                                searchInput.value = searchTerm;
                                                const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                                                searchInput.dispatchEvent(inputEvent);
                                                return;
                                            }
                                        }
                                    }
                                    
                                    // Fallback: Try to search by common keywords for this emoji
                                    const fallbackTerms = {
                                        '⚡': 'lightning',
                                        '💵': 'money',
                                        '☔': 'umbrella',
                                        '❓': 'question',
                                        '💰': 'money',
                                        '💸': 'money',
                                        '💳': 'card',
                                        '🏠': 'house',
                                        '🚗': 'car',
                                        '🍔': 'burger',
                                        '☕': 'coffee'
                                    };
                                    
                                    if (fallbackTerms[emojiChar]) {
                                        console.log('Using fallback term:', fallbackTerms[emojiChar]);
                                        searchInput.value = fallbackTerms[emojiChar];
                                        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                                        searchInput.dispatchEvent(inputEvent);
                                    } else {
                                        console.log('No fallback term available for emoji:', emojiChar);
                                    }
                                }
                            } catch (error) {
                                console.error('Error processing pasted emoji:', error);
                            } finally {
                                isProcessingEmoji = false;
                            }
                        })();
                        return;
                    }
                    
                    // Check if pasted text is a Unicode code point
                    const unicodeCodePointRegex = /(?:U\+)?([0-9A-Fa-f]{4,6})/;
                    const unicodeMatch = pastedText.match(unicodeCodePointRegex);
                    
                    if (unicodeMatch) {
                        e.preventDefault(); // Prevent default paste
                        const codePoint = parseInt(unicodeMatch[1], 16);
                        try {
                            const emojiChar = String.fromCodePoint(codePoint);
                            isProcessingEmoji = true;
                            
                            // Process the emoji character search
                            (async () => {
                                try {
                                    const database = picker.database || picker;
                                    
                                    if (database && typeof database.getEmojiByUnicodeOrName === 'function') {
                                        const foundEmoji = await database.getEmojiByUnicodeOrName(emojiChar);
                                        
                                        if (foundEmoji) {
                                            const searchTerm = foundEmoji.annotation || 
                                                             foundEmoji.shortcodes?.[0] || 
                                                             foundEmoji.tags?.[0] ||
                                                             foundEmoji.name || 
                                                             '';
                                            
                                            if (searchTerm) {
                                                searchInput.value = searchTerm;
                                                const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                                                searchInput.dispatchEvent(inputEvent);
                                            }
                                        }
                                    }
                                } catch (error) {
                                    console.error('Error processing pasted Unicode code point:', error);
                                } finally {
                                    isProcessingEmoji = false;
                                }
                            })();
                        } catch (error) {
                            console.error('Error converting Unicode code point on paste:', error);
                            isProcessingEmoji = false;
                        }
                        return;
                    }
                    // Otherwise, let the paste happen normally
                });
                
                // Use 'beforeinput' to catch Unicode code points before library processes them
                searchInput.addEventListener('beforeinput', (e) => {
                    const inputData = e.data || '';
                    if (inputData) {
                        const unicodeCodePointRegex = /(?:U\+)?([0-9A-Fa-f]{4,6})/;
                        const unicodeMatch = inputData.match(unicodeCodePointRegex);
                        if (unicodeMatch) {
                            e.preventDefault(); // Prevent default input
                            const codePoint = parseInt(unicodeMatch[1], 16);
                            try {
                                const emojiChar = String.fromCodePoint(codePoint);
                                setTimeout(() => {
                                    searchInput.value = emojiChar;
                                    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                                    searchInput.dispatchEvent(inputEvent);
                                }, 10);
                            } catch (error) {
                                console.error('Error converting Unicode code point on beforeinput:', error);
                            }
                        }
                    }
                });
                
                // Intercept search input to handle emoji characters and Unicode code points
                // Define emoji regex once for reuse
                const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{200D}]|[\u{FE0F}]/u;
                
                searchInput.addEventListener('input', (e) => {
                    // Skip processing if we're already handling an emoji
                    if (isProcessingEmoji) {
                        previousValue = e.target.value;
                        return;
                    }
                    
                    let searchValue = e.target.value;
                    
                    // Check if the value was stripped (library removed our emoji or Unicode code point)
                    // Check if previous value had an emoji but current doesn't
                    const prevEmojiMatch = previousValue.match(emojiRegex);
                    const currentEmojiMatch = searchValue.match(emojiRegex);
                    
                    if (prevEmojiMatch && !currentEmojiMatch) {
                        // Library stripped the emoji, reconstruct it
                        const emojiChar = prevEmojiMatch[0];
                        isProcessingEmoji = true;
                        e.stopPropagation();
                        
                        (async () => {
                            try {
                                const database = picker.database || picker;
                                
                                if (database && typeof database.getEmojiByUnicodeOrName === 'function') {
                                    const foundEmoji = await database.getEmojiByUnicodeOrName(emojiChar);
                                    
                                    if (foundEmoji) {
                                        const searchTerm = foundEmoji.annotation || 
                                                         foundEmoji.shortcodes?.[0] || 
                                                         foundEmoji.tags?.[0] ||
                                                         foundEmoji.name || 
                                                         '';
                                        
                                        if (searchTerm) {
                                            searchInput.value = searchTerm;
                                            const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                                            searchInput.dispatchEvent(inputEvent);
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error('Error reconstructing stripped emoji:', error);
                            } finally {
                                isProcessingEmoji = false;
                                previousValue = searchValue;
                            }
                        })();
                        return;
                    }
                    
                    // Check if the value was stripped (library removed our Unicode code point)
                    // If previous value had a Unicode pattern but current doesn't, library stripped it
                    const prevUnicodeMatch = previousValue.match(/(?:U\+)?([0-9A-Fa-f]{4,6})/);
                    if (prevUnicodeMatch && !searchValue.match(/(?:U\+)?([0-9A-Fa-f]{4,6})/)) {
                        // Library stripped it, reconstruct from previous value
                        const codePoint = parseInt(prevUnicodeMatch[1], 16);
                        try {
                            const emojiChar = String.fromCodePoint(codePoint);
                            isProcessingEmoji = true;
                            e.stopPropagation();
                            
                            (async () => {
                                try {
                                    const database = picker.database || picker;
                                    
                                    if (database && typeof database.getEmojiByUnicodeOrName === 'function') {
                                        const foundEmoji = await database.getEmojiByUnicodeOrName(emojiChar);
                                        
                                        if (foundEmoji) {
                                            const searchTerm = foundEmoji.annotation || 
                                                             foundEmoji.shortcodes?.[0] || 
                                                             foundEmoji.tags?.[0] ||
                                                             foundEmoji.name || 
                                                             '';
                                            
                                            if (searchTerm) {
                                                searchInput.value = searchTerm;
                                                const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                                                searchInput.dispatchEvent(inputEvent);
                                            }
                                        }
                                    }
                                } catch (error) {
                                    console.error('Error reconstructing stripped Unicode code point:', error);
                                } finally {
                                    isProcessingEmoji = false;
                                    previousValue = searchValue;
                                }
                            })();
                            return;
                        } catch (error) {
                            console.error('Error converting Unicode code point:', error);
                            isProcessingEmoji = false;
                        }
                    }
                    
                    // Check for Unicode code point pattern (in case beforeinput didn't catch it)
                    const unicodeCodePointRegex = /(?:U\+)?([0-9A-Fa-f]{4,6})/;
                    const unicodeMatch = searchValue.match(unicodeCodePointRegex);
                    
                    // Check if the entire value is a Unicode code point or contains one
                    if (unicodeMatch && (searchValue.trim() === unicodeMatch[0] || /^[0-9A-Fa-f]{4,6}$/i.test(searchValue.trim()))) {
                        // If the entire search value is a Unicode code point, handle it
                        const codePoint = parseInt(unicodeMatch[1], 16);
                        try {
                            const emojiChar = String.fromCodePoint(codePoint);
                            
                            // Prevent event from bubbling up
                            e.stopPropagation();
                            
                            // Process immediately before library can strip it
                            (async () => {
                                try {
                                    const database = picker.database || picker;
                                    
                                    console.log('Searching for Unicode code point:', unicodeMatch[1], 'Emoji:', emojiChar);
                                    
                                    if (database && typeof database.getEmojiByUnicodeOrName === 'function') {
                                        const foundEmoji = await database.getEmojiByUnicodeOrName(emojiChar);
                                        console.log('Found emoji object:', foundEmoji);
                                        
                                        if (foundEmoji) {
                                            const searchTerm = foundEmoji.annotation || 
                                                             foundEmoji.shortcodes?.[0] || 
                                                             foundEmoji.tags?.[0] ||
                                                             foundEmoji.name || 
                                                             '';
                                            
                                            console.log('Search term extracted:', searchTerm);
                                            
                                            if (searchTerm) {
                                                setTimeout(() => {
                                                    searchInput.value = searchTerm;
                                                    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                                                    searchInput.dispatchEvent(inputEvent);
                                                }, 10);
                                            } else {
                                                setTimeout(() => {
                                                    searchInput.value = '';
                                                    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                                                    searchInput.dispatchEvent(inputEvent);
                                                }, 10);
                                            }
                                            return;
                                        }
                                    }
                                    
                                    // Fallback: clear search
                                    setTimeout(() => {
                                        searchInput.value = '';
                                        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                                        searchInput.dispatchEvent(inputEvent);
                                    }, 10);
                                    
                                } catch (error) {
                                    console.error('Error finding emoji by Unicode code point:', error);
                                    setTimeout(() => {
                                        searchInput.value = '';
                                        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                                        searchInput.dispatchEvent(inputEvent);
                                    }, 10);
                                }
                            })();
                            
                            previousValue = searchValue;
                            return; // Don't process as regular emoji character
                        } catch (error) {
                            console.error('Error converting Unicode code point:', error);
                        }
                    }
                    
                    // Update previous value for next comparison
                    previousValue = searchValue;
                    
                    // Check if the search value contains an emoji character
                    if (emojiRegex.test(searchValue)) {
                        // Extract the emoji from the search string
                        const emojiMatch = searchValue.match(emojiRegex);
                        if (emojiMatch && emojiMatch[0]) {
                            const emojiChar = emojiMatch[0];
                            
                            // Prevent event from bubbling up (might trigger close)
                            e.stopPropagation();
                            
                            // Use the picker's database API to find the emoji by Unicode and get its keywords
                            (async () => {
                                try {
                                    // Access the picker's database API
                                    // The API might be picker.database or picker itself
                                    const database = picker.database || picker;
                                    
                                    console.log('Searching for emoji:', emojiChar, 'Database:', database);
                                    
                                    if (database && typeof database.getEmojiByUnicodeOrName === 'function') {
                                        // This returns a promise
                                        const foundEmoji = await database.getEmojiByUnicodeOrName(emojiChar);
                                        console.log('Found emoji object:', foundEmoji);
                                        
                                        if (foundEmoji) {
                                            // Get the emoji's annotation/keywords for searching
                                            // The emoji object should have 'annotation', 'shortcodes', or 'tags'
                                            const searchTerm = foundEmoji.annotation || 
                                                             foundEmoji.shortcodes?.[0] || 
                                                             foundEmoji.tags?.[0] ||
                                                             foundEmoji.name || 
                                                             '';
                                            
                                            console.log('Search term extracted:', searchTerm);
                                            
                                            if (searchTerm) {
                                                // Set the search to the emoji's annotation/keyword
                                                // This will make the library's normal keyword search find it
                                                setTimeout(() => {
                                                    searchInput.value = searchTerm;
                                                    // Trigger input event to let library process the search
                                                    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                                                    searchInput.dispatchEvent(inputEvent);
                                                }, 50);
                                            } else {
                                                console.log('No search term found, clearing search');
                                                // If no keywords found, clear search to show all
                                                setTimeout(() => {
                                                    searchInput.value = '';
                                                    const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                                                    searchInput.dispatchEvent(inputEvent);
                                                }, 50);
                                            }
                                            return;
                                        } else {
                                            console.log('Emoji not found in database');
                                        }
                                    } else {
                                        console.log('Database API not available. Database:', database, 'Has method:', database && typeof database.getEmojiByUnicodeOrName);
                                    }
                                    
                                    // Fallback: If API not available, clear search to show all emojis
                                    setTimeout(() => {
                                        searchInput.value = '';
                                        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                                        searchInput.dispatchEvent(inputEvent);
                                    }, 50);
                                    
                                } catch (error) {
                                    console.error('Error finding emoji by Unicode:', error);
                                    // On error, clear search to show all
                                    setTimeout(() => {
                                        searchInput.value = '';
                                        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                                        searchInput.dispatchEvent(inputEvent);
                                    }, 50);
                                }
                            })();
                        }
                    }
                });
            }
        }, 500);
        
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
