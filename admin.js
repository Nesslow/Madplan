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
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.color = 'red';
            errorDiv.textContent = 'Kunne ikke indlæse ingredienslisten. Prøv at genindlæse siden.';
            document.body.prepend(errorDiv);
        }
    }

    /**
     * Fetches all recipes from the API and renders the table.
     */
    async function loadRecipes() {
        tableBody.innerHTML = '<tr><td colspan="3"><span id="loading-spinner">Henter opskrifter...</span></td></tr>';
        try {
            const response = await fetch(`${API_BASE_URL}/recipes`);
            if (!response.ok) {
                let errorMessage = `Kunne ikke hente opskrifter. Status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Response was not JSON or error parsing it, use default status error
                }
                throw new Error(errorMessage);
            }
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
                <td>${recipe.title}</td>
                <td>${recipe.category || 'N/A'}</td>
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
    
    function trapModalFocus(modalEl) {
        const focusableEls = modalEl.querySelectorAll('a[href], button:not([disabled]), textarea, input, select');
        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];
        modalEl.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstEl) {
                        e.preventDefault();
                        lastEl.focus();
                    }
                } else {
                    if (document.activeElement === lastEl) {
                        e.preventDefault();
                        firstEl.focus();
                    }
                }
            }
            if (e.key === 'Escape') {
                closeModal();
            }
        });
    }

    function openModal() {
        modal.classList.remove('hidden');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('tabindex', '-1');
        setTimeout(() => {
            const firstInput = modal.querySelector('input, textarea, select, button');
            if (firstInput) firstInput.focus();
        }, 50);
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.add('hidden');
        modalBody.innerHTML = '';
        modal.removeAttribute('aria-modal');
        modal.removeAttribute('role');
        modal.removeAttribute('tabindex');
        document.body.style.overflow = '';
        addNewRecipeBtn.focus();
    }

    /**
     * Populates and opens the modal for adding or editing a recipe.
     * @param {object | null} recipe - The recipe to edit, or null to add a new one.
     */
    function showRecipeFormModal(recipe = null) {
        const isEditing = recipe !== null;
        modalTitle.textContent = isEditing ? 'Rediger Opskrift' : 'Tilføj Ny Opskrift';
        
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
                    <button type="submit" class="btn btn-primary" id="modal-save-btn">Save Recipe</button>
                </div>
            </form>
        `;

        trapModalFocus(modal);
        
        modalBody.querySelectorAll('.ingredient-name-select').forEach(initializeTomSelect);

        openModal();
    }
    
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
        return `<div class="instruction-row"><textarea class="instruction-step" rows="2" required>${step}</textarea><button type="button" class="remove-btn">－</button></div>`;
    }

    function initializeTomSelect(element) {
        new TomSelect(element, { options: masterIngredientList, create: true, maxItems: 1 });
    }
    
    async function handleFormSubmit() {
        const form = modalBody.querySelector('#modal-form');
        const recipeId = form.querySelector('#recipeId').value;
        const isUpdating = !!recipeId;
        const saveButton = form.querySelector('#modal-save-btn');

        const ingredients = Array.from(form.querySelectorAll('.ingredient-row')).map(row => ({
            amount: parseFloat(row.querySelector('.ingredient-amount').value) || null,
            unit: row.querySelector('.ingredient-unit').value.trim(),
            name: row.querySelector('.ingredient-name-select').value.trim()
        })).filter(ing => ing.name && ing.amount && ing.unit);
        if (ingredients.length === 0) {
            alert('Mindst én ingrediens med navn, mængde og enhed er påkrævet.');
            return;
        }

        const instructions = Array.from(form.querySelectorAll('.instruction-step')).map(textarea => textarea.value.trim()).filter(step => step);
        if (instructions.length === 0) {
            alert('Mindst ét trin i fremgangsmåden er påkrævet.');
            return;
        }

        const recipeData = {
            title: form.querySelector('#title').value.trim(),
            category: form.querySelector('#category').value.trim(),
            imageUrl: form.querySelector('#imageUrl').value.trim(),
            description: form.querySelector('#description').value.trim(),
            ingredients,
            instructions
        };

        if (!recipeData.title) {
             alert('Titel er påkrævet.');
             return;
        }

        const originalButtonText = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.textContent = 'Gemmer...';

        const url = isUpdating ? `${API_BASE_URL}/recipes/${recipeId}` : `${API_BASE_URL}/recipes`;
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(recipeData) });
            if (!response.ok) {
                let errorMessage = `Lagring fejlede. Status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Response was not JSON or error parsing it, use default status error
                }
                throw new Error(errorMessage);
            }
            closeModal();
            await loadRecipes();
        } catch (error) {
            alert(`Fejl: ${error.message}`);
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = originalButtonText;
        }
    }


    // =================================================================
    //  EVENT LISTENERS
    // =================================================================

    addNewRecipeBtn.addEventListener('click', () => showRecipeFormModal());

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
                    .then(async response => { // Made this callback async
                        if (!response.ok) {
                            let errorMessage = `Sletning fejlede. Status: ${response.status}`;
                            try {
                                const errorData = await response.json();
                                errorMessage = errorData.message || errorMessage;
                            } catch (e) {
                                // Response was not JSON or error parsing it, use default status error
                            }
                            throw new Error(errorMessage);
                        }
                        // If successful:
                        row.remove(); 
                        recipesCache = recipesCache.filter(r => r.id !== recipeId);
                        // Optionally, call loadRecipes() if a full refresh is preferred over optimistic UI update
                    })
                    .catch(error => {
                        alert(`Fejl: ${error.message}`);
                    });
            }
        }
    });

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

    modal.addEventListener('submit', (event) => {
        if (event.target.id === 'modal-form') {
            event.preventDefault();
            handleFormSubmit();
        }
    });

    // --- INITIALIZE APP ---
    initializeAdminPage();
});