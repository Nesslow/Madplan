document.addEventListener('DOMContentLoaded', () => {
    // --- Existing variables ---
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const recipeListContainer = document.getElementById('recipe-list');
    const proxyUrl = 'https://corsproxy.io/?';

    // --- NEW: Modal variables ---
    const modalContainer = document.getElementById('modal-container');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalContent = document.getElementById('modal-recipe-content');

    // --- Event Listeners ---
    searchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const searchTerm = searchInput.value.trim();
        if (searchTerm) {
            findRecipes(searchTerm);
        }
    });

    // --- NEW: Close modal when clicking the 'x' button ---
    modalCloseBtn.addEventListener('click', () => {
        modalContainer.classList.remove('show');
    });

    // --- NEW: Close modal when clicking on the background overlay ---
    modalContainer.addEventListener('click', (event) => {
        if (event.target === modalContainer) {
            modalContainer.classList.remove('show');
        }
    });


    // --- Functions ---
    const findRecipes = async (ingredient) => {
        // ... (This function remains the same as before)
        recipeListContainer.innerHTML = `<p>Søger efter opskrifter med ${ingredient}...</p>`;
        const searchApiUrl = `http://www.madopskrifter.nu/webservices/iphone/iphoneclientservice.svc/GetRecipesByFreeText/0/${ingredient}`;
        const fullUrl = proxyUrl + searchApiUrl;

        try {
            const response = await fetch(fullUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const recipes = await response.json();

            if (recipes && recipes.length > 0) {
                displayRecipes(recipes);
            } else {
                recipeListContainer.innerHTML = `<p>Ingen opskrifter fundet for '${ingredient}'. Prøv en anden ingrediens.</p>`;
            }
        } catch (error) {
            console.error('Error fetching recipes:', error);
            recipeListContainer.innerHTML = `<p style="color: red;">Der opstod en fejl under søgningen.</p>`;
        }
    };

    const displayRecipes = (recipes) => {
        recipeListContainer.innerHTML = '';

        recipes.forEach(recipe => {
            // --- UPDATED: Storing the ID and adding a class for styling ---
            const recipeId = recipe[0];
            const title = recipe[1];
            const imageUrl = recipe[2];
            const price = recipe[3];

            const recipeCard = document.createElement('div');
            recipeCard.classList.add('recipe-card');
            recipeCard.style.cursor = 'pointer'; // Make it look clickable
            recipeCard.dataset.recipeId = recipeId; // Store the ID on the element

            recipeCard.innerHTML = `
                <img src="${imageUrl}" alt="${title}">
                <h3>${title}</h3>
                ${price !== '-' ? `<p>Pris: ${price}</p>` : ''}
            `;
            
            // --- NEW: Add click listener to each card ---
            recipeCard.addEventListener('click', () => {
                getRecipeDetails(recipeId);
            });

            recipeListContainer.appendChild(recipeCard);
        });
    };

    // --- NEW: Function to fetch and display details in the modal ---
    const getRecipeDetails = async (recipeId) => {
        // Show the modal with a loading message
        modalContent.innerHTML = '<h2>Henter opskrift...</h2>';
        modalContainer.classList.add('show');

        const detailsApiUrl = `http://www.madopskrifter.nu/webservices/iphone/iphoneclientservice.svc/GetRecipe/0/${recipeId}/4`;
        const fullUrl = proxyUrl + detailsApiUrl;

        try {
            const response = await fetch(fullUrl);
            if (!response.ok) throw new Error('Recipe details not found.');
            
            const data = await response.json();

            // The first array has general info
            const generalInfo = data[0];
            const title = generalInfo[1];
            const description = generalInfo[2];
            const imageUrl = generalInfo[3];

            // The last array contains the instructions
            const instructions = data[data.length - 1][1].replace(/\n/g, '<br>');

            // Everything in between is an ingredient
            const ingredients = data.slice(1, -1).map(ing => `<li>${ing[0]} ${ing[1]} <strong>${ing[2]}</strong></li>`).join('');

            // Populate the modal with the fetched data
            modalContent.innerHTML = `
                <h2>${title}</h2>
                <img src="${imageUrl}" alt="${title}">
                <p>${description}</p>
                <h3>Ingredienser</h3>
                <ul>${ingredients}</ul>
                <h3>Fremgangsmåde</h3>
                <p>${instructions}</p>
            `;

        } catch (error) {
            modalContent.innerHTML = `<h2>Fejl</h2><p>Kunne ikke hente opskriftens detaljer. Prøv venligst igen senere.</p>`;
            console.error("Error fetching details:", error);
        }
    };
});