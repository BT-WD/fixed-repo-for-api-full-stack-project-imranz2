const API_URL = "https://www.themealdb.com/api/json/v1/1";
let currentMeal = null;

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

function showLoader(on) {
    document.getElementById("loader").style.display = on ? "flex" : "none";
}
function showError() { document.getElementById("error-box").style.display = "block"; }
function hideError() { document.getElementById("error-box").style.display = "none"; }