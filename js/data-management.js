// Data Management (Categories & Methods) - Available globally as DataManagement

const DataManagement = {
    setup() {
        // Categories
        document.getElementById('add-category-btn').addEventListener('click', async () => {
            const input = document.getElementById('new-category');
            const value = input.value.trim();
            if (value && !DataStore.categories.includes(value)) {
                try {
                    const response = await fetch(`${API.BASE}/categories`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: value })
                    });
                    if (!response.ok) throw new Error('Failed to add category');
                    
                    const data = await API.loadData();
                    DataStore.init(data);
                    input.value = '';
                    this.updateCategoriesList();
                } catch (error) {
                    console.error('Error adding category:', error);
                    alert('Failed to add category. It may already exist.');
                }
            }
        });

        // Methods
        document.getElementById('add-method-btn').addEventListener('click', async () => {
            const input = document.getElementById('new-method');
            const value = input.value.trim();
            if (value && !DataStore.methods.includes(value)) {
                try {
                    const response = await fetch(`${API.BASE}/methods`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: value })
                    });
                    if (!response.ok) throw new Error('Failed to add method');
                    
                    const data = await API.loadData();
                    DataStore.init(data);
                    input.value = '';
                    this.updateMethodsList();
                } catch (error) {
                    console.error('Error adding method:', error);
                    alert('Failed to add payment method. It may already exist.');
                }
            }
        });

        this.updateCategoriesList();
        this.updateMethodsList();
    },

    updateCategoriesList() {
        const list = document.getElementById('categories-list');
        list.innerHTML = '';

        DataStore.categories.forEach((cat, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="category-name">${cat}</span>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="DataManagement.editCategory(${index})" title="Edit">✏️</button>
                    <button class="delete-btn" onclick="DataManagement.deleteCategory('${cat}')" title="Delete">🗑️</button>
                </div>
            `;
            list.appendChild(li);
        });
    },

    updateMethodsList() {
        const list = document.getElementById('methods-list');
        list.innerHTML = '';

        DataStore.methods.forEach((method, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="method-name">${method}</span>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="DataManagement.editMethod(${index})" title="Edit">✏️</button>
                    <button class="delete-btn" onclick="DataManagement.deleteMethod('${method}')" title="Delete">🗑️</button>
                </div>
            `;
            list.appendChild(li);
        });
    },

    async editCategory(index) {
        const data = await API.loadData();
        DataStore.init(data);
        const oldValue = DataStore.categories[index];
        const newValue = prompt('Edit category:', oldValue);
        
        if (newValue && newValue.trim() && newValue.trim() !== oldValue) {
            const trimmedValue = newValue.trim();
            try {
                const response = await fetch(`${API.BASE}/categories/${index}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: trimmedValue })
                });
                if (!response.ok) {
                    const error = await response.json();
                    alert(error.error || 'Failed to update category');
                    return;
                }
                
                const refreshedData = await API.loadData();
                DataStore.init(refreshedData);
                this.updateCategoriesList();
                Dashboard.update();
                Ledger.update();
            } catch (error) {
                console.error('Error updating category:', error);
                alert('Failed to update category. Please try again.');
            }
        }
    },

    async editMethod(index) {
        const data = await API.loadData();
        DataStore.init(data);
        const oldValue = DataStore.methods[index];
        const newValue = prompt('Edit payment method:', oldValue);
        
        if (newValue && newValue.trim() && newValue.trim() !== oldValue) {
            const trimmedValue = newValue.trim();
            try {
                const response = await fetch(`${API.BASE}/methods/${index}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: trimmedValue })
                });
                if (!response.ok) {
                    const error = await response.json();
                    alert(error.error || 'Failed to update payment method');
                    return;
                }
                
                const refreshedData = await API.loadData();
                DataStore.init(refreshedData);
                this.updateMethodsList();
                Dashboard.update();
                Ledger.update();
            } catch (error) {
                console.error('Error updating method:', error);
                alert('Failed to update payment method. Please try again.');
            }
        }
    },

    async deleteCategory(category) {
        if (confirm(`Are you sure you want to delete the category "${category}"?`)) {
            try {
                const response = await fetch(`${API.BASE}/categories/${encodeURIComponent(category)}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error('Failed to delete category');
                
                const data = await API.loadData();
                DataStore.init(data);
                this.updateCategoriesList();
            } catch (error) {
                console.error('Error deleting category:', error);
                alert('Failed to delete category. Please try again.');
            }
        }
    },

    async deleteMethod(method) {
        if (confirm(`Are you sure you want to delete the payment method "${method}"?`)) {
            try {
                const response = await fetch(`${API.BASE}/methods/${encodeURIComponent(method)}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error('Failed to delete method');
                
                const data = await API.loadData();
                DataStore.init(data);
                this.updateMethodsList();
            } catch (error) {
                console.error('Error deleting method:', error);
                alert('Failed to delete payment method. Please try again.');
            }
        }
    }
};
