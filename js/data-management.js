// Data Management (Income, Expenses & Methods) - Available globally as DataManagement

const DataManagement = {
    setup() {
        // Income - Add button handler
        const addIncomeHandler = async () => {
            const input = document.getElementById('new-income');
            const value = input.value.trim();
            if (!value) return;
            
            // Split by comma and process each item
            const items = value.split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);
            
            if (items.length === 0) return;
            
            let successCount = 0;
            let failCount = 0;
            const errors = [];
            
            // Add each item
            for (const item of items) {
                // Skip if already exists
                // Check if already exists (handle both old string format and new object format)
                const exists = DataStore.income.some(cat => {
                    const catName = typeof cat === 'string' ? cat : (cat.name || cat);
                    return catName === item;
                });
                if (exists) {
                    failCount++;
                    errors.push(`"${item}" already exists`);
                    continue;
                }
                
                try {
                    const response = await fetch(`${API.BASE}/income`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: item })
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || 'Failed to add income category');
                    }
                    successCount++;
                } catch (error) {
                    console.error(`Error adding income category "${item}":`, error);
                    failCount++;
                    errors.push(`"${item}": ${error.message || 'Failed to add'}`);
                }
            }
            
            // Reload data after all additions
            if (successCount > 0) {
                const data = await API.loadData();
                DataStore.init(data);
                this.updateIncomeList();
            }
            
            // Clear input
            input.value = '';
            
            // Show feedback
            if (successCount > 0 && failCount > 0) {
                alert(`Added ${successCount} income categor${successCount === 1 ? 'y' : 'ies'} successfully.\n\nFailed to add ${failCount}:\n${errors.join('\n')}`);
            } else if (failCount > 0) {
                alert(`Failed to add income categor${items.length === 1 ? 'y' : 'ies'}:\n${errors.join('\n')}`);
            }
        };
        
        document.getElementById('add-income-btn').addEventListener('click', addIncomeHandler);
        
        // Income - Enter key support
        document.getElementById('new-income').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addIncomeHandler();
            }
        });

        // Expenses - Add button handler
        const addExpenseHandler = async () => {
            const input = document.getElementById('new-expense');
            const value = input.value.trim();
            if (!value) return;
            
            // Split by comma and process each item
            const items = value.split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);
            
            if (items.length === 0) return;
            
            let successCount = 0;
            let failCount = 0;
            const errors = [];
            
            // Add each item
            for (const item of items) {
                // Skip if already exists
                // Check if already exists (handle both old string format and new object format)
                const exists = DataStore.expenses.some(cat => {
                    const catName = typeof cat === 'string' ? cat : (cat.name || cat);
                    return catName === item;
                });
                if (exists) {
                    failCount++;
                    errors.push(`"${item}" already exists`);
                    continue;
                }
                
                try {
                    const response = await fetch(`${API.BASE}/expenses`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: item })
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || 'Failed to add expense category');
                    }
                    successCount++;
                } catch (error) {
                    console.error(`Error adding expense category "${item}":`, error);
                    failCount++;
                    errors.push(`"${item}": ${error.message || 'Failed to add'}`);
                }
            }
            
            // Reload data after all additions
            if (successCount > 0) {
                const data = await API.loadData();
                DataStore.init(data);
                this.updateExpensesList();
            }
            
            // Clear input
            input.value = '';
            
            // Show feedback
            if (successCount > 0 && failCount > 0) {
                alert(`Added ${successCount} expense categor${successCount === 1 ? 'y' : 'ies'} successfully.\n\nFailed to add ${failCount}:\n${errors.join('\n')}`);
            } else if (failCount > 0) {
                alert(`Failed to add expense categor${items.length === 1 ? 'y' : 'ies'}:\n${errors.join('\n')}`);
            }
        };
        
        document.getElementById('add-expense-btn').addEventListener('click', addExpenseHandler);
        
        // Expenses - Enter key support
        document.getElementById('new-expense').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addExpenseHandler();
            }
        });

        // Methods - Add button handler
        const addMethodHandler = async () => {
            const input = document.getElementById('new-method');
            const value = input.value.trim();
            if (!value) return;
            
            // Split by comma and process each item
            const items = value.split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);
            
            if (items.length === 0) return;
            
            let successCount = 0;
            let failCount = 0;
            const errors = [];
            
            // Add each item
            for (const item of items) {
            // Skip if already exists
            const methodExists = DataStore.methods.some(m => {
                const mName = typeof m === 'string' ? m : (m.name || m);
                return mName === item;
            });
            if (methodExists) {
                failCount++;
                errors.push(`"${item}" already exists`);
                continue;
            }
                
                try {
                    const response = await fetch(`${API.BASE}/methods`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: item })
                    });
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || 'Failed to add method');
                    }
                    successCount++;
                } catch (error) {
                    console.error(`Error adding method "${item}":`, error);
                    failCount++;
                    errors.push(`"${item}": ${error.message || 'Failed to add'}`);
                }
            }
            
            // Reload data after all additions
            if (successCount > 0) {
                const data = await API.loadData();
                DataStore.init(data);
                this.updateMethodsList();
            }
            
            // Clear input
            input.value = '';
            
            // Show feedback
            if (successCount > 0 && failCount === 0) {
                // All succeeded - no message needed
            } else if (successCount > 0 && failCount > 0) {
                alert(`Added ${successCount} payment method${successCount === 1 ? '' : 's'} successfully.\n\nFailed to add ${failCount}:\n${errors.join('\n')}`);
            } else {
                alert(`Failed to add payment method${items.length === 1 ? '' : 's'}:\n${errors.join('\n')}`);
            }
        };
        
        document.getElementById('add-method-btn').addEventListener('click', addMethodHandler);
        
        // Methods - Enter key support
        document.getElementById('new-method').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addMethodHandler();
            }
        });

        this.updateIncomeList();
        this.updateExpensesList();
        this.updateMethodsList();
    },

    updateIncomeList() {
        const list = document.getElementById('income-list');
        if (!list) return;
        list.innerHTML = '';

        // Sort income categories alphabetically (handle both old string format and new object format)
        // Filter out "Default" category from display
        const sortedIncome = [...DataStore.income]
            .filter(cat => {
                const catName = typeof cat === 'string' ? cat : (cat.name || cat);
                return catName !== 'Default';
            })
            .sort((a, b) => {
                const aName = typeof a === 'string' ? a : (a.name || a);
                const bName = typeof b === 'string' ? b : (b.name || b);
                return aName.localeCompare(bName);
            });

        sortedIncome.forEach((cat, index) => {
            // Get category name
            const catName = typeof cat === 'string' ? cat : (cat.name || cat);
            
            // Find the original index in DataStore.income for data operations
            const originalIndex = DataStore.income.findIndex(c => {
                const cName = typeof c === 'string' ? c : (c.name || c);
                return cName === catName;
            });
            
            const li = document.createElement('li');
            li.dataset.index = originalIndex;
            li.dataset.originalValue = catName;
            li.dataset.categoryType = 'income';
            
            const isDefault = catName === 'Default';
            
            // Checkbox (disabled for Default)
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'row-checkbox';
            checkbox.style.marginRight = '10px';
            if (isDefault) {
                checkbox.disabled = true;
                checkbox.title = 'Default income category cannot be selected';
            }
            
            // Icon button container
            const iconContainer = document.createElement('div');
            iconContainer.style.position = 'relative';
            iconContainer.style.display = 'inline-block';
            iconContainer.style.marginRight = '10px';
            
            const iconBtn = document.createElement('button');
            iconBtn.className = 'category-icon-btn';
            // Get icon from DataStore if available
            const categoryData = DataStore.income.find(c => (c.name || c) === catName);
            const currentIcon = (categoryData && categoryData.icon) ? categoryData.icon : '🎨';
            iconBtn.textContent = currentIcon;
            iconBtn.title = currentIcon === '🎨' ? 'Icon' : `Icon: ${currentIcon}`;
            iconBtn.onclick = (e) => {
                e.stopPropagation();
                this.showEmojiPicker(iconBtn, catName, 'income', originalIndex, iconContainer);
            };
            
            // Clear button (only show if icon is set)
            if (currentIcon !== '🎨') {
                const clearBtn = document.createElement('button');
                clearBtn.className = 'icon-clear-btn';
                clearBtn.innerHTML = '×';
                clearBtn.title = 'Remove icon';
                clearBtn.onclick = async (e) => {
                    e.stopPropagation();
                    await this.clearIcon(catName, 'income', iconBtn, iconContainer);
                };
                iconContainer.appendChild(clearBtn);
            }
            
            iconContainer.appendChild(iconBtn);
            
            // Editable name span (not editable for Default)
            const nameSpan = document.createElement('span');
            nameSpan.className = 'income-name editable-name';
            nameSpan.textContent = catName;
            if (isDefault) {
                nameSpan.style.cursor = 'not-allowed';
                nameSpan.style.opacity = '0.6';
                nameSpan.title = 'Default income category cannot be edited';
            } else {
                nameSpan.style.cursor = 'pointer';
                nameSpan.style.flex = '1';
                nameSpan.addEventListener('click', (e) => {
                    if (!li.classList.contains('editing')) {
                        this.enterEditMode(li, nameSpan, 'income', originalIndex, catName);
                    }
                });
            }
            
            // Delete button (disabled for Default)
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '🗑️';
            if (isDefault) {
                deleteBtn.disabled = true;
                deleteBtn.style.opacity = '0.5';
                deleteBtn.style.cursor = 'not-allowed';
                deleteBtn.title = 'Default income category cannot be deleted';
            } else {
                deleteBtn.title = 'Delete';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.deleteIncome(catName);
                };
            }
            
            // Action buttons container
            const actionButtons = document.createElement('div');
            actionButtons.className = 'action-buttons';
            actionButtons.appendChild(deleteBtn);
            
            li.appendChild(checkbox);
            li.appendChild(iconContainer);
            li.appendChild(nameSpan);
            li.appendChild(actionButtons);
            list.appendChild(li);
        });
    },

    updateExpensesList() {
        const list = document.getElementById('expenses-list');
        if (!list) return;
        list.innerHTML = '';

        // Sort expense categories alphabetically (handle both old string format and new object format)
        // Filter out "Default" category from display
        const sortedExpenses = [...DataStore.expenses]
            .filter(cat => {
                const catName = typeof cat === 'string' ? cat : (cat.name || cat);
                return catName !== 'Default';
            })
            .sort((a, b) => {
                const aName = typeof a === 'string' ? a : (a.name || a);
                const bName = typeof b === 'string' ? b : (b.name || b);
                return aName.localeCompare(bName);
            });

        sortedExpenses.forEach((cat, index) => {
            // Get category name
            const catName = typeof cat === 'string' ? cat : (cat.name || cat);
            
            // Find the original index in DataStore.expenses for data operations
            const originalIndex = DataStore.expenses.findIndex(c => {
                const cName = typeof c === 'string' ? c : (c.name || c);
                return cName === catName;
            });
            
            const li = document.createElement('li');
            li.dataset.index = originalIndex;
            li.dataset.originalValue = catName;
            li.dataset.categoryType = 'expenses';
            
            const isDefault = catName === 'Default';
            
            // Checkbox (disabled for Default)
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'row-checkbox';
            checkbox.style.marginRight = '10px';
            if (isDefault) {
                checkbox.disabled = true;
                checkbox.title = 'Default expense category cannot be selected';
            }
            
            // Icon button container
            const iconContainer = document.createElement('div');
            iconContainer.style.position = 'relative';
            iconContainer.style.display = 'inline-block';
            iconContainer.style.marginRight = '10px';
            
            const iconBtn = document.createElement('button');
            iconBtn.className = 'category-icon-btn';
            // Get icon from DataStore if available
            const categoryData = DataStore.expenses.find(c => (c.name || c) === catName);
            const currentIcon = (categoryData && categoryData.icon) ? categoryData.icon : '🎨';
            iconBtn.textContent = currentIcon;
            iconBtn.title = currentIcon === '🎨' ? 'Icon' : `Icon: ${currentIcon}`;
            iconBtn.onclick = (e) => {
                e.stopPropagation();
                this.showEmojiPicker(iconBtn, catName, 'expenses', originalIndex, iconContainer);
            };
            
            // Clear button (only show if icon is set)
            if (currentIcon !== '🎨') {
                const clearBtn = document.createElement('button');
                clearBtn.className = 'icon-clear-btn';
                clearBtn.innerHTML = '×';
                clearBtn.title = 'Remove icon';
                clearBtn.onclick = async (e) => {
                    e.stopPropagation();
                    await this.clearIcon(catName, 'expenses', iconBtn, iconContainer);
                };
                iconContainer.appendChild(clearBtn);
            }
            
            iconContainer.appendChild(iconBtn);
            
            // Editable name span (not editable for Default)
            const nameSpan = document.createElement('span');
            nameSpan.className = 'expense-name editable-name';
            nameSpan.textContent = catName;
            if (isDefault) {
                nameSpan.style.cursor = 'not-allowed';
                nameSpan.style.opacity = '0.6';
                nameSpan.title = 'Default expense category cannot be edited';
            } else {
                nameSpan.style.cursor = 'pointer';
                nameSpan.style.flex = '1';
                nameSpan.addEventListener('click', (e) => {
                    if (!li.classList.contains('editing')) {
                        this.enterEditMode(li, nameSpan, 'expenses', originalIndex, catName);
                    }
                });
            }
            
            // Delete button (disabled for Default)
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '🗑️';
            if (isDefault) {
                deleteBtn.disabled = true;
                deleteBtn.style.opacity = '0.5';
                deleteBtn.style.cursor = 'not-allowed';
                deleteBtn.title = 'Default expense category cannot be deleted';
            } else {
                deleteBtn.title = 'Delete';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.deleteExpense(catName);
                };
            }
            
            // Action buttons container
            const actionButtons = document.createElement('div');
            actionButtons.className = 'action-buttons';
            actionButtons.appendChild(deleteBtn);
            
            li.appendChild(checkbox);
            li.appendChild(iconContainer);
            li.appendChild(nameSpan);
            li.appendChild(actionButtons);
            list.appendChild(li);
        });
    },

    updateMethodsList() {
        const list = document.getElementById('methods-list');
        list.innerHTML = '';

        // Filter out "Default" from display and sort alphabetically
        // Handle both old format (strings) and new format (objects with name)
        const sortedMethods = [...DataStore.methods]
            .filter(method => {
                const methodName = typeof method === 'string' ? method : (method.name || method);
                return methodName !== 'Default';
            })
            .sort((a, b) => {
                const aName = typeof a === 'string' ? a : (a.name || a);
                const bName = typeof b === 'string' ? b : (b.name || b);
                return aName.localeCompare(bName);
            });

        sortedMethods.forEach((method) => {
            // Get method name
            const methodName = typeof method === 'string' ? method : (method.name || method);
            
            // Find the original index in DataStore.methods for data operations
            const originalIndex = DataStore.methods.findIndex(m => {
                const mName = typeof m === 'string' ? m : (m.name || m);
                return mName === methodName;
            });
            
            const li = document.createElement('li');
            li.dataset.index = originalIndex;
            li.dataset.originalValue = methodName;
            
            // Checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'row-checkbox';
            checkbox.style.marginRight = '10px';
            
            // Icon button container
            const iconContainer = document.createElement('div');
            iconContainer.style.position = 'relative';
            iconContainer.style.display = 'inline-block';
            iconContainer.style.marginRight = '10px';
            
            const iconBtn = document.createElement('button');
            iconBtn.className = 'category-icon-btn';
            // Get icon from DataStore if available
            const methodData = DataStore.methods.find(m => {
                const mName = typeof m === 'string' ? m : (m.name || m);
                return mName === methodName;
            });
            const currentIcon = (methodData && methodData.icon) ? methodData.icon : '🎨';
            iconBtn.textContent = currentIcon;
            iconBtn.title = currentIcon === '🎨' ? 'Icon' : `Icon: ${currentIcon}`;
            iconBtn.onclick = (e) => {
                e.stopPropagation();
                this.showEmojiPicker(iconBtn, methodName, 'methods', originalIndex, iconContainer);
            };
            
            // Clear button (only show if icon is set)
            if (currentIcon !== '🎨') {
                const clearBtn = document.createElement('button');
                clearBtn.className = 'icon-clear-btn';
                clearBtn.innerHTML = '×';
                clearBtn.title = 'Remove icon';
                clearBtn.onclick = async (e) => {
                    e.stopPropagation();
                    await this.clearIcon(methodName, 'methods', iconBtn, iconContainer);
                };
                iconContainer.appendChild(clearBtn);
            }
            
            iconContainer.appendChild(iconBtn);
            
            // Editable name span
            const nameSpan = document.createElement('span');
            nameSpan.className = 'method-name editable-name';
            nameSpan.textContent = methodName;
            nameSpan.style.cursor = 'pointer';
            nameSpan.style.flex = '1';
            nameSpan.addEventListener('click', (e) => {
                if (!li.classList.contains('editing')) {
                    this.enterEditMode(li, nameSpan, 'method', originalIndex, methodName);
                }
            });
            
            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Delete';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteMethod(methodName);
            };
            
            // Action buttons container
            const actionButtons = document.createElement('div');
            actionButtons.className = 'action-buttons';
            actionButtons.appendChild(deleteBtn);
            
            li.appendChild(checkbox);
            li.appendChild(iconBtn);
            li.appendChild(nameSpan);
            li.appendChild(actionButtons);
            list.appendChild(li);
        });
    },

    enterEditMode(li, nameSpan, type, index, currentValue) {
        // Close any other editing fields first
        const list = li.parentElement;
        const otherEditing = list.querySelector('li.editing');
        if (otherEditing && otherEditing !== li) {
            const otherInput = otherEditing.querySelector('input.inline-edit-input');
            if (otherInput) {
                const otherValue = otherInput.value.trim();
                const otherOriginal = otherEditing.dataset.originalValue;
                if (otherValue !== otherOriginal) {
                    // Save the other edit first
                    this.saveEdit(otherEditing, otherInput, type, otherValue, otherOriginal);
                } else {
                    // Just cancel
                    this.exitEditMode(otherEditing, otherOriginal);
                }
            }
        }
        
        li.classList.add('editing');
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'inline-edit-input';
        input.value = currentValue;
        input.maxLength = 50;
        input.style.width = '100%';
        input.style.padding = '4px 8px';
        input.style.border = '2px solid #2196F3';
        input.style.borderRadius = '4px';
        input.style.fontSize = '14px';
        
        nameSpan.textContent = '';
        nameSpan.appendChild(input);
        input.focus();
        input.select();
        
        const saveEdit = async () => {
            // Don't save if edit was canceled - just exit edit mode
            if (shouldCancel || (input.dataset && input.dataset.cancelEdit === 'true')) {
                console.log('[Edit] Save canceled - edit was canceled, exiting without saving');
                shouldCancel = false;
                if (input.dataset) {
                    input.dataset.cancelEdit = 'false';
                }
                this.exitEditMode(li, currentValue);
                return;
            }
            
            const newValue = input.value.trim();
            // If value hasn't changed, just exit edit mode without saving (no API call, no duplicate check)
            if (newValue === currentValue) {
                console.log('[Edit] Value unchanged, exiting edit mode without saving');
                this.exitEditMode(li, currentValue);
                return;
            }
            
            // If empty, delete the item(s) instead
            if (!newValue) {
                // Exit edit mode first to avoid issues
                this.exitEditMode(li, currentValue);
                
                // Check if bulk editing
                const checkbox = li.querySelector('.row-checkbox');
                const isChecked = checkbox && checkbox.checked;
                
                if (isChecked) {
                    // Bulk delete all checked items
                    const list = li.parentElement;
                    const checkedBoxes = list.querySelectorAll('.row-checkbox:checked');
                    const itemsToDelete = Array.from(checkedBoxes).map(cb => {
                        const itemLi = cb.closest('li');
                        // Use originalValue from dataset (reliable even if editing)
                        return itemLi.dataset.originalValue;
                    });
                    
                    // Include current item if not already in list
                    if (!itemsToDelete.includes(currentValue)) {
                        itemsToDelete.push(currentValue);
                    }
                    
                    const count = itemsToDelete.length;
                    if (confirm(`Delete ${count} ${type}${count === 1 ? '' : 's'}?`)) {
                        if (type === 'income') {
                            for (const item of itemsToDelete) {
                                await this.deleteIncome(item, true); // true = skip confirmation
                            }
                        } else if (type === 'expenses') {
                            for (const item of itemsToDelete) {
                                await this.deleteExpense(item, true); // true = skip confirmation
                            }
                        } else {
                            for (const item of itemsToDelete) {
                                await this.deleteMethod(item, true); // true = skip confirmation
                            }
                        }
                    }
                } else {
                    // Single delete
                    if (confirm(`Delete "${currentValue}"?`)) {
                        if (type === 'income') {
                            await this.deleteIncome(currentValue, true); // true = skip confirmation
                        } else if (type === 'expenses') {
                            await this.deleteExpense(currentValue, true); // true = skip confirmation
                        } else {
                            await this.deleteMethod(currentValue, true); // true = skip confirmation
                        }
                    }
                }
                return;
            }
            
            // Check if bulk editing
            const checkbox = li.querySelector('.row-checkbox');
            const isChecked = checkbox && checkbox.checked;
            
            if (isChecked) {
                // Bulk edit: apply to all checked items
                await this.bulkEdit(type, newValue, index, currentValue);
            } else {
                // Single edit
                await this.saveEdit(li, input, type, newValue, currentValue);
            }
        };
        
        const cancelEdit = () => {
            this.exitEditMode(li, currentValue);
        };
        
        let shouldCancel = false;
        let blurHandler = null;
        
        blurHandler = (e) => {
            // Check immediately if edit was canceled (e.g., by clicking icon box)
            // Also check if the input is still in the DOM and the li is still in editing mode
            if (!input || !input.parentElement || 
                !li.classList.contains('editing') ||
                !document.contains(input) ||
                (input.dataset && input.dataset.cancelEdit === 'true') ||
                shouldCancel) {
                console.log('[Edit] Blur event canceled - edit was canceled or input removed');
                if (input && input.dataset) {
                    input.dataset.cancelEdit = 'false';
                }
                shouldCancel = false;
                // Remove the event listener to prevent it from firing again
                if (input && blurHandler) {
                    input.removeEventListener('blur', blurHandler);
                }
                return;
            }
            
            // Get the new value before the timeout
            const newValue = input.value.trim();
            const valueChanged = newValue !== currentValue;
            
            setTimeout(() => {
                // Triple-check everything - input might have been removed during the timeout
                // Also check if value actually changed - don't save if it's the same
                if (!input || !input.parentElement || 
                    !li.classList.contains('editing') ||
                    !document.contains(input) ||
                    (input.dataset && input.dataset.cancelEdit === 'true') ||
                    shouldCancel ||
                    !valueChanged) {
                    console.log('[Edit] Blur save canceled - input removed, edit canceled, or value unchanged');
                    if (input && input.dataset) {
                        input.dataset.cancelEdit = 'false';
                    }
                    shouldCancel = false;
                    // If value didn't change, just exit edit mode without saving
                    if (!valueChanged && input && li.classList.contains('editing')) {
                        this.exitEditMode(li, currentValue);
                    }
                    return;
                }
                // Only save if value changed and edit wasn't canceled
                if (!shouldCancel && valueChanged) {
                    saveEdit();
                } else {
                    shouldCancel = false;
                }
            }, 10);
        };
        
        input.addEventListener('blur', blurHandler);
        // Store the blur handler reference on the input so we can remove it when canceling
        input._blurHandler = blurHandler;
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                shouldCancel = true;
                input.blur();
                cancelEdit();
            }
        });
    },

    exitEditMode(li, value) {
        li.classList.remove('editing');
        const nameSpan = li.querySelector('.editable-name');
        if (nameSpan) {
            nameSpan.textContent = value;
        }
    },

    async saveEdit(li, input, type, newValue, oldValue) {
        // Prevent editing "Default"
        if (oldValue === 'Default') {
            this.exitEditMode(li, oldValue);
            return;
        }
        
        const index = parseInt(li.dataset.index);
        
        try {
            const endpoint = type === 'income' ? 'income' : (type === 'expenses' ? 'expenses' : 'methods');
            const requestBody = { name: newValue };
            
            const response = await fetch(`${API.BASE}/${endpoint}/${index}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || `Failed to update ${type}`);
            }
            
            // Reload data
            const data = await API.loadData();
            DataStore.init(data);
            
            if (type === 'income') {
                this.updateIncomeList();
            } else if (type === 'expenses') {
                this.updateExpensesList();
            } else {
                this.updateMethodsList();
            }
            
            // Update other views
            if (window.Dashboard) Dashboard.update();
            if (window.Ledger) Ledger.update();
        } catch (error) {
            console.error(`Error updating ${type}:`, error);
            alert(`Failed to update ${type}. ${error.message || 'Please try again.'}`);
            // Restore original value on error
            this.exitEditMode(li, oldValue);
        }
    },

    async bulkEdit(type, newValue, currentIndex, oldValue) {
        const listId = type === 'income' ? 'income-list' : (type === 'expenses' ? 'expenses-list' : 'methods-list');
        const list = document.getElementById(listId);
        const checkedBoxes = list.querySelectorAll('.row-checkbox:checked');
        
        if (checkedBoxes.length === 0) {
            // No checked items, just do single edit
            const li = list.querySelector(`li[data-index="${currentIndex}"]`);
            const input = li.querySelector('.inline-edit-input');
            await this.saveEdit(li, input, type, newValue, oldValue);
            return;
        }
        
        const checkedIndices = Array.from(checkedBoxes).map(cb => {
            return parseInt(cb.closest('li').dataset.index);
        });
        
        // Ensure current index is included
        if (!checkedIndices.includes(currentIndex)) {
            checkedIndices.push(currentIndex);
        }
        
        // Filter out "Default" from bulk edit
        const filteredIndices = checkedIndices.filter(idx => {
            const li = list.querySelector(`li[data-index="${idx}"]`);
            return li && li.dataset.originalValue !== 'Default';
        });
        
        if (filteredIndices.length === 0) {
            // All were Default, just do single edit if current is not Default
            if (oldValue !== 'Default') {
                const li = list.querySelector(`li[data-index="${currentIndex}"]`);
                const input = li.querySelector('.inline-edit-input');
                await this.saveEdit(li, input, type, newValue, oldValue);
            }
            return;
        }
        
        let successCount = 0;
        let failCount = 0;
        const errors = [];
        
        // Update all checked items (excluding Default)
        for (const index of filteredIndices) {
            try {
                const endpoint = type === 'income' ? 'income' : (type === 'expenses' ? 'expenses' : 'methods');
                const response = await fetch(`${API.BASE}/${endpoint}/${index}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newValue })
                });
                
                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error.error || `Failed to update ${type}`);
                }
                successCount++;
            } catch (error) {
                console.error(`Error bulk updating ${type} at index ${index}:`, error);
                failCount++;
                errors.push(`Index ${index}: ${error.message || 'Failed'}`);
            }
        }
        
        // Reload data
        const data = await API.loadData();
        DataStore.init(data);
        
        if (type === 'income') {
            this.updateIncomeList();
        } else if (type === 'expenses') {
            this.updateExpensesList();
        } else {
            this.updateMethodsList();
        }
        
        // Update other views
        if (window.Dashboard) Dashboard.update();
        if (window.Ledger) Ledger.update();
        
        // Show feedback if there were failures
        if (failCount > 0) {
            alert(`Updated ${successCount} item${successCount === 1 ? '' : 's'} successfully.\n\nFailed to update ${failCount}:\n${errors.join('\n')}`);
        }
    },

    async deleteIncome(category, skipConfirmation = false) {
        // Check for bulk deletion
        const list = document.getElementById('income-list');
        const checkedBoxes = list ? list.querySelectorAll('.row-checkbox:checked') : [];
        
        if (checkedBoxes.length > 0) {
            // Bulk delete
            const checkedCategories = Array.from(checkedBoxes).map(cb => {
                return cb.closest('li').querySelector('.income-name').textContent;
            });
            
            // Include current if not already in list
            if (!checkedCategories.includes(category)) {
                checkedCategories.push(category);
            }
            
            const count = checkedCategories.length;
            if (skipConfirmation || confirm(`Are you sure you want to delete ${count} income categor${count === 1 ? 'y' : 'ies'}?`)) {
                let successCount = 0;
                let failCount = 0;
                
                for (const cat of checkedCategories) {
                    try {
                        const response = await fetch(`${API.BASE}/income/${encodeURIComponent(cat)}`, {
                            method: 'DELETE'
                        });
                        if (!response.ok) throw new Error('Failed to delete income category');
                        successCount++;
                    } catch (error) {
                        console.error(`Error deleting income category "${cat}":`, error);
                        failCount++;
                    }
                }
                
                const data = await API.loadData();
                DataStore.init(data);
                this.updateIncomeList();
                
                if (window.Dashboard) Dashboard.update();
                if (window.Ledger) Ledger.update();
                
                if (failCount > 0) {
                    alert(`Deleted ${successCount} income categor${successCount === 1 ? 'y' : 'ies'} successfully. Failed to delete ${failCount}.`);
                }
            }
        } else {
            // Single delete
            if (skipConfirmation || confirm(`Are you sure you want to delete the income category "${category}"?`)) {
                try {
                    const response = await fetch(`${API.BASE}/income/${encodeURIComponent(category)}`, {
                        method: 'DELETE'
                    });
                    if (!response.ok) throw new Error('Failed to delete income category');
                    
                    const data = await API.loadData();
                    DataStore.init(data);
                    this.updateIncomeList();
                    
                    if (window.Dashboard) Dashboard.update();
                    if (window.Ledger) Ledger.update();
                } catch (error) {
                    console.error('Error deleting income category:', error);
                    alert('Failed to delete income category. Please try again.');
                }
            }
        }
    },

    async deleteExpense(category, skipConfirmation = false) {
        // Check for bulk deletion
        const list = document.getElementById('expenses-list');
        const checkedBoxes = list ? list.querySelectorAll('.row-checkbox:checked') : [];
        
        if (checkedBoxes.length > 0) {
            // Bulk delete
            const checkedCategories = Array.from(checkedBoxes).map(cb => {
                return cb.closest('li').querySelector('.expense-name').textContent;
            });
            
            // Include current if not already in list
            if (!checkedCategories.includes(category)) {
                checkedCategories.push(category);
            }
            
            const count = checkedCategories.length;
            if (skipConfirmation || confirm(`Are you sure you want to delete ${count} expense categor${count === 1 ? 'y' : 'ies'}?`)) {
                let successCount = 0;
                let failCount = 0;
                
                for (const cat of checkedCategories) {
                    try {
                        const response = await fetch(`${API.BASE}/expenses/${encodeURIComponent(cat)}`, {
                            method: 'DELETE'
                        });
                        if (!response.ok) throw new Error('Failed to delete expense category');
                        successCount++;
                    } catch (error) {
                        console.error(`Error deleting expense category "${cat}":`, error);
                        failCount++;
                    }
                }
                
                const data = await API.loadData();
                DataStore.init(data);
                this.updateExpensesList();
                
                if (window.Dashboard) Dashboard.update();
                if (window.Ledger) Ledger.update();
                
                if (failCount > 0) {
                    alert(`Deleted ${successCount} expense categor${successCount === 1 ? 'y' : 'ies'} successfully. Failed to delete ${failCount}.`);
                }
            }
        } else {
            // Single delete
            if (skipConfirmation || confirm(`Are you sure you want to delete the expense category "${category}"?`)) {
                try {
                    const response = await fetch(`${API.BASE}/expenses/${encodeURIComponent(category)}`, {
                        method: 'DELETE'
                    });
                    if (!response.ok) throw new Error('Failed to delete expense category');
                    
                    const data = await API.loadData();
                    DataStore.init(data);
                    this.updateExpensesList();
                    
                    if (window.Dashboard) Dashboard.update();
                    if (window.Ledger) Ledger.update();
                } catch (error) {
                    console.error('Error deleting expense category:', error);
                    alert('Failed to delete expense category. Please try again.');
                }
            }
        }
    },

    async deleteMethod(method, skipConfirmation = false) {
        // Check for bulk deletion
        const list = document.getElementById('methods-list');
        const checkedBoxes = list.querySelectorAll('.row-checkbox:checked');
        
        if (checkedBoxes.length > 0) {
            // Bulk delete
            const checkedMethods = Array.from(checkedBoxes).map(cb => {
                return cb.closest('li').querySelector('.method-name').textContent;
            });
            
            // Include current if not already in list
            if (!checkedMethods.includes(method)) {
                checkedMethods.push(method);
            }
            
            const count = checkedMethods.length;
            if (skipConfirmation || confirm(`Are you sure you want to delete ${count} payment method${count === 1 ? '' : 's'}?`)) {
                let successCount = 0;
                let failCount = 0;
                
                for (const meth of checkedMethods) {
                    try {
                        const response = await fetch(`${API.BASE}/methods/${encodeURIComponent(meth)}`, {
                            method: 'DELETE'
                        });
                        if (!response.ok) throw new Error('Failed to delete method');
                        successCount++;
                    } catch (error) {
                        console.error(`Error deleting method "${meth}":`, error);
                        failCount++;
                    }
                }
                
                const data = await API.loadData();
                DataStore.init(data);
                this.updateMethodsList();
                
                if (window.Dashboard) Dashboard.update();
                if (window.Ledger) Ledger.update();
                
                if (failCount > 0) {
                    alert(`Deleted ${successCount} payment method${successCount === 1 ? '' : 's'} successfully. Failed to delete ${failCount}.`);
                }
            }
        } else {
            // Single delete
            if (skipConfirmation || confirm(`Are you sure you want to delete the payment method "${method}"?`)) {
                try {
                    const response = await fetch(`${API.BASE}/methods/${encodeURIComponent(method)}`, {
                        method: 'DELETE'
                    });
                    if (!response.ok) throw new Error('Failed to delete method');
                    
                    const data = await API.loadData();
                    DataStore.init(data);
                    this.updateMethodsList();
                    
                    if (window.Dashboard) Dashboard.update();
                    if (window.Ledger) Ledger.update();
                } catch (error) {
                    console.error('Error deleting method:', error);
                    alert('Failed to delete payment method. Please try again.');
                }
            }
        }
    },

    async showEmojiPicker(iconBtn, categoryName, categoryType, categoryIndex, iconContainer = null) {
        // Remove any existing picker
        const existingPicker = document.querySelector('emoji-picker');
        if (existingPicker) {
            existingPicker.remove();
        }

        // Create emoji picker element
        const picker = document.createElement('emoji-picker');
        picker.style.position = 'fixed';
        picker.style.zIndex = '10000';
        picker.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        picker.style.borderRadius = '8px';
        
        // Add style tag to ensure search input text is visible
        const style = document.createElement('style');
        style.textContent = `
            emoji-picker input,
            emoji-picker input[type="search"],
            emoji-picker input[type="text"] {
                color: #333 !important;
            }
            emoji-picker input::placeholder {
                color: #999 !important;
                opacity: 1 !important;
            }
        `;
        document.head.appendChild(style);
        
        // Position picker near the icon button
        const rect = iconBtn.getBoundingClientRect();
        picker.style.top = `${rect.bottom + 5}px`;
        picker.style.left = `${rect.left}px`;
        
        // Handle emoji selection
        picker.addEventListener('emoji-click', async (event) => {
            const emoji = event.detail.unicode;
            iconBtn.textContent = emoji;
            iconBtn.title = `Icon: ${emoji}`;
            
            // Remove picker after selection
            picker.remove();
            
            // Save icon to backend
            try {
                let endpoint;
                if (categoryType === 'methods') {
                    endpoint = `${API.BASE}/methods/${encodeURIComponent(categoryName)}/icon`;
                } else {
                    // Map 'income' -> 'Income', 'expenses' -> 'Expense'
                    const typeForRoute = categoryType === 'income' ? 'Income' : 'Expense';
                    endpoint = `${API.BASE}/categories/${typeForRoute}/${encodeURIComponent(categoryName)}/icon`;
                }
                
                const response = await fetch(endpoint, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ icon: emoji })
                });
                
                if (!response.ok) {
                    throw new Error('Failed to save icon');
                }
                
                // Reload data to get updated icons
                const data = await API.loadData();
                DataStore.init(data);
                
                // Update all views
                if (categoryType === 'income' || categoryType === 'expenses') {
                    this.updateIncomeList();
                    this.updateExpensesList();
                } else if (categoryType === 'methods') {
                    this.updateMethodsList();
                }
                
                // Update the clear button visibility
                if (iconContainer) {
                    this.updateIconClearButton(iconContainer, iconBtn, emoji, categoryName, categoryType);
                }
                
                if (window.Dashboard) Dashboard.update();
                if (window.Ledger) Ledger.update();
            } catch (error) {
                console.error('Error saving icon:', error);
                alert('Failed to save icon. Please try again.');
            }
        });
        
        // Close picker when clicking outside
        const closePicker = (e) => {
            if (!picker.contains(e.target) && e.target !== iconBtn) {
                picker.remove();
                document.removeEventListener('click', closePicker);
            }
        };
        
        // Add picker to body
        document.body.appendChild(picker);
        
        // Wait for picker to render, then style the search input
        setTimeout(() => {
            // Try to find and style the search input
            const searchInputs = picker.querySelectorAll('input[type="search"], input[type="text"], input');
            searchInputs.forEach(input => {
                input.style.color = '#333';
                input.style.backgroundColor = 'white';
                if (input.placeholder) {
                    input.style.setProperty('--placeholder-color', '#999', 'important');
                }
            });
            
            // Also try shadow DOM if it exists
            if (picker.shadowRoot) {
                const shadowInputs = picker.shadowRoot.querySelectorAll('input[type="search"], input[type="text"], input');
                shadowInputs.forEach(input => {
                    input.style.color = '#333';
                    input.style.backgroundColor = 'white';
                });
            }
        }, 50);
        
        // Add click outside listener after a short delay to avoid immediate close
        setTimeout(() => {
            document.addEventListener('click', closePicker);
        }, 100);
    },

    updateIconClearButton(iconContainer, iconBtn, icon, categoryName, categoryType) {
        // Remove existing clear button
        const existingClear = iconContainer.querySelector('.icon-clear-btn');
        if (existingClear) {
            existingClear.remove();
        }
        
        // Add clear button if icon is set (not the default 🎨)
        if (icon && icon !== '🎨') {
            const clearBtn = document.createElement('button');
            clearBtn.className = 'icon-clear-btn';
            clearBtn.innerHTML = '×';
            clearBtn.title = 'Remove icon';
            clearBtn.onclick = async (e) => {
                e.stopPropagation();
                await this.clearIcon(categoryName, categoryType, iconBtn, iconContainer);
            };
            iconContainer.insertBefore(clearBtn, iconBtn);
        }
    },

    async clearIcon(categoryName, categoryType, iconBtn, iconContainer) {
        try {
            let endpoint;
            if (categoryType === 'methods') {
                endpoint = `${API.BASE}/methods/${encodeURIComponent(categoryName)}/icon`;
            } else {
                // Map 'income' -> 'Income', 'expenses' -> 'Expense'
                const typeForRoute = categoryType === 'income' ? 'Income' : 'Expense';
                endpoint = `${API.BASE}/categories/${typeForRoute}/${encodeURIComponent(categoryName)}/icon`;
            }
            
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ icon: '' })
            });
            
            if (!response.ok) {
                throw new Error('Failed to clear icon');
            }
            
            // Update UI
            iconBtn.textContent = '🎨';
            iconBtn.title = 'Icon';
            
            // Remove clear button
            const clearBtn = iconContainer.querySelector('.icon-clear-btn');
            if (clearBtn) {
                clearBtn.remove();
            }
            
            // Reload data to get updated icons
            const data = await API.loadData();
            DataStore.init(data);
            
            // Update all views
            if (categoryType === 'income' || categoryType === 'expenses') {
                this.updateIncomeList();
                this.updateExpensesList();
            } else if (categoryType === 'methods') {
                this.updateMethodsList();
            }
            
            if (window.Dashboard) Dashboard.update();
            if (window.Ledger) Ledger.update();
        } catch (error) {
            console.error('Error clearing icon:', error);
            alert('Failed to clear icon. Please try again.');
        }
    }
};
