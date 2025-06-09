// admin.js - v4 with full inline editing form
document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const API_BASE_URL = 'https://smart-recipe-api.onrender.com';

    // --- ELEMENT REFERENCES ---
    const tableBody = document.getElementById('recipe-table-body');
    const addNewRecipeBtn = document.getElementById('add-new-recipe-btn');

    // --- STATE ---
    let recipesCache = [];
    let masterIngredientList = []; // To hold ingredients for Tom Select

    // =================================================================
    //  FUNCTION DECLARATIONS
    // =================================================================

    /**
     * Fetches the master ingredient list from the local JSON file.
     */
    async function loadIngredientMasterList() {
        try {
            const response = await fetch('./ingredients.json');
            const ingredientsData = await response.json();
            masterIngredientList = ingredientsData.map(ingredient => ({
                value: ingredient.FødevareNavn,
                text: ingredient.FødevareNavn
            }));
            console.log(`Loaded ${masterIngredientList.length} master ingredients.`);
        } catch (error) {
            console.error("Could not load local ingredients.json file:", error);
        }
    }

    /**
     * Fetches all recipes from the API and kicks off the table rendering.
     */
    async function loadRecipes() {
        tableBody.innerHTML = '<tr><td colspan="3">Henter opskrifter...</td></tr>';
        try {
            const response = await fetch(`${API_BASE_URL}/recipes`);
            if (!response.ok) throw new Error('Could not fetch recipes.');
            recipesCache = await response.json();
            recipesCache.sort((a, b) => a.title.localeCompare(b.title)); // Sort alphabetically
            renderTable();
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="3" style="color: red;">Fejl: ${error.message}</td></tr>`;
        }
    }

    /**
     * Renders the entire table from the cached data.
     */
    function renderTable() {
        tableBody.innerHTML = '';
        if (recipesCache.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3">Ingen opskrifter fundet.</td></tr>';
            return;
        }
        recipesCache.forEach(recipe => {
            const row = createDisplayRow(recipe);
            tableBody.appendChild(row);
        });
    }

    /**
     * Creates the HTML for a single "display mode" row.
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
     * Creates and displays the full "edit form" for a recipe.
     */
    function renderEditRow(recipeToEdit, existingRow) {
        const editRow = document.createElement('tr');
        editRow.className = 'edit-mode-row';
        if (recipeToEdit) {
            editRow.dataset.id = recipeToEdit.id;
        }

        // Helper to create the ingredients section HTML
        const ingredientsHTML = (recipeToEdit?.ingredients || [{ name: '', amount: '', unit: '' }])
            .map(ing => createIngredientInputHTML(ing)).join('');
        
        // Helper to create the instructions section HTML
        const instructionsHTML = (recipeToEdit?.instructions || [''])
            .map(step => createInstructionInputHTML(step)).join('');

        editRow.innerHTML = `
            <td colspan="3">
                <div class="edit-form-container">
                    <div class="form-row">
                        <div>
                            <label>Titel</label>
                            <input type="text" class="edit-title" value="${recipeToEdit?.title || ''}" required>
                        </div>
                        <div>
                            <label>Kategori</label>
                            <input type="text" class="edit-category" value="${recipeToEdit?.category || ''}">
                        </div>
                    </div>
                    <div>
                        <label>Billede URL</label>
                        <input type="url" class="edit-imageUrl" value="${recipeToEdit?.imageUrl || ''}">
                    </div>
                    <div>
                        <label>Beskrivelse</label>
                        <textarea class="edit-description" rows="3">${recipeToEdit?.description || ''}</textarea>
                    </div>

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
            tableBody.prepend(editRow);
        }

        // After the HTML is in the DOM, initialize Tom Select for all ingredient inputs
        editRow.querySelectorAll('.ingredient-name-select').forEach(selectInput => {
            initializeTomSelect(selectInput);
        });
    }

    /**
     * Helper functions to generate HTML for dynamic rows.
     */
    function createIngredientInputHTML(ingredient = {}) {
        const units = ['g', 'kg', 'dl', 'l', 'tsk', 'spsk', 'stk', 'knsp', 'fed', 'bundt'];
        const unitOptions = units.map(u => `<option value="${u}" ${u === ingredient.unit ? 'selected' : ''}>${u}</option>`).join('');
        return `
            <div class="ingredient-row">
                <input class="ingredient-amount" type="number" placeholder="Mængde" value="${ingredient.amount || ''}">
                <select class="ingredient-unit"><option value="">Enhed</option>${unitOptions}</select>
                <input class="ingredient-name-select" type="text" placeholder="Søg ingrediens..." value="${ingredient.name || ''}" required>
                <button type="button" class="remove-btn">－</button>
            </div>
        `;
    }

    function createInstructionInputHTML(step = '') {
        return `
            <div class="instruction-row">
                <textarea class="instruction-step" rows="2" required>${step}</textarea>
                <button type="button" class="remove-btn">－</button>
            </div>
        `;
    }

    /**
     * Initializes a Tom Select instance on a given input element.
     */
    function initializeTomSelect(element) {
        new TomSelect(element, {
            options: masterIngredientList,
            create: true,
            maxItems: 1,
            sortField: { field: "text", direction: "asc" }
        });
    }

    /**
     * Gathers all data from an edit form row.
     */
    function collectDataFromEditRow(editRow) {
        const ingredients = Array.from(editRow.querySelectorAll('.ingredient-row')).map(row => ({
            amount: parseFloat(row.querySelector('.ingredient-amount').value) || null,
            unit: row.querySelector('.ingredient-unit').value.trim(),
            name: row.querySelector('.ingredient-name-select').value.trim()
        })).filter(ing => ing.name);

        const instructions = Array.from(editRow.querySelectorAll('.instruction-step'))
            .map(textarea => textarea.value.trim())
            .filter(step => step);

        return {
            title: editRow.querySelector('.edit-title').value.trim(),
            category: editRow.querySelector('.edit-category').value.trim(),
            imageUrl: editRow.querySelector('.edit-imageUrl').value.trim(),
            description: editRow.querySelector('.edit-description').value.trim(),
            ingredients,
            instructions
        };
    }

    // =================================================================
    //  EVENT LISTENERS
    // =================================================================

    addNewRecipeBtn.addEventListener('click', () => {
        renderEditRow(null, null);
    });

    tableBody.addEventListener('click', async (event) => {
        const target = event.target;
        const displayRow = target.closest('tr:not(.edit-mode-row)');
        const editRow = target.closest('.edit-mode-row');

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

        // --- Handle clicks inside an EDIT FORM ---
        if (editRow) {
            if (target.classList.contains('save-btn')) {
                const data = collectDataFromEditRow(editRow);
                if (!data.title) return alert('Titel er påkrævet.');
                
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
                    await loadRecipes(); // Reload all data to ensure UI is in sync
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
                const newFieldHTML = createIngredientInputHTML();
                container.insertAdjacentHTML('beforeend', newFieldHTML);
                const newSelect = container.lastElementChild.querySelector('.ingredient-name-select');
                initializeTomSelect(newSelect);
            }
            if (target.classList.contains('add-instruction-btn')) {
                const container = editRow.querySelector('.instructions-container');
                const newFieldHTML = createInstructionInputHTML();
                container.insertAdjacentHTML('beforeend', newFieldHTML);
            }
            if (target.classList.contains('remove-btn')) {
                target.closest('.ingredient-row, .instruction-row').remove();
            }
        }
    });

    // --- INITIALIZE APP ---
    async function init() {
        await loadIngredientMasterList();
        await loadRecipes();
    }

    init();
});