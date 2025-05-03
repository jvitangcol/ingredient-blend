// DOM elements on landing page
const generateButton = document.getElementById("recipeBtn");
const ingredientsInput = document.getElementById("ingredients");

//allow only letters, spaces, and commas
ingredientsInput.addEventListener("input", function () {
  const value = ingredientsInput.value;

  ingredientsInput.value = value.replace(/[^a-zA-Z,\s]/g, "");

  if (value.trim() === "") {
    generateButton.disabled = true;
  } else {
    generateButton.disabled = false;
  }
});

generateButton.addEventListener("click", () => {
  findByIngredients();
});

// Display All Recipes
function displayAllRecipes() {
  const recipeCardElement = document.getElementById("recipeCard");

  let outputRecipes = "";

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);

    let valueObject;

    try {
      valueObject = JSON.parse(value);
    } catch (error) {
      console.error("Invalid JSON in localStorage for key ", key, error);
      continue;
    }

    outputRecipes += `<div class="recipe__card">
              <img src="${valueObject.image}" id="${valueObject.id}" class="recipe__card-img"/>
              <h4 class="recipe__card-title">${valueObject.title}</h4>
              <p class="recipe__card-total">${valueObject.readyInMinutes}m</p>
          </div>`;
  }
  recipeCardElement.innerHTML = outputRecipes;

  const recipeCards = document.querySelectorAll(".recipe__card-img");
  recipeCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      const recipeId = e.target.id;
      viewRecipe(recipeId);
    });
  });
}

// Generate Recipe base on Ingredients
const findByIngredients = async (number = 1) => {
  const apiKey = "5bb6a7b4f47d4880b0f50f8c03463b37";

  const ingredientsElement = document
    .getElementById("ingredients")
    .value.toLowerCase();

  // query parameters
  const params = new URLSearchParams({
    ingredients: ingredientsElement,
    number: number.toString(),
    apiKey: apiKey,
  });

  // full URL
  const apiUrl = `https://api.spoonacular.com/recipes/findByIngredients?${params.toString()}`;

  // Use fetch to send the request
  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      alert("You have reached your limit on your daily usage");
      throw new Error("You have reached your limit on your daily usage");
    }

    const rawData = await response.text();

    let data;

    try {
      data = JSON.parse(rawData);
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      throw new Error("Invalid API response format");
    }

    const recipeIds = data.map((recipe) => recipe.id);
    const recipesInfo = await Promise.all(
      recipeIds.map((id) => getRecipeInformation(id))
    );
    const recipe = recipesInfo[0];

    localStorage.setItem(`${recipe.id}`, JSON.stringify(recipe));
    displayAllRecipes();
  } catch (error) {
    console.error("Error fetching recipes:", error);
  }
};

// Getting All Information of the Recipe
const getRecipeInformation = async (id) => {
  const apiKey = "5bb6a7b4f47d4880b0f50f8c03463b37";
  const apiUrl = `https://api.spoonacular.com/recipes/${id}/information?apiKey=${apiKey}&includeNutrition=true`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Recipe not found");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching recipe information", error);
  }
};

// View single recipe
const viewRecipe = async (id) => {
  const storedRecipe = (() => {
    try {
      return JSON.parse(localStorage.getItem(`${id}`));
    } catch (error) {
      console.error("Error parsing recipe data:", error);
      return null;
    }
  })();

  if (!storedRecipe) {
    console.error(`No recipe found for id: ${id}`);
    return;
  }

  const modalElements = {
    modal: document.getElementById("recipeModal"),
    closeModal: document.querySelector(".recipeModal__closeBtn"),
    deleteModal: document.querySelector(".recipeModal__deleteBtn"),
    imgElement: document.getElementById("image"),
    titleElement: document.getElementById("recipeTitle"),
    totalElement: document.getElementById("total"),
    ingredientTitleElement: document.getElementById("recipeIngredientTitle"),
    exIngredientsElement: document.getElementById("recipeIngredients"),
    instructionTitleElement: document.getElementById("recipeInstructionTitle"),
    instructionElement: document.getElementById("recipeInstruction"),
    nutritionTitleElement: document.getElementById("recipeNutritionTitle"),
    nutritionElement: document.getElementById("recipeNutrition"),
  };

  openAndSetupModal(modalElements, id);
  populateModalContent(modalElements, storedRecipe);
};

const openAndSetupModal = (modalElements, id) => {
  const { modal, closeModal, deleteModal } = modalElements;

  const closeModalHandler = () => modal.close();
  const deleteModalHandler = () => deleteRecipe(id, modal);

  closeModal.removeEventListener("click", closeModalHandler);
  deleteModal.removeEventListener("click", deleteModalHandler);

  closeModal.addEventListener("click", closeModalHandler);
  deleteModal.dataset.id = id;
  deleteModal.addEventListener("click", deleteModalHandler);

  modal.showModal();
};

const populateModalContent = (modalElements, recipe) => {
  const {
    imgElement,
    titleElement,
    totalElement,
    ingredientTitleElement,
    exIngredientsElement,
    instructionTitleElement,
    instructionElement,
    nutritionTitleElement,
    nutritionElement,
  } = modalElements;

  imgElement.src = recipe.image || "";
  titleElement.innerHTML = recipe.title || "No title available";
  totalElement.innerHTML = `${recipe.readyInMinutes || "N/A"}m`;

  ingredientTitleElement.innerHTML = "Ingredients";
  exIngredientsElement.innerHTML = formatIngredients(
    recipe.extendedIngredients || []
  );

  instructionTitleElement.innerHTML = "Instructions";
  instructionElement.innerHTML = formatInstructions(
    recipe.analyzedInstructions || []
  );

  nutritionTitleElement.innerHTML = "Nutrition";
  nutritionElement.innerHTML = formatNutritions(
    recipe.nutrition?.nutrients || []
  );
};

const deleteRecipe = (id, modal) => {
  localStorage.removeItem(`${id}`);

  const recipeCard = document.querySelector(
    `#recipeCard img[id="${id}"]`
  ).parentElement;
  if (recipeCard) recipeCard.remove();

  modal.close();
};

const formatIngredients = (ingredients) =>
  ingredients.length
    ? ingredients
        .map(
          (item) =>
            `<li class="recipe__ingredient-list-item"><strong>${item.amount} ${item.unit}</strong> <p>${item.originalName}</p></li>`
        )
        .join("")
    : "<p>No ingredients available.</p>";

const formatInstructions = (instructions) =>
  instructions.length && instructions[0]?.steps
    ? instructions[0].steps
        .map(
          (step) =>
            `<li class="recipe__instruction-list-item"><strong>${step.number}</strong> <p>${step.step}</p></li>`
        )
        .join("")
    : "<p>No instructions available.</p>";

const formatNutritions = (nutrients) => {
  const relevantNutrients = [
    "Calories",
    "Fat",
    "Saturated Fat",
    "Carbohydrates",
    "Sugar",
    "Cholesterol",
    "Sodium",
    "Protein",
    "Fiber",
  ];
  return nutrients.length
    ? nutrients
        .filter((nutrient) => relevantNutrients.includes(nutrient.name))
        .map(
          (nutrient) =>
            `<li class="recipe__nutrition-list-item"><strong>${nutrient.name}</strong> <p>${nutrient.amount}${nutrient.unit}</p></li>`
        )
        .join("")
    : "<p>No nutrition data available.</p>";
};
