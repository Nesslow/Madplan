// admin.js - v2 with full CRUD functionality
document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const API_BASE_URL = 'https://danish-recipe-api.onrender.com';

    // --- ELEMENT REFERENCES ---
    const tableBody = document.getElementById('recipe-table-body');
    const addNewRecipeBtn = document.getElementById('add-new-recipe-btn');

    // --- STATE ---
    let recipesCache = []; // Store the fetched recipes to avoid re-fetching

    // --- MAIN RENDER FUNCTIONS ---

    // Renders the entire table from the cached data
    const renderTable = () => {
        tableBody.innerHTML = ''; // Clear the table
        if (recipesCache.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3">Ingen opskrifter fundet.</td></tr>';
            return;
        }
        recipesCache.forEach(recipe => {
            const row = createDisplayRow(recipe);
            tableBody.appendChild(row);
        });
    };

    // Creates a single "display mode" row (a normal table row)
    const createDisplayRow = (recipe) => {
        const row = document.createElement('tr');
        row.dataset.id = recipe.id; // Set the row's ID
        row.innerHTML = `
            <td>${recipe.title}</td>
            <td>${recipe.category || 'N/A'}</td>
            <td class="actions-cell">
                <button class="edit-btn">Rediger</button>
                <button class="delete-btn">Slet</button>
            </td>
        `;
        return row;
    };
    
    // Creates and swaps in the big "edit mode" row
    const renderEditRow = (recipeToEdit, existingRow) => {
        const editRow = document.createElement('tr');
        editRow.className = 'edit-mode-row';
        // If we are editing, store the original ID. If it's a new recipe, ID is null.
        if (recipeToEdit) {
            editRow.dataset.id = recipeToEdit.id;
        }

        const ingredientsHTML = (recipeToEdit?.ingredients || [{ name: '', amount: '', unit: '' }])
            .map(ing => `
                <div class="ingredient-row">
                    <input class="ingredient-amount" type="number" placeholder="Mængde" value="${ing.amount || ''}">
                    <input class="ingredient-unit" type="text" placeholder="Enhed" value="${ing.unit || ''}">
                    <input class="ingredient-name" type="text" placeholder="Ingrediens" value="${ing.name || ''}" required>
                    <button type="button" class="remove-btn">－</button>
                </div>
            `).join('');

        const instructionsHTML = (recipeToEdit?.instructions || [''])
            .map(step => `
                <div class="instruction-row">
                    <textarea class="instruction-step" rows="2" required>${step || ''}</textarea>
                    <button type="button" class="remove-btn">－</button>
                </div>
            `).join('');

        editRow.innerHTML = `
            <td colspan="3">
                <div class="edit-form-container">
                    <label>Titel</label>
                    <input type="text" class="edit-title" value="${recipeToEdit?.title || ''}" required>
                    
                    <label>Kategori</label>
                    <input type="text" class="edit-category" value="${recipeToEdit?.category || ''}">
                    
                    <h3>Ingredienser</h3>
                    <div class="ingredients-container">${ingredientsHTML}</div>
                    <button type="button" class="add-ingredient-btn">+ Ingrediens</button>

                    <h3>Fremgangsmåde</h3>
                    <div class="instructions-container">${instructionsHTML}</div>
                    <button type="button" class="add-instruction-btn">+ Trin</button>

                    <div class="edit-form-actions">
                        <button class="save-btn">Gem</button>
                        <button class="cancel-btn">Annuller</button>
                    </div>
                </div>
            </td>
        `;

        if (existingRow) {
            tableBody.replaceChild(editRow, existingRow);
        } else {
            tableBody.prepend(editRow); // Add new recipe form to the top
        }
    };
    

    // --- API CALLS & DATA HANDLING ---

    // Fetches all recipes and stores them in the cache
    async function loadRecipes() {
        tableBody.innerHTML = '<tr><td colspan="3">Henter opskrifter...</td></tr>';
        try {
            const response = await fetch(`${API_BASE_URL}/recipes`);
            if (!response.ok) throw new Error('Could not fetch recipes.');
            recipesCache = await response.json();
            renderTable(); // Render the table with the fetched data
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="3" style="color: red;">Fejl: ${error.message}</td></tr>`;
        }
    }

    // Gathers all data from an edit form row and prepares it for the API
    const collectDataFromEditRow = (editRow) => {
        const ingredients = Array.from(editRow.querySelectorAll('.ingredient-row')).map(row => ({
            amount: parseFloat(row.querySelector('.ingredient-amount').value) || null,
            unit: row.querySelector('.ingredient-unit').value.trim(),
            name: row.querySelector('.ingredient-name').value.trim()
        })).filter(ing => ing.name); // Only include ingredients with a name

        const instructions = Array.from(editRow.querySelectorAll('.instruction-step'))
            .map(textarea => textarea.value.trim())
            .filter(step => step); // Only include non-empty steps

        return {
            title: editRow.querySelector('.edit-title').value.trim(),
            category: editRow.querySelector('.edit-category').value.trim(),
            // You can add more fields like description, imageUrl etc. here if needed
            ingredients,
            instructions
        };
    };

    // --- EVENT LISTENERS using Delegation ---

    // Single listener on the whole table body for all actions
    tableBody.addEventListener('click', async (event) => {
        const target = event.target;
        const row = target.closest('tr');
        const id = row.dataset.id;

        // --- DELETE ---
        if (target.classList.contains('delete-btn')) {
            const title = row.cells[0].textContent;
            if (window.confirm(`Er du sikker på, at du vil slette "${title}"?`)) {
                try {
                    const response = await fetch(`${API_BASE_URL}/recipes/${id}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Sletning fejlede.');
                    row.remove(); // Remove from UI instantly
                    recipesCache = recipesCache.filter(r => r.id !== id); // Remove from cache
                } catch (error) {
                    alert(`Fejl: ${error.message}`);
                }
            }
        }
        
        // --- EDIT ---
        if (target.classList.contains('edit-btn')) {
            const recipeToEdit = recipesCache.find(r => r.id === id);
            renderEditRow(recipeToEdit, row);
        }

        // --- CANCEL ---
        if (target.classList.contains('cancel-btn')) {
            // If it was an existing recipe, render the original. If it was a new one, just remove the form.
            const originalRecipe = recipesCache.find(r => r.id === id);
            if (originalRecipe) {
                tableBody.replaceChild(createDisplayRow(originalRecipe), row);
            } else {
                row.remove();
            }
        }
        
        // --- SAVE (for both UPDATE and CREATE) ---
        if (target.classList.contains('save-btn')) {
            const data = collectDataFromEditRow(row);
            const isUpdating = !!id; // If there's an ID, we are updating.
            const url = isUpdating ? `${API_BASE_URL}/recipes/${id}` : `${API_BASE_URL}/recipes`;
            const method = isUpdating ? 'PUT' : 'POST';

            try {
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (!response.ok) throw new Error('Lagring fejlede.');
                
                // Reload all recipes from the server to get the fresh data
                // This is the simplest way to ensure the UI is in sync.
                loadRecipes();

            } catch (error) {
                alert(`Fejl: ${error.message}`);
            }
        }

        // --- DYNAMICALLY ADD INGREDIENT/INSTRUCTION ---
        if (target.classList.contains('add-ingredient-btn')) {
            const container = row.querySelector('.ingredients-container');
            const newField = document.createElement('div');
            newField.className = 'ingredient-row';
            newField.innerHTML = `
                <input class="ingredient-amount" type="number" placeholder="Mængde">
                <input class="ingredient-unit" type="text" placeholder="Enhed">
                <input class="ingredient-name" type="text" placeholder="Ingrediens" required>
                <button type="button" class="remove-btn">－</button>
            `;
            newField.querySelector('.remove-btn').addEventListener('click', () => newField.remove());
            container.appendChild(newField);
        }
        
        if (target.classList.contains('add-instruction-btn')) {
            const container = row.querySelector('.instructions-container');
            const newField = document.createElement('div');
            newField.className = 'instruction-row';
            newField.innerHTML = `
                <textarea class="instruction-step" rows="2" required></textarea>
                <button type="button" class="remove-btn">－</button>
            `;
            newField.querySelector('.remove-btn').addEventListener('click', () => newField.remove());
            container.appendChild(newField);
        }

        // Remove ingredient/instruction row
        if (target.classList.contains('remove-btn')) {
            target.closest('.ingredient-row, .instruction-row').remove();
        }
    });

    addNewRecipeBtn.addEventListener('click', () => {
        // Call renderEditRow with no data to create a blank form for a new recipe
        renderEditRow(null, null);
    });

    // --- INITIAL LOAD ---
    loadRecipes();
});