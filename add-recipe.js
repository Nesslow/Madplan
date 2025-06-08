// add-recipe.js
document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    // PASTE YOUR RENDER URL HERE
    const API_BASE_URL = 'https://danish-recipe-api.onrender.com'; 

    // --- ELEMENT REFERENCES ---
    const ingredientsContainer = document.getElementById('ingredients-container');
    const addIngredientBtn = document.getElementById('add-ingredient-btn');
    const instructionsContainer = document.getElementById('instructions-container');
    const addInstructionBtn = document.getElementById('add-instruction-btn');
    const recipeForm = document.getElementById('add-recipe-form');
    const formStatus = document.getElementById('form-status');

    // --- BUTTON EVENT LISTENERS ---
    // This was the missing piece. It tells the browser to call our functions when the buttons are clicked.
    addIngredientBtn.addEventListener('click', addIngredientField);
    addInstructionBtn.addEventListener('click', addInstructionField);


    // --- FUNCTIONS TO DYNAMICALLY ADD/REMOVE FIELDS ---
    const addIngredientField = () => {
        const row = document.createElement('div');
        row.className = 'ingredient-row';
        row.innerHTML = `
            <input type="number" placeholder="Mængde" class="ingredient-amount" step="any">
            <input type="text" placeholder="Enhed (f.eks. g, dl, stk)" class="ingredient-unit">
            <input type="text" placeholder="Ingrediens" class="ingredient-name" required>
            <button type="button" class="remove-btn">－</button>
        `;
        ingredientsContainer.appendChild(row);
        // Add event listener to the new remove button
        row.querySelector('.remove-btn').addEventListener('click', () => row.remove());
    };

    const addInstructionField = () => {
        const row = document.createElement('div');
        row.className = 'instruction-row';
        row.innerHTML = `
            <textarea placeholder="Skriv trin..." class="instruction-step" rows="2" required></textarea>
            <button type="button" class="remove-btn">－</button>
        `;
        instructionsContainer.appendChild(row);
        row.querySelector('.remove-btn').addEventListener('click', () => row.remove());
    };

    // --- FORM SUBMISSION HANDLER ---
    recipeForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent default form submission
        formStatus.textContent = 'Gemmer opskrift...';
        formStatus.style.color = 'black';

        // 1. Gather all data from the form into a single object
        const ingredients = [];
        document.querySelectorAll('.ingredient-row').forEach(row => {
            const name = row.querySelector('.ingredient-name').value.trim();
            // Only add ingredient if name is not empty
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
            // Only add instruction if it's not empty
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
            category: "Aftensmad", // Default category for now
            ingredients: ingredients,
            instructions: instructions
        };

        // 2. Send the data to our back-end API
        try {
            const response = await fetch(`${API_BASE_URL}/recipes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recipeData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Server-fejl');
            }

            const result = await response.json();
            formStatus.textContent = `Success! ${result.message}`;
            formStatus.style.color = 'green';
            recipeForm.reset(); // Clear the form
            // Clear dynamic fields
            ingredientsContainer.innerHTML = ''; 
            instructionsContainer.innerHTML = '';
            addIngredientField(); // Add one blank field back
            addInstructionField();

        } catch (error) {
            formStatus.textContent = `Fejl: ${error.message}`;
            formStatus.style.color = 'red';
            console.error('Submission error:', error);
        }
    });

    // --- INITIALIZE FORM ---
    // Add one blank field for ingredients and instructions when the page loads
    addIngredientField();
    addInstructionField();
});