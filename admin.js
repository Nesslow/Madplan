// admin.js
document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    // PASTE YOUR RENDER URL HERE
    const API_BASE_URL = 'https://smart-recipe-api.onrender.com';

    // --- ELEMENT REFERENCES ---
    const tableBody = document.getElementById('recipe-table-body');

    // --- FUNCTIONS ---

    // Function to fetch all recipes and render the table
    async function loadRecipes() {
        tableBody.innerHTML = '<tr><td colspan="3">Henter opskrifter...</td></tr>';

        try {
            const response = await fetch(`${API_BASE_URL}/recipes`);
            if (!response.ok) throw new Error('Could not fetch recipes.');
            
            const recipes = await response.json();
            renderTable(recipes);
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="3" style="color: red;">Fejl: ${error.message}</td></tr>`;
            console.error('Error loading recipes:', error);
        }
    }

    // Function to build the HTML table from the recipe data
    function renderTable(recipes) {
        tableBody.innerHTML = ''; // Clear the loading message

        if (recipes.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="3">Ingen opskrifter fundet i databasen.</td></tr>';
            return;
        }

        recipes.forEach(recipe => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${recipe.title}</td>
                <td>${recipe.category || 'N/A'}</td>
                <td class="actions-cell">
                    <a href="add-recipe.html?id=${recipe.id}" class="edit-btn">Rediger</a>
                    <button class="delete-btn" data-id="${recipe.id}" data-title="${recipe.title}">Slet</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Function to handle deleting a recipe
    async function deleteRecipe(recipeId, buttonElement) {
        try {
            const response = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete recipe.');
            }

            // If successful, remove the table row from the page for instant feedback
            buttonElement.closest('tr').remove();

        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error('Error deleting recipe:', error);
        }
    }

    // --- EVENT LISTENER ---
    // Use event delegation to handle all delete button clicks efficiently
    tableBody.addEventListener('click', (event) => {
        // Check if a delete button was clicked
        if (event.target.classList.contains('delete-btn')) {
            const button = event.target;
            const recipeId = button.dataset.id;
            const recipeTitle = button.dataset.title;

            // Show a confirmation dialog before deleting
            const isConfirmed = window.confirm(`Er du sikker på, at du vil slette opskriften "${recipeTitle}"?\nDenne handling kan ikke fortrydes.`);

            if (isConfirmed) {
                deleteRecipe(recipeId, button);
            }
        }
    });

    // --- INITIAL LOAD ---
    loadRecipes();
});