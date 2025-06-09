document.addEventListener('DOMContentLoaded', () => {
    // --- Variables ---
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const recipeListContainer = document.getElementById('recipe-list');
    const API_BASE_URL = 'https://smart-recipe-api.onrender.com'; 
    const modalContainer = document.getElementById('modal-container');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalContent = document.getElementById('modal-recipe-content');
    
    let previouslyFocusedElement = null; // To store focus before modal opens
    let allRecipesCache = []; // Cache for all fetched recipes

    // --- Functions ---

    async function getRecipes() {
        recipeListContainer.innerHTML = `<p>Henter opskrifter fra din database...</p>`;
        const fullUrl = `${API_BASE_URL}/recipes`;
        
        try {
            const response = await fetch(fullUrl);
            if (!response.ok) throw new Error('Could not fetch recipes from your API.');
            allRecipesCache = await response.json(); // Store recipes in cache
            if (allRecipesCache && allRecipesCache.length > 0) {
                displayRecipes(allRecipesCache); // Display all recipes initially
            } else {
                recipeListContainer.innerHTML = `<p>Ingen opskrifter fundet i din database.</p>`;
            }
        } catch (error) {
            console.error('Error fetching recipes:', error);
            recipeListContainer.innerHTML = `<p style="color: red;">Der opstod en fejl.</p>`;
        }
    }

    function displayRecipes(recipes) {
        recipeListContainer.innerHTML = '';
        const currentSearchTerms = searchInput.value.toLowerCase().split(',').map(term => term.trim()).filter(term => term.length > 0);

        recipes.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.classList.add('recipe-card');
            recipeCard.style.cursor = 'pointer';
            recipeCard.dataset.recipeId = recipe.id; 
            recipeCard.setAttribute('tabindex', '0'); // Make card focusable
            recipeCard.setAttribute('role', 'button'); // Indicate it's interactive
            recipeCard.setAttribute('aria-label', `Vis detaljer for ${recipe.title}`);

            const ingredientsList = recipe.ingredients && recipe.ingredients.length > 0
                ? `<ul class="card-ingredients">${recipe.ingredients.map(ing => {
                    let ingName = ing.name;
                    if (ingName && currentSearchTerms.length > 0) {
                        currentSearchTerms.forEach(term => {
                            const regex = new RegExp(`(${term})`, 'gi');
                            ingName = ingName.replace(regex, '<span class="highlight">$1</span>');
                        });
                    }
                    return `<li>${ingName}</li>`;
                }).join('')}</ul>`
                : '<p class="card-ingredients-empty">Ingen ingredienser angivet.</p>';

            recipeCard.innerHTML = `
                <img src="${recipe.imageUrl}" alt="${recipe.title}">
                <h3>${recipe.title}</h3>
                <h4>Ingredienser:</h4>
                ${ingredientsList}
            `;
            
            const openRecipeDetails = () => getRecipeDetails(recipe.id);
            recipeCard.addEventListener('click', openRecipeDetails);
            recipeCard.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openRecipeDetails();
                }
            });
            recipeListContainer.appendChild(recipeCard);
        });
    }
    
    function openModal() {
        previouslyFocusedElement = document.activeElement;
        modalContainer.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    function closeModal() {
        modalContainer.classList.remove('show');
        document.body.style.overflow = ''; // Restore background scroll
        if (previouslyFocusedElement) {
            previouslyFocusedElement.focus();
        }
        // Clean up aria-labelledby in case of error or if title ID changes
        modalContainer.removeAttribute('aria-labelledby');
    }

    function trapFocus(modalElement) {
        const focusableElementsString = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
        let focusableElements = Array.from(modalElement.querySelectorAll(focusableElementsString));

        if (focusableElements.length === 0) return; // Nothing to trap focus on

        const firstFocusableElement = focusableElements[0];
        const lastFocusableElement = focusableElements[focusableElements.length - 1];

        modalElement.addEventListener('keydown', function(e) {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstFocusableElement) {
                    lastFocusableElement.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastFocusableElement) {
                    firstFocusableElement.focus();
                    e.preventDefault();
                }
            }
        });
    }

    async function getRecipeDetails(recipeId) {
        openModal(); // Handle storing focus, showing modal, preventing bg scroll
        modalContent.innerHTML = '<h2>Henter opskrift...</h2>'; // Initial content
        
        const fullUrl = `${API_BASE_URL}/recipes/${recipeId}`;

        try {
            const response = await fetch(fullUrl);
            if (!response.ok) throw new Error('Recipe details not found.');
            const recipe = await response.json();
            
            const ingredientsHTML = recipe.ingredients
                .map(ing => `<li>${ing.amount || ''} ${ing.unit || ''} <strong>${ing.name || ''}</strong></li>`)
                .join('');
            
            const instructionsHTML = recipe.instructions
                .map(step => `<p>${step}</p>`)
                .join('');

            const modalTitleId = 'modal-recipe-title';
            modalContent.innerHTML = `
                <h2 id="${modalTitleId}">${recipe.title}</h2>
                <img src="${recipe.imageUrl}" alt="">
                <p>${recipe.description || 'Ingen beskrivelse tilgængelig.'}</p>
                <h3>Ingredienser</h3>
                <ul>${ingredientsHTML}</ul>
                <h3>Fremgangsmåde</h3>
                ${instructionsHTML}
            `;
            // Set alt attribute for image. If purely decorative and title is descriptive: alt=""
            // If image adds specific info: alt="Relevant description of image for ${recipe.title}"
            // For now, using recipe title as alt text for the image as well.
            const imgElement = modalContent.querySelector('img');
            if (imgElement) imgElement.alt = recipe.title;


            modalContainer.setAttribute('aria-labelledby', modalTitleId);
            modalCloseBtn.focus(); // Set focus to the close button
            trapFocus(modalContainer); // Initialize focus trapping

        } catch (error) {
            const errorTitleId = 'modal-error-title';
            modalContent.innerHTML = `<h2 id="${errorTitleId}">Fejl</h2><p>Kunne ikke hente opskriftens detaljer.</p>`;
            modalContainer.setAttribute('aria-labelledby', errorTitleId);
            modalCloseBtn.focus(); // Set focus to the close button in case of error too
            trapFocus(modalContainer); // Initialize focus trapping
            console.error("Error fetching details:", error);
        }
    }

    function handleSearch(event) {
        event.preventDefault();
        const searchTerms = searchInput.value.toLowerCase().split(',').map(term => term.trim()).filter(term => term.length > 0);

        if (searchTerms.length === 0) {
            displayRecipes(allRecipesCache); // If search is empty, show all recipes
            return;
        }

        const filteredAndSortedRecipes = allRecipesCache.map(recipe => {
            let matchCount = 0;
            if (recipe.ingredients && recipe.ingredients.length > 0) {
                searchTerms.forEach(searchTerm => {
                    if (recipe.ingredients.some(ing => ing.name && ing.name.toLowerCase().includes(searchTerm))) {
                        matchCount++;
                    }
                });
            }
            return { ...recipe, matchCount };
        })
        .filter(recipe => recipe.matchCount > 0)
        .sort((a, b) => b.matchCount - a.matchCount);

        if (filteredAndSortedRecipes.length > 0) {
            displayRecipes(filteredAndSortedRecipes);
        } else {
            recipeListContainer.innerHTML = '<p>Ingen opskrifter matcher din søgning.</p>';
        }
    }

    // --- Event Listeners and Initial Load ---
    if (searchInput) { // Changed from searchForm to searchInput
        searchInput.addEventListener('input', handleSearch); // Changed from 'submit' to 'input'
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalContainer) {
        modalContainer.addEventListener('click', (event) => {
            if (event.target === modalContainer) { // Click on overlay
                closeModal();
            }
        });
    }

    // Global Escape key listener for modal
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modalContainer.classList.contains('show')) {
            closeModal();
        }
    });

    // Fetch recipes on page load
    getRecipes();
});