document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const API_BASE_URL = 'https://smart-recipe-api.onrender.com'; 

    // --- ELEMENT REFERENCES ---
    const ingredientsContainer = document.getElementById('ingredients-container');
    const addIngredientBtn = document.getElementById('add-ingredient-btn');
    const instructionsContainer = document.getElementById('instructions-container');
    const addInstructionBtn = document.getElementById('add-instruction-btn');
    const recipeForm = document.getElementById('add-recipe-form');
    const formStatus = document.getElementById('form-status');
    const ingredientDataList = document.getElementById('ingredient-list');

    // --- FUNCTIONS ---

    // NEW: This function now fetches your local JSON file directly!
    async function loadIngredientSuggestions() {
        try {
            // Fetch the local file - no API or proxy needed!
            const response = await fetch('./ingredients.json');
            const ingredientsData = await response.json();
            
            // Populate the datalist with the names from your master list
            ingredientDataList.innerHTML = '';
            ingredientsData.forEach(ingredient => {
                const option = document.createElement('option');
                option.value = ingredient.name;
                ingredientDataList.appendChild(option);
            });
            console.log(`Loaded ${ingredientsData.length} ingredient suggestions from local file.`);
        } catch (error) {
            console.error("Could not load local ingredients.json file:", error);
        }
    }

    // This function is now simpler as it doesn't need the unit list hardcoded
    function addIngredientField() {
        const row = document.createElement('div');
        row.className = 'ingredient-row';
        const units = ['g', 'kg', 'dl', 'l', 'tsk', 'spsk', 'stk', 'knsp', 'fed', 'bundt'];
        const unitOptions = units.map(unit => `<option value="${unit}">${unit}</option>`).join('');
        const unitSelectHTML = `<select class="ingredient-unit"><option value="">Enhed</option>${unitOptions}</select>`;

        row.innerHTML = `
            <input type="number" placeholder="Mængde" class="ingredient-amount" step="any">
            ${unitSelectHTML}
            <input type="text" placeholder="Ingrediens" class="ingredient-name" list="ingredient-list" required>
            <button type="button" class="remove-btn">－</button>
        `;
        ingredientsContainer.appendChild(row);
        row.querySelector('.remove-btn').addEventListener('click', () => row.remove());
    }

    function addInstructionField() {
        const row = document.createElement('div');
        row.className = 'instruction-row';
        row.innerHTML = `
            <textarea placeholder="Skriv trin..." class="instruction-step" rows="2" required></textarea>
            <button type="button" class="remove-btn">－</button>
        `;
        instructionsContainer.appendChild(row);
        row.querySelector('.remove-btn').addEventListener('click', () => row.remove());
    }

    // --- EVENT LISTENERS ---
    addIngredientBtn.addEventListener('click', addIngredientField);
    addInstructionBtn.addEventListener('click', addInstructionField);

    recipeForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        formStatus.textContent = 'Gemmer opskrift...';
        formStatus.style.color = 'black';
        
        // The rest of this submit handler remains the same
        const ingredients = [];
        document.querySelectorAll('.ingredient-row').forEach(row => {
            const name = row.querySelector('.ingredient-name').value.trim();
            if (name) {
                ingredients.push({
                    amount: parseFloat(row.querySelector('.ingredient-amount').value) || null,
                    unit: row.querySelector('.ingredient-unit').value.trim(),
                    name: name
                });
            }
        });
        const instructions = [];
        document.querySelectorAll('.instruction-step').forEach(textarea => {
            const step = textarea.value.trim();
            if (step) {
                instructions.push(step);
            }
        });
        const recipeData = {
            title: document.getElementById('title').value.trim(),
            description: document.getElementById('description').value.trim(),
            imageUrl: document.getElementById('imageUrl').value.trim(),
            prepTimeMinutes: parseInt(document.getElementById('prepTimeMinutes').value) || 0,
            cookTimeMinutes: parseInt(document.getElementById('cookTimeMinutes').value) || 0,
            servings: parseInt(document.getElementById('servings').value) || 0,
            category: "Aftensmad",
            ingredients: ingredients,
            instructions: instructions
        };
        try {
            const response = await fetch(`${API_BASE_URL}/recipes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(recipeData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Server-fejl');
            }
            const result = await response.json();
            formStatus.textContent = `Success! ${result.message}`;
            formStatus.style.color = 'green';
            recipeForm.reset();
            ingredientsContainer.innerHTML = ''; 
            instructionsContainer.innerHTML = '';
            addIngredientField();
            addInstructionField();
        } catch (error) {
            formStatus.textContent = `Fejl: ${error.message}`;
            formStatus.style.color = 'red';
            console.error('Submission error:', error);
        }
    });

    // --- INITIALIZE FORM ---
    addIngredientField();
    addInstructionField();
    loadIngredientSuggestions();
});