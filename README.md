# Madplan

Madplan is a web application designed for managing and browsing recipes. It features a user-friendly interface for viewing recipes and a comprehensive admin panel for creating, updating, and deleting recipes.

## Features

**User Interface (`index.html`):**
*   Browse and view a list of recipes.
*   View detailed recipe information (image, description, ingredients, instructions) in a modal.
*   Placeholder functionality for searching recipes by ingredients.
*   Placeholder filter buttons for "Populære," "Top Opskrifter," and "Nyeste" recipes.

**Admin Panel (`admin.html`):**
*   Secure area for managing recipe data.
*   Add new recipes with details such_as title, category, image URL, description, ingredients (name, amount, unit), and instructions.
*   Edit existing recipes.
*   Delete recipes.
*   Dynamic forms for adding multiple ingredients and instruction steps.
*   Ingredient name input uses [Tom Select](https://tom-select.js.org/) with suggestions populated from `ingredients.json` for consistency and ease of use.

## Technologies Used

*   **Frontend:** HTML5, CSS3, JavaScript (ES6+)
*   **Libraries:**
    *   [Tom Select](https://tom-select.js.org/): Used in the admin panel for advanced select input for ingredients.
*   **Backend API:** The application interacts with a custom backend API hosted at `https://smart-recipe-api.onrender.com` for recipe data storage and retrieval.
*   **Data Files:**
    *   `ingredients.json`: A local JSON file containing a master list of food item names ("FødevareNavn"). This file is used by the admin panel to provide suggestions for ingredient names when adding or editing recipes, ensuring data consistency.

## Setup and Running

1.  **Frontend:**
    *   Clone the repository.
    *   To view the user-facing application, open `index.html` in a web browser.
    *   To access the admin panel, open `admin.html` in a web browser.
2.  **Backend:**
    *   The application relies on the backend API at `https://smart-recipe-api.onrender.com`. Ensure this API is operational for full functionality. (No setup required for the API on the client-side as it's a live service).

## Live Application

*   [Link to your live application (if deployed)](YOUR_LIVE_APPLICATION_URL_HERE)

## File Structure Overview

*   `index.html`: The main page for users to browse recipes.
*   `script.js`: JavaScript for the user-facing `index.html`. Handles recipe fetching, display, and modal interaction.
*   `style.css`: Main stylesheet for `index.html`.
*   `admin.html`: The admin panel for recipe management.
*   `admin.js`: JavaScript for the `admin.html` panel. Handles CRUD operations, modal forms, and interaction with Tom Select.
*   `admin.css`: Stylesheet specifically for the `admin.html` panel.
*   `ingredients.json`: Contains a list of Danish food names used to populate ingredient suggestions in the admin panel.
*   `README.md`: This file.
