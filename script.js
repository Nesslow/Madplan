document.addEventListener('DOMContentLoaded', () => {
    // --- Variables ---
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const recipeListContainer = document.getElementById('recipe-list');
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    
    const popularBtn = document.getElementById('popular-btn');
    const topBtn = document.getElementById('top-btn');
    const newBtn = document.getElementById('new-btn');
    const modalContainer = document.getElementById('modal-container');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalContent = document.getElementById('modal-recipe-content');

    // --- All functions are now declared first using the 'function' keyword ---

    async function findSingleRecipe(ingredient) {
        recipeListContainer.innerHTML = `<p>Søger efter opskrifter med ${ingredient}...</p>`;
        const searchApiUrl = `http://www.madopskrifter.nu/webservices/iphone/iphoneclientservice.svc/GetRecipesByFreeText/0/${ingredient}`;
        const fullUrl = proxyUrl + encodeURIComponent(searchApiUrl);
        
        try {
            const response = await fetch(fullUrl);
            if (!response.ok) throw new Error('Search failed.');
            const recipes = JSON.parse(await response.text());
            if (recipes && recipes.length > 0) {
                displayRecipes(recipes);
            } else {
                recipeListContainer.innerHTML = `<p>Ingen opskrifter fundet for '${ingredient}'.</p>`;
            }
        } catch (error) {
            console.error('Error in findSingleRecipe:', error);
            recipeListContainer.innerHTML = `<p style="color: red;">Der opstod en fejl under søgningen.</p>`;
        }
    }
    
    async function getRecipeList(endpoint, title) {
        recipeListContainer.innerHTML = `<p>Henter ${title.toLowerCase()}...</p>`;
        const apiUrl = `http://www.madopskrifter.nu/webservices/iphone/iphoneclientservice.svc/${endpoint}/0`;
        const fullUrl = proxyUrl + encodeURIComponent(apiUrl);
        
        try {
            const response = await fetch(fullUrl);
            if (!response.ok) throw new Error(`Could not fetch ${title}.`);
            const recipes = JSON.parse(await response.text());
            if (recipes && recipes.length > 0) {
                displayRecipes(recipes);
            } else {
                recipeListContainer.innerHTML = `<p>Kunne ikke finde nogen ${title.toLowerCase()}.</p>`;
            }
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            recipeListContainer.innerHTML = `<p style="color: red;">Der opstod en fejl.</p>`;
        }
    }

    function displayRecipes(recipes) {
        recipeListContainer.innerHTML = '';
        recipes.forEach(recipeData => {
            const recipeId = recipeData[0];
            const title = recipeData[1];
            const imageUrl = recipeData[2].replace('http://', 'https://');
            const price = recipeData[3];

            const recipeCard = document.createElement('div');
            recipeCard.classList.add('recipe-card');
            recipeCard.style.cursor = 'pointer';
            recipeCard.dataset.recipeId = recipeId;

            recipeCard.innerHTML = `
                <img src="${imageUrl}" alt="${title}">
                <h3>${title}</h3>
                ${price !== '-' ? `<p>Pris: ${price}</p>` : ''}
            `;
            
            recipeCard.addEventListener('click', () => getRecipeDetails(recipeId));
            recipeListContainer.appendChild(recipeCard);
        });
    }
    
    // THIS IS THE UPDATED FUNCTION
    async function getRecipeDetails(recipeId) {
        modalContent.innerHTML = '<h2>Henter opskrift...</h2>';
        modalContainer.classList.add('show');
        const detailsApiUrl = `http://www.madopskrifter.nu/webservices/iphone/iphoneclientservice.svc/GetRecipe/0/${recipeId}/4`;
        const fullUrl = proxyUrl + encodeURIComponent(detailsApiUrl);

        try {
            const response = await fetch(fullUrl);
            if (!response.ok) throw new Error('Recipe details not found.');
            
            const data = JSON.parse(await response.text());
            
            // Parsing logic based on the actual API response
            const title = data[1];
            const description = data[4];
            const instructions = data[3].replace(/\r\n\r\n/g, '<p>').replace(/\r\n/g, '<br>');
            const imageUrl = data[9].replace('http://', 'https://'); // The large image URL

            const ingredientsListString = data[12];
            const ingredients = ingredientsListString
                .split(/\r\n/g) // Split the string into an array at each line break
                .map(line => `<li>${line.trim()}</li>`) // Wrap each line in an <li> tag
                .join(''); // Join them back into a single HTML string

            modalContent.innerHTML = `
                <h2>${title}</h2>
                <img src="${imageUrl}" alt="${title}">
                <p>${description || 'Ingen beskrivelse tilgængelig.'}</p>
                <h3>Ingredienser</h3>
                <ul>${ingredients}</ul>
                <h3>Fremgangsmåde</h3>
                <p>${instructions || 'Ingen fremgangsmåde tilgængelig.'}</p>
            `;
        } catch (error) {
            modalContent.innerHTML = `<h2>Fejl</h2><p>Kunne ikke hente opskriftens detaljer. Prøv venligst igen senere.</p>`;
            console.error("Error fetching details:", error);
        }
    }

    // --- Event Listeners ---
    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                findSingleRecipe(searchTerm);
            }
        });
    }

    if (popularBtn) popularBtn.addEventListener('click', () => getRecipeList('GetPopularRecipes', 'Populære Opskrifter'));
    if (topBtn) topBtn.addEventListener('click', () => getRecipeList('GetTopRecipes', 'Top Opskrifter'));
    if (newBtn) newBtn.addEventListener('click', () => getRecipeList('GetNewRecipes', 'Nyeste Opskrifter'));
    
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => modalContainer.classList.remove('show'));
    if (modalContainer) {
        modalContainer.addEventListener('click', (event) => {
            if (event.target === modalContainer) {
                modalContainer.classList.remove('show');
            }
        });
    }

    // Fetch popular recipes on page load
    getRecipeList('GetPopularRecipes', 'Populære Opskrifter');
});
