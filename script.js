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
    const categoryFiltersContainer = document.getElementById('category-filters');


    // --- Functions ---

    async function findSingleRecipe(ingredient) {
        recipeListContainer.innerHTML = `<p>Søger efter opskrifter med ${ingredient}...</p>`;
        const searchApiUrl = `http://www.madopskrifter.nu/webservices/iphone/iphoneclientservice.svc/GetRecipesByFreeText/0/${ingredient}`;
        const fullUrl = proxyUrl + encodeURIComponent(searchApiUrl);
        
        try {
            let response = await fetch(fullUrl);
            if (!response.ok) throw new Error('Search failed.');
            let recipes = JSON.parse(await response.text());

            if (recipes && recipes.length > 0) {
                // --- NEW: Limit results to the first 5 ---
                const limitedRecipes = recipes.slice(0, 5);

                recipeListContainer.innerHTML = `<p>Henter detaljer for ${limitedRecipes.length} opskrifter... Dette kan tage et øjeblik.</p>`;
                
                const detailPromises = limitedRecipes.map(recipe => {
                    const recipeId = recipe[0];
                    const detailsApiUrl = `http://www.madopskrifter.nu/webservices/iphone/iphoneclientservice.svc/GetRecipe/0/${recipeId}/4`;
                    const detailFullUrl = proxyUrl + encodeURIComponent(detailsApiUrl);
                    return fetch(detailFullUrl).then(res => res.text()).then(text => JSON.parse(text));
                });

                const detailedRecipes = await Promise.all(detailPromises);
                displayRecipes(detailedRecipes);
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
            let response = await fetch(fullUrl);
            if (!response.ok) throw new Error(`Could not fetch ${title}.`);
            let recipes = JSON.parse(await response.text());

            if (recipes && recipes.length > 0) {
                // --- NEW: Limit results to the first 5 ---
                const limitedRecipes = recipes.slice(0, 5);

                recipeListContainer.innerHTML = `<p>Henter detaljer for ${limitedRecipes.length} opskrifter... Dette kan tage et øjeblik.</p>`;

                const detailPromises = limitedRecipes.map(recipe => {
                    const recipeId = recipe[0];
                    const detailsApiUrl = `http://www.madopskrifter.nu/webservices/iphone/iphoneclientservice.svc/GetRecipe/0/${recipeId}/4`;
                    const detailFullUrl = proxyUrl + encodeURIComponent(detailsApiUrl);
                    return fetch(detailFullUrl).then(res => res.text()).then(text => JSON.parse(text));
                });
                
                const detailedRecipes = await Promise.all(detailPromises);
                displayRecipes(detailedRecipes);
            } else {
                recipeListContainer.innerHTML = `<p>Kunne ikke finde nogen ${title.toLowerCase()}.</p>`;
            }
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            recipeListContainer.innerHTML = `<p style="color: red;">Der opstod en fejl.</p>`;
        }
    }

    async function getRecipesByCategory(categoryId, categoryName) {
        recipeListContainer.innerHTML = `<p>Henter opskrifter i kategorien '${categoryName}'...</p>`;
        const apiUrl = `http://www.madopskrifter.nu/webservices/iphone/iphoneclientservice.svc/GetRecipesByMealCatId/0/${categoryId}/true`;
        const fullUrl = proxyUrl + encodeURIComponent(apiUrl);

        try {
            let response = await fetch(fullUrl);
            if (!response.ok) throw new Error(`Could not fetch recipes for ${categoryName}.`);
            let recipes = JSON.parse(await response.text());

            if (recipes && recipes.length > 0) {
                // --- NEW: Limit results to the first 5 ---
                const limitedRecipes = recipes.slice(0, 5);

                recipeListContainer.innerHTML = `<p>Henter detaljer for ${limitedRecipes.length} opskrifter... Dette kan tage et øjeblik.</p>`;

                const detailPromises = limitedRecipes.map(recipe => {
                    const recipeId = recipe[0];
                    const detailsApiUrl = `http://www.madopskrifter.nu/webservices/iphone/iphoneclientservice.svc/GetRecipe/0/${recipeId}/4`;
                    const detailFullUrl = proxyUrl + encodeURIComponent(detailsApiUrl);
                    return fetch(detailFullUrl).then(res => res.text()).then(text => JSON.parse(text));
                });
                
                const detailedRecipes = await Promise.all(detailPromises);
                displayRecipes(detailedRecipes);
            } else {
                recipeListContainer.innerHTML = `<p>Kunne ikke finde nogen opskrifter i kategorien '${categoryName}'.</p>`;
            }
        } catch (error) {
            console.error(`Error fetching recipes for category ${categoryId}:`, error);
            recipeListContainer.innerHTML = `<p style="color: red;">Der opstod en fejl.</p>`;
        }
    }
    
    function displayCategories(data) {
        const mainCategories = data[3];

        if (!mainCategories) {
            console.error("Could not find main categories in the expected format.");
            return;
        }

        mainCategories.forEach(category => {
            const categoryId = category[0];
            const categoryName = category[1];

            const button = document.createElement('button');
            button.textContent = categoryName;
            button.dataset.categoryId = categoryId; 

            button.addEventListener('click', () => {
                getRecipesByCategory(categoryId, categoryName);
            });
            
            categoryFiltersContainer.appendChild(button);
        });
    }

    async function getCategories() {
        const apiUrl = 'http://www.madopskrifter.nu/webservices/iphone/iphoneclientservice.svc/GetCategories/0/0';
        const fullUrl = proxyUrl + encodeURIComponent(apiUrl);
        try {
            const response = await fetch(fullUrl);
            if (!response.ok) throw new Error('Could not fetch categories.');
            const categories = JSON.parse(await response.text());
            if (categories && categories.length > 0) {
                displayCategories(categories);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    }
    
    function displayRecipes(detailedRecipes) {
        recipeListContainer.innerHTML = '';
        detailedRecipes.forEach(recipeData => {
            const recipeId = recipeData[0];
            const title = recipeData[1];
            const imageUrl = recipeData[9].replace('http://', 'https://');
            const ingredientsListString = recipeData[12];
            
            const ingredients = ingredientsListString
                .split(/\r\n/g)
                .map(line => `<li>${line.trim()}</li>`)
                .join('');

            const recipeCard = document.createElement('div');
            recipeCard.classList.add('recipe-card');
            recipeCard.style.cursor = 'pointer';
            recipeCard.dataset.recipeId = recipeId;

            recipeCard.innerHTML = `
                <img src="${imageUrl}" alt="${title}">
                <h3>${title}</h3>
                <ul class="card-ingredients">${ingredients}</ul>
            `;
            
            recipeCard.addEventListener('click', () => {
                displayRecipeDetails(recipeData);
            });
            recipeListContainer.appendChild(recipeCard);
        });
    }
    
    function displayRecipeDetails(data) {
        modalContent.innerHTML = '';
        modalContainer.classList.add('show');

        const title = data[1];
        const description = data[4];
        const instructions = data[3].replace(/\r\n\r\n/g, '<p>').replace(/\r\n/g, '<br>');
        const imageUrl = data[9].replace('http://', 'https://');
        const ingredientsListString = data[12];
        const ingredients = ingredientsListString
            .split(/\r\n/g)
            .map(line => `<li>${line.trim()}</li>`)
            .join('');

        modalContent.innerHTML = `
            <h2>${title}</h2>
            <img src="${imageUrl}" alt="${title}">
            <p>${description || 'Ingen beskrivelse tilgængelig.'}</p>
            <h3>Ingredienser</h3>
            <ul>${ingredients}</ul>
            <h3>Fremgangsmåde</h3>
            <p>${instructions || 'Ingen fremgangsmåde tilgængelig.'}</p>
        `;
    }

    // --- Event Listeners and Initial Load ---
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

    getRecipeList('GetPopularRecipes', 'Populære Opskrifter');
    // getCategories(); 
});