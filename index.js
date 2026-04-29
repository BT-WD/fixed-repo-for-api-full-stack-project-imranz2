const API_URL = "https://www.themealdb.com/api/json/v1/1";
let currentMeal = null;

window.addEventListener("DOMContentLoaded", function() {
    updateFavCount();
    renderFavList();
});

async function fetchRandomMeal() {
    showLoader(true);
    hideError();
    resetDisplay();
    try {
        let response = await fetch(API_URL + "/random.php");
        if (!response.ok) throw new Error("Request failed: " + response.status);
        let data = await response.json();
        console.log("API response:", data);
        currentMeal = data.meals[0];
        displayMeal(currentMeal);
    } catch (error) {
        console.error("Error fetching meal:", error);
        showError();
    }
    showLoader(false);
}

async function searchMeal() {
    let query = document.getElementById("search-input").value.trim();
    if (!query) return;
    showLoader(true);
    hideError();
    document.getElementById("search-clear").style.display = "block";
    try {
        let response = await fetch(API_URL + "/search.php?s=" + encodeURIComponent(query));
        if (!response.ok) throw new Error("Search failed: " + response.status);
        let data = await response.json();
        console.log("Search results:", data);
        showSearchResults(data.meals);
    } catch (error) {
        console.error("Error searching:", error);
        showError();
    }
    showLoader(false);
}

function showSearchResults(meals) {
    let box = document.getElementById("search-results");
    box.innerHTML = "";
    if (!meals || meals.length === 0) {
        box.innerHTML = "<div class='search-no-results'>No meals found. Try a different name!</div>";
        box.style.display = "block";
        return;
    }
    meals.forEach(function(meal) {
        let item = document.createElement("div");
        item.className = "search-result-item";
        item.innerHTML =
            "<img src='" + meal.strMealThumb + "/preview' alt='" + meal.strMeal + "'/>" +
            "<div><strong>" + meal.strMeal + "</strong><span>" + meal.strCategory + " · " + meal.strArea + "</span></div>";
        item.addEventListener("click", function() {
            currentMeal = meal;
            displayMeal(meal);
            document.getElementById("search-results").style.display = "none";
            document.getElementById("search-input").value = meal.strMeal;
        });
        box.appendChild(item);
    });
    box.style.display = "block";
}

function handleSearchKey(event) {
    if (event.key === "Enter") searchMeal();
}

function clearSearch() {
    document.getElementById("search-input").value = "";
    document.getElementById("search-results").style.display = "none";
    document.getElementById("search-clear").style.display = "none";
}

function displayMeal(meal) {
    document.getElementById("meal-name").textContent = meal.strMeal;
    document.getElementById("meal-category").textContent = meal.strCategory;
    document.getElementById("meal-area-tag").textContent = meal.strArea;
    document.getElementById("meal-instructions").textContent = meal.strInstructions;
    let yt = document.getElementById("meal-yt");
    yt.href = meal.strYoutube;
    yt.style.display = meal.strYoutube ? "flex" : "none";
    let list = document.getElementById("ingredient-list");
    list.innerHTML = "";
    for (let i = 1; i <= 20; i++) {
        let ingredient = meal["strIngredient" + i];
        let measure = meal["strMeasure" + i];
        if (ingredient && ingredient.trim() !== "") {
            let li = document.createElement("li");
            li.innerHTML = "<span>" + ingredient + "</span><span class='measure'>" + measure + "</span>";
            list.appendChild(li);
        }
    }
    let photo = document.getElementById("meal-pic");
    photo.src = meal.strMealThumb;
    photo.alt = meal.strMeal;
    photo.style.display = "block";
    document.getElementById("pic-empty").style.display = "none";
    updateSaveButton();
    document.getElementById("meal-empty").style.display = "none";
    document.getElementById("meal-content").style.display = "block";
    console.log("Displayed meal:", meal.strMeal);
}

function togglePanel(panelId, button) {
    if (!currentMeal) return;
    let panel = document.getElementById(panelId);
    let isOpen = panel.style.display !== "none";
    panel.style.display = isOpen ? "none" : "block";
    button.classList.toggle("active-panel", !isOpen);
}

function getFavorites() {
    let stored = localStorage.getItem("rmg_favorites");
    return stored ? JSON.parse(stored) : [];
}

function saveFavorites(favList) {
    localStorage.setItem("rmg_favorites", JSON.stringify(favList));
    updateFavCount();
    renderFavList();
}

function isFavorited(mealId) {
    return getFavorites().some(function(fav) { return fav.idMeal === mealId; });
}

function toggleFavorite() {
    if (!currentMeal) return;
    let favorites = getFavorites();
    if (isFavorited(currentMeal.idMeal)) {
        favorites = favorites.filter(function(fav) { return fav.idMeal !== currentMeal.idMeal; });
    } else {
        favorites.push({
            idMeal: currentMeal.idMeal,
            strMeal: currentMeal.strMeal,
            strMealThumb: currentMeal.strMealThumb,
            strCategory: currentMeal.strCategory,
            strArea: currentMeal.strArea
        });
    }
    saveFavorites(favorites);
    updateSaveButton();
}

function updateSaveButton() {
    let button = document.getElementById("save-btn");
    if (!currentMeal) return;
    if (isFavorited(currentMeal.idMeal)) {
        button.textContent = "❤️ Saved!";
        button.classList.add("saved");
    } else {
        button.textContent = "🤍 Save Meal";
        button.classList.remove("saved");
    }
}

function updateFavCount() {
    document.getElementById("fav-count").textContent = getFavorites().length;
}

function resetFavorites() {
    if (!confirm("Remove all saved favorites?")) return;
    localStorage.removeItem("rmg_favorites");
    updateFavCount();
    renderFavList();
    if (currentMeal) updateSaveButton();
}

function renderFavList() {
    let favorites = getFavorites();
    let list = document.getElementById("fav-list");
    let empty = document.getElementById("fav-empty");
    list.innerHTML = "";
    if (favorites.length === 0) { empty.style.display = "flex"; return; }
    empty.style.display = "none";
    favorites.forEach(function(meal) {
        let item = document.createElement("div");
        item.className = "fav-item";
        item.innerHTML =
            "<img src='" + meal.strMealThumb + "' alt='" + meal.strMeal + "'/>" +
            "<div class='fav-item-info'><strong>" + meal.strMeal + "</strong><span>" + meal.strCategory + " · " + meal.strArea + "</span></div>" +
            "<button class='fav-rm' onclick='removeFav(\"" + meal.idMeal + "\", event)'>✕</button>";
        item.addEventListener("click", function(e) {
            if (e.target.classList.contains("fav-rm")) return;
            fetchById(meal.idMeal);
        });
        list.appendChild(item);
    });
}

function removeFav(mealId, event) {
    event.stopPropagation();
    saveFavorites(getFavorites().filter(function(fav) { return fav.idMeal !== mealId; }));
    if (currentMeal) updateSaveButton();
}

async function fetchById(mealId) {
    showLoader(true);
    hideError();
    resetDisplay();
    try {
        let response = await fetch(API_URL + "/lookup.php?i=" + mealId);
        if (!response.ok) throw new Error("Request failed: " + response.status);
        let data = await response.json();
        currentMeal = data.meals[0];
        displayMeal(currentMeal);
    } catch (error) {
        console.error("Error fetching meal by ID:", error);
        showError();
    }
    showLoader(false);
}

function resetDisplay() {
    document.getElementById("meal-empty").style.display = "flex";
    document.getElementById("meal-content").style.display = "none";
    document.getElementById("ingredients-panel").style.display = "none";
    document.getElementById("instructions-panel").style.display = "none";
    document.getElementById("btn-instructions").classList.remove("active-panel");
    document.getElementById("btn-ingredients").classList.remove("active-panel");
}

function showLoader(on) { document.getElementById("loader").style.display = on ? "flex" : "none"; }
function showError() { document.getElementById("error-box").style.display = "block"; }
function hideError() { document.getElementById("error-box").style.display = "none"; }
