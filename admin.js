// admin.js - v4 with Modal-based CRUD
document.addEventListener('DOMContentLoaded', async () => {
    // --- CONFIGURATION & STATE ---
    const API_BASE_URL = 'https://smart-recipe-api.onrender.com';
    let recipesCache = [];
    let masterIngredientList = [];

    // --- ELEMENT REFERENCES ---
    const tableBody = document.getElementById('recipe-table-body');
    const addNewRecipeBtn = document.getElementById('add-new-recipe-btn');
    const modal = document.getElementById('recipe-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // =================================================================
    //  CORE FUNCTIONS
    // =================================================================

    /**
     * Fetches all data on page load
     */
    async function initializeAdminPage() {
        await loadIngredientMasterList();
        await loadRecipes();
    }

    /**
     * Fetches the master ingredient list from the local JSON file.
     */
    async function loadIngredientMasterList() {
        try {
            const response = await fetch('./ingredients.json');
            const ingredientsData = await response.json();
            masterIngredientList = ingredientsData.map(ing => ({ value: ing.FødevareNavn, text: ing.FødevareNavn }));
        } catch (error) {
            console.error("Could not load ingredients.json:", error);
        }
    }

    /**
     * Fetches all recipes from the API and renders the table.
     */
    async function loadRecipes() {
        tableBody.innerHTML = '<tr><td colspan="3">Henter opskrifter...</td></tr>';
        try {
            const response = await fetch(`${API_BASE_URL}/recipes`);
            if (!response.ok) throw new Error('Could not fetch recipes.');
            recipesCache = await response.json();
            recipesCache.sort((a, b) => a.title.localeCompare(b.title));
            renderTable();
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="3" style="color: red;">Fejl: ${error.message}</td></tr>`;
        }
    }

    /**
     * Renders the entire table from the cached recipe data.
     */
    function renderTable() {
        tableBody.innerHTML = '';
        if (recipesCache.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3">Ingen opskrifter fundet.</td></tr>';
            return;
        }
        recipesCache.forEach(recipe => {
            const row = document.createElement('tr');
            row.dataset.id = recipe.id;
            row.innerHTML = `
                <td><span class="math-inline">\{recipe\.title\}</td\>
                <td>{recipe.category || 'N/A'}</td>
                <td class="actions-cell">
                    <button class="btn btn-secondary edit-btn">Edit</button>
                    <button class="btn btn-danger delete-btn">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // =================================================================
    //  MODAL AND FORM HANDLING
    // =================================================================
    
    /**
     * Opens the modal.
     */
    function openModal() {
        modal.classList.remove('hidden');
    }

    /**
     * Closes the modal and clears its content.
     */
    function closeModal() {
        modal.classList.add('hidden');
        modalBody.innerHTML = '';
    }

    /**
     * Populates and opens the modal for adding or editing a recipe.
     * @param {object | null} recipe - The recipe to edit, or null to add a new one.
     */
    function showRecipeFormModal(recipe = null) {
        const isEditing = recipe !== null;
        modalTitle.textContent = isEditing ? 'Rediger Opskrift' : 'Tilføj Ny Opskrift';
        
        // Build the form's HTML dynamically
        const ingredientsHTML = (recipe?.ingredients || [{ name: '', amount: '', unit: '' }])
            .map(createIngredientInputHTML).join('');
        const instructionsHTML = (recipe?.instructions || [''])
            .map(createInstructionInputHTML).join('');

        modalBody.innerHTML = `
            <form id="modal-form">
                <input type="hidden" id="recipeId" value="${recipe?.id || ''}">
                <div class="form-row">
                    <div><label>Titel</label><input type="text" id="title" value="${recipe?.title || ''}" required></div>
                    <div><label>Kategori</label><input type="text" id="category" value="${recipe?.category || ''}"></div>
                </div>
                <div><label>Billede URL</label><input type="url" id="imageUrl" value="${recipe?.imageUrl || ''}"></div>
                <div><label>Beskrivelse</label><textarea id="description" rows="3">${recipe?.description || ''}</textarea></div>
                <h3>Ingredienser</h3>
                <div id="ingredients-container">${ingredientsHTML}</div>
                <button type="button" id="add-ingredient-btn" class="btn btn-light">＋ Ingrediens</button>
                <h3>Fremgangsmåde</h3>
                <div id="instructions-container">${instructionsHTML}</div>
                <button type="button" id="add-instruction-btn" class="btn btn-light">＋ Trin</button>
                <div class="modal-actions">
                    <button type="button" id="modal-cancel-btn" class="btn btn-secondary">Annuller</button>
                    <button type="submit" class="btn btn-primary">Save Recipe</button>
                </div>
            </form>
        `;
        
        // Initialize Tom Select on all ingredient fields inside the modal
        modalBody.querySelectorAll('.ingredient-name-select').forEach(initializeTomSelect);

        openModal();
    }
    
    /**
     * Helper to generate HTML for one ingredient row.
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

    /**
     * Helper to generate HTML for one instruction row.
     */
    function createInstructionInputHTML(step = '') {
        return `<div class="instruction-row"><textarea class="instruction-step" rows="2" required>${step}</textarea><button type="button" class="remove-btn">－</button></div>`;
    }

    /**
     * Initializes a Tom Select instance on an element.
     */
    function initializeTomSelect(element) {
        new TomSelect(element, { options: masterIngredientList, create: true, maxItems: 1 });
    }
    
    /**
     * Handles the form submission for both creating and updating.
     */
    async function handleFormSubmit() {
        const form = modalBody.querySelector('#modal-form');
        const recipeId = form.querySelector('#recipeId').value;
        const isUpdating = !!recipeId;

        const ingredients = Array.from(form.querySelectorAll('.ingredient-row')).map(row => ({
            amount: parseFloat(row.querySelector('.ingredient-amount').value) || null,
            unit: row.querySelector('.ingredient-unit').value.trim(),
            name: row.querySelector('.ingredient-name-select').value.trim()
        })).filter(ing => ing.name);

        const instructions = Array.from(form.querySelectorAll('.instruction-step')).map(textarea => textarea.value.trim()).filter(step => step);

        const recipeData = {
            title: form.querySelector('#title').value.trim(),
            category: form.querySelector('#category').value.trim(),
            imageUrl: form.querySelector('#imageUrl').value.trim(),
            description: form.querySelector('#description').value.trim(),
            ingredients,
            instructions
        };

        if (!recipeData.title) return alert('Titel er påkrævet.');

        const url = isUpdating ? `${API_BASE_URL}/recipes/${recipeId}` : `${API_BASE_URL}/recipes`;
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(recipeData) });
            if (!response.ok) throw new Error('Lagring fejlede.');
            closeModal();
            await loadRecipes(); // Reload all data to show changes
        } catch (error) {
            alert(`Fejl: ${error.message}`);
        }
    }


    // =================================================================
    //  EVENT LISTENERS
    // =================================================================

    // Listener for "+ Add New Recipe" button
    addNewRecipeBtn.addEventListener('click', () => showRecipeFormModal());

    // Listener for main table (for Edit/Delete buttons)
    tableBody.addEventListener('click', (event) => {
        const target = event.target;
        const row = target.closest('tr');
        if (!row) return;

        const recipeId = row.dataset.id;
        
        if (target.classList.contains('edit-btn')) {
            const recipeToEdit = recipesCache.find(r => r.id === recipeId);
            showRecipeFormModal(recipeToEdit);
        }

        if (target.classList.contains('delete-btn')) {
            const recipeTitle = row.cells[0].textContent;
            if (window.confirm(`Er du sikker på, at du vil slette "${recipeTitle}"?`)) {
                fetch(`${API_BASE_URL}/recipes/${recipeId}`, { method: 'DELETE' })
                    .then(response => {
                        if (!response.ok) throw new Error('Sletning fejlede.');
                        row.remove(); // Optimistic UI update
                        recipesCache = recipesCache.filter(r => r.id !== recipeId);
                    })
                    .catch(error => alert(`Fejl: ${error.message}`));
            }
        }
    });

    // Listener for all clicks within the modal
    modal.addEventListener('click', (event) => {
        const target = event.target;
        if (target === modal || target === modalCloseBtn || target.id === 'modal-cancel-btn') {
            closeModal();
        }
        if (target.id === 'add-ingredient-btn') {
            const container = modalBody.querySelector('#ingredients-container');
            container.insertAdjacentHTML('beforeend', createIngredientInputHTML());
            initializeTomSelect(container.lastElementChild.querySelector('.ingredient-name-select'));
        }
        if (target.id === 'add-instruction-btn') {
            modalBody.querySelector('#instructions-container').insertAdjacentHTML('beforeend', createInstructionInputHTML());
        }
        if (target.classList.contains('remove-btn')) {
            target.closest('.ingredient-row, .instruction-row').remove();
        }
    });

    // Listener for form submission inside the modal
    modal.addEventListener('submit', (event) => {
        if (event.target.id === 'modal-form') {
            event.preventDefault();
            handleFormSubmit();
        }
    });

    // --- INITIALIZE APP ---
    initializeAdminPage();
});