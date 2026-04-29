const API_URL = "https://www.themealdb.com/api/json/v1/1";
let currentMeal = null;

window.addEventListener("DOMContentLoaded", function() {
    updateFavCount();
    renderFavList();
});

async function fetchRandomMeal() {
    showLoader(true);
    hideError();
    document.getElementById("meal-empty").style.display = "flex";
    document.getElementById("meal-content").style.display = "none";
    document.getElementById("ingredients-panel").style.display = "none";
    document.getElementById("instructions-panel").style.display = "none";
    document.getElementById("btn-instructions").classList.remove("active-panel");
    document.getElementById("btn-ingredients").classList.remove("active-panel");

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

function displayMeal(meal) {
    document.getElementById("meal-name").textContent = meal.strMeal;
    document.getElementById("meal-category").textContent = meal.strCategory;
    document.getElementById("meal-area-tag").textContent = meal.strArea;
    document.getElementById("meal-instructions").textContent = meal.strInstructions;

    let ytButton = document.getElementById("meal-yt");
    ytButton.href = meal.strYoutube;
    ytButton.style.display = meal.strYoutube ? "flex" : "none";

    let ingredientList = document.getElementById("ingredient-list");
    ingredientList.innerHTML = "";
    for (let i = 1; i <= 20; i++) {
        let ingredient = meal["strIngredient" + i];
        let measure = meal["strMeasure" + i];
        if (ingredient && ingredient.trim() !== "") {
            let li = document.createElement("li");
            li.innerHTML = "<span>" + ingredient + "</span><span class='measure'>" + measure + "</span>";
            ingredientList.appendChild(li);
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

    if (favorites.length === 0) {
        empty.style.display = "flex";
        return;
    }
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
    document.getElementById("meal-empty").style.display = "flex";
    document.getElementById("meal-content").style.display = "none";
    document.getElementById("ingredients-panel").style.display = "none";
    document.getElementById("instructions-panel").style.display = "none";
    document.getElementById("btn-instructions").classList.remove("active-panel");
    document.getElementById("btn-ingredients").classList.remove("active-panel");

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

function showLoader(on) {
    document.getElementById("loader").style.display = on ? "flex" : "none";
}
function showError() { document.getElementById("error-box").style.display = "block"; }
function hideError() { document.getElementById("error-box").style.display = "none"; }
