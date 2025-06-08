document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const API_BASE_URL = 'https://danish-recipe-api.onrender.com'; 

    // --- ELEMENT REFERENCES ---
    const ingredientsContainer = document.getElementById('ingredients-container');
    const addIngredientBtn = document.getElementById('add-ingredient-btn');
    const instructionsContainer = document.getElementById('instructions-container');
    const addInstructionBtn = document.getElementById('add-instruction-btn');
    const recipeForm = document.getElementById('add-recipe-form');
    const formStatus = document.getElementById('form-status');

    // --- NEW: A variable to hold our master ingredient list ---
    let masterIngredientList = [];

    // --- FUNCTIONS ---

    // This function now fetches the local JSON and stores it in our variable
    async function loadIngredientMasterList() {
        try {
            const response = await fetch('./ingredients.json');
            const ingredientsData = await response.json();
            
            // Transform the data into the format Tom Select expects: {value: '...', text: '...'}
            masterIngredientList = ingredientsData.map(ingredient => ({
                value: ingredient.name,
                text: ingredient.name
            }));

            console.log(`Loaded ${masterIngredientList.length} master ingredients.`);
            // Initialize the form with the first fields now that we have the data
            addIngredientField();
            addInstructionField();
        } catch (error) {
            console.error("Could not load local ingredients.json file:", error);
        }
    }

    // This function is now updated to initialize Tom Select on the new input field
    function addIngredientField() {
        const row = document.createElement('div');
        row.className = 'ingredient-row';
        const units = ['g', 'kg', 'dl', 'l', 'tsk', 'spsk', 'stk', 'knsp', 'fed', 'bundt'];
        const unitOptions = units.map(unit => `<option value="${unit}">${unit}</option>`).join('');
        const unitSelectHTML = `<select class="ingredient-unit"><option value="">Enhed</option>${unitOptions}</select>`;

        // We use a standard input, but give it a specific class for Tom Select to find
        row.innerHTML = `
            <input type="number" placeholder="Mængde" class="ingredient-amount" step="any">
            ${unitSelectHTML}
            <input type="text" placeholder="Søg eller tilføj ingrediens..." class="ingredient-name-select" required>
            <button type="button" class="remove-btn">－</button>
        `;
        ingredientsContainer.appendChild(row);
        
        // --- NEW: Initialize Tom Select on the input field we just created ---
        const selectInput = row.querySelector('.ingredient-name-select');
        new TomSelect(selectInput, {
            options: masterIngredientList,
            create: true, // Allows users to add a new ingredient if it's not in the list
            maxItems: 1,
            sortField: {
                field: "text",
                direction: "asc"
            }
        });

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
        
        // The gathering logic now uses the '.ingredient-name-select' class
        const ingredients = [];
        document.querySelectorAll('.ingredient-row').forEach(row => {
            const name = row.querySelector('.ingredient-name-select').value.trim();
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
    // Load the master list first, THEN add the initial fields
    loadIngredientMasterList();
});