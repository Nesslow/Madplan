// admin.js - v3 with corrected function declarations
document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const API_BASE_URL = 'https://smart-recipe-api.onrender.com';

    // --- ELEMENT REFERENCES ---
    const tableBody = document.getElementById('recipe-table-body');
    const addNewRecipeBtn = document.getElementById('add-new-recipe-btn');

    // --- STATE ---
    let recipesCache = []; // Store recipes to avoid re-fetching for edits

    // =================================================================
    //  FUNCTION DECLARATIONS
    //  By using the 'function' keyword, these are all "hoisted" and
    //  can be called from anywhere in the script without errors.
    // =================================================================

    /**
     * Fetches all recipes from the API and kicks off the table rendering.
     */
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

    /**
     * Clears and re-renders the entire table based on the recipesCache.
     */
    function renderTable() {
        tableBody.innerHTML = '';
        if (recipesCache.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3">Ingen opskrifter fundet. Klik på "Tilføj Ny Opskrift" for at starte.</td></tr>';
            return;
        }
        recipesCache.forEach(recipe => {
            const row = createDisplayRow(recipe);
            tableBody.appendChild(row);
        });
    }

    /**
     * Creates the HTML for a single "display mode" row.
     * @param {object} recipe - The recipe object to display.
     * @returns {HTMLTableRowElement} The created <tr> element.
     */
    function createDisplayRow(recipe) {
        const row = document.createElement('tr');
        row.dataset.id = recipe.id;
        row.innerHTML = `
            <td>${recipe.title}</td>
            <td>${recipe.category || 'N/A'}</td>
            <td class="actions-cell">
                <button class="edit-btn">Rediger</button>
                <button class="delete-btn">Slet</button>
            </td>
        `;
        return row;
    }

    /**
     * Creates and displays the "edit form" for a recipe, either for a new
     * recipe or replacing an existing row to edit it.
     * @param {object | null} recipeToEdit - The recipe object to edit, or null for a new recipe.
     * @param {HTMLTableRowElement | null} existingRow - The <tr> to replace, or null for a new recipe.
     */
    function renderEditRow(recipeToEdit, existingRow) {
        const editRow = document.createElement('tr');
        editRow.className = 'edit-mode-row';
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
                    <button type="button" class="add-ingredient-btn add-btn">+ Ingrediens</button>

                    <h3>Fremgangsmåde</h3>
                    <div class="instructions-container">${instructionsHTML}</div>
                    <button type="button" class="add-instruction-btn add-btn">+ Trin</button>

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
    }

    /**
     * Gathers all data from an edit form row and prepares it for the API.
     * @param {HTMLTableRowElement} editRow - The <tr> element containing the form.
     * @returns {object} The formatted recipe data.
     */
    function collectDataFromEditRow(editRow) {
        const ingredients = Array.from(editRow.querySelectorAll('.ingredient-row')).map(row => ({
            amount: parseFloat(row.querySelector('.ingredient-amount').value) || null,
            unit: row.querySelector('.ingredient-unit').value.trim(),
            name: row.querySelector('.ingredient-name').value.trim()
        })).filter(ing => ing.name);

        const instructions = Array.from(editRow.querySelectorAll('.instruction-step'))
            .map(textarea => textarea.value.trim())
            .filter(step => step);

        return {
            title: editRow.querySelector('.edit-title').value.trim(),
            category: editRow.querySelector('.edit-category').value.trim(),
            // In a real app, you'd add all fields like description, imageUrl etc. here
            ingredients,
            instructions
        };
    }


    // =================================================================
    //  EVENT LISTENERS
    // =================================================================

    // Listener for the main "Add New Recipe" button
    addNewRecipeBtn.addEventListener('click', () => {
        // Call renderEditRow with no data to create a blank form
        renderEditRow(null, null);
    });

    // A single listener on the table body to handle all actions inside it (delegation)
    tableBody.addEventListener('click', async (event) => {
        const target = event.target;
        const editRow = target.closest('.edit-mode-row');
        const displayRow = target.closest('tr:not(.edit-mode-row)');

        // --- Handle clicks inside an EDIT FORM ---
        if (editRow) {
            if (target.classList.contains('save-btn')) {
                const data = collectDataFromEditRow(editRow);
                const id = editRow.dataset.id;
                const isUpdating = !!id;
                const url = isUpdating ? `${API_BASE_URL}/recipes/${id}` : `${API_BASE_URL}/recipes`;
                const method = isUpdating ? 'PUT' : 'POST';

                try {
                    const response = await fetch(url, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    if (!response.ok) throw new Error('Lagring fejlede.');
                    loadRecipes(); // Reload all data to ensure UI is in sync
                } catch (error) {
                    alert(`Fejl: ${error.message}`);
                }
            }
            if (target.classList.contains('cancel-btn')) {
                const id = editRow.dataset.id;
                const originalRecipe = recipesCache.find(r => r.id === id);
                if (originalRecipe) {
                    tableBody.replaceChild(createDisplayRow(originalRecipe), editRow);
                } else {
                    editRow.remove();
                }
            }
            if (target.classList.contains('add-ingredient-btn')) {
                const container = editRow.querySelector('.ingredients-container');
                const newField = document.createElement('div');
                newField.className = 'ingredient-row';
                newField.innerHTML = `
                    <input class="ingredient-amount" type="number" placeholder="Mængde">
                    <input class="ingredient-unit" type="text" placeholder="Enhed">
                    <input class="ingredient-name" type="text" placeholder="Ingrediens" required>
                    <button type="button" class="remove-btn">－</button>
                `;
                container.appendChild(newField);
            }
            if (target.classList.contains('add-instruction-btn')) {
                const container = editRow.querySelector('.instructions-container');
                const newField = document.createElement('div');
                newField.className = 'instruction-row';
                newField.innerHTML = `
                    <textarea class="instruction-step" rows="2" required></textarea>
                    <button type="button" class="remove-btn">－</button>
                `;
                container.appendChild(newField);
            }
            if (target.classList.contains('remove-btn')) {
                target.closest('.ingredient-row, .instruction-row').remove();
            }
        }
        
        // --- Handle clicks on a DISPLAY ROW ---
        if (displayRow) {
            if (target.classList.contains('edit-btn')) {
                const id = displayRow.dataset.id;
                const recipeToEdit = recipesCache.find(r => r.id === id);
                renderEditRow(recipeToEdit, displayRow);
            }
            if (target.classList.contains('delete-btn')) {
                const id = displayRow.dataset.id;
                const title = displayRow.cells[0].textContent;
                if (window.confirm(`Er du sikker på, at du vil slette "${title}"?`)) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/recipes/${id}`, { method: 'DELETE' });
                        if (!response.ok) throw new Error('Sletning fejlede.');
                        displayRow.remove();
                        recipesCache = recipesCache.filter(r => r.id !== id);
                    } catch (error) {
                        alert(`Fejl: ${error.message}`);
                    }
                }
            }
        }
    });

    // --- INITIAL LOAD ---
    loadRecipes();
});