document.addEventListener('DOMContentLoaded', () => {
    // --- Variables ---
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const recipeListContainer = document.getElementById('recipe-list');
    
    // --- NEW: Your own API's URL! ---
    // PASTE YOUR RENDER URL HERE
    const API_BASE_URL = 'https://smart-recipe-api.onrender.com'; 

    const popularBtn = document.getElementById('popular-btn');
    const topBtn = document.getElementById('top-btn');
    const newBtn = document.getElementById('new-btn');
    const modalContainer = document.getElementById('modal-container');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalContent = document.getElementById('modal-recipe-content');
    // Note: We've removed the category logic for now until we build it in our new API

    
    // --- Functions ---

    // This function now calls our own API
    async function getRecipes() {
        recipeListContainer.innerHTML = `<p>Henter opskrifter fra din database...</p>`;
        // Notice: No more proxy, no more encodeURIComponent. Just a clean URL.
        const fullUrl = `${API_BASE_URL}/recipes`;
        
        try {
            const response = await fetch(fullUrl);
            if (!response.ok) throw new Error('Could not fetch recipes from your API.');
            const recipes = await response.json(); // .json() now works directly!
            if (recipes && recipes.length > 0) {
                displayRecipes(recipes);
            } else {
                recipeListContainer.innerHTML = `<p>Ingen opskrifter fundet i din database.</p>`;
            }
        } catch (error) {
            console.error('Error fetching recipes:', error);
            recipeListContainer.innerHTML = `<p style="color: red;">Der opstod en fejl.</p>`;
        }
    }

    // This function now uses clean object properties instead of array indexes
    function displayRecipes(recipes) {
        recipeListContainer.innerHTML = '';
        recipes.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.classList.add('recipe-card');
            recipeCard.style.cursor = 'pointer';
            // We use the real document ID from Firestore
            recipeCard.dataset.recipeId = recipe.id; 

            recipeCard.innerHTML = `
                <img src="${recipe.imageUrl}" alt="${recipe.title}">
                <h3>${recipe.title}</h3>
            `;
            
            recipeCard.addEventListener('click', () => getRecipeDetails(recipe.id));
            recipeListContainer.appendChild(recipeCard);
        });
    }
    
    // This function also calls our new API and parses clean object properties
    async function getRecipeDetails(recipeId) {
        modalContent.innerHTML = '<h2>Henter opskrift...</h2>';
        modalContainer.classList.add('show');
        const fullUrl = `${API_BASE_URL}/recipes/${recipeId}`;

        try {
            const response = await fetch(fullUrl);
            if (!response.ok) throw new Error('Recipe details not found.');
            const recipe = await response.json();
            
            // The ingredients and instructions are now nicely formatted arrays!
            const ingredientsHTML = recipe.ingredients
                .map(ing => `<li>${ing.amount || ''} ${ing.unit || ''} <strong>${ing.name || ''}</strong></li>`)
                .join('');
            
            const instructionsHTML = recipe.instructions
                .map(step => `<p>${step}</p>`)
                .join('');

            modalContent.innerHTML = `
                <h2>${recipe.title}</h2>
                <img src="${recipe.imageUrl}" alt="${recipe.title}">
                <p>${recipe.description || 'Ingen beskrivelse tilgængelig.'}</p>
                <h3>Ingredienser</h3>
                <ul>${ingredientsHTML}</ul>
                <h3>Fremgangsmåde</h3>
                ${instructionsHTML}
            `;
        } catch (error) {
            modalContent.innerHTML = `<h2>Fejl</h2><p>Kunne ikke hente opskriftens detaljer.</p>`;
            console.error("Error fetching details:", error);
        }
    }

    // --- Event Listeners and Initial Load ---
    // For now, we will make all the top buttons fetch all recipes.
    // We will build the specific search/filter logic into our API next.
    if (popularBtn) popularBtn.addEventListener('click', getRecipes);
    if (topBtn) topBtn.addEventListener('click', getRecipes);
    if (newBtn) newBtn.addEventListener('click', getRecipes);
    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            alert("Søgefunktion er ikke bygget i vores nye API endnu. Kommer snart!");
        });
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => modalContainer.classList.remove('show'));
    if (modalContainer) {
        modalContainer.addEventListener('click', (event) => {
            if (event.target === modalContainer) {
                modalContainer.classList.remove('show');
            }
        });
    }

    // Fetch recipes on page load
    getRecipes();
});