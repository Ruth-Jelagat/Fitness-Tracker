// Base API URL
const API_URL = "http://localhost:3000";

// Use of DOM Elements 
const mealsContainer = document.getElementById("meals");
const workoutsContainer = document.getElementById("workouts");
const form = document.getElementById("userForm");

const progressForm = document.getElementById("progressForm");
const progressDateInput = document.getElementById("progressDate");
const progressValueInput = document.getElementById("progressValue");
const chartCanvas = document.getElementById("progressChart").getContext("2d");

let progressChart = null;  

function createCard(item, type) {
  const imageUrl = item.image || "https://via.placeholder.com/300x200?text=No+Image";

  const card = document.createElement("div");
  card.classList.add("card");

  const content = `
    <img src="${imageUrl}" alt="${item.name}">
    <div class="card-content">
      <h3>${item.name}</h3>
      ${
        type === "meal"
          ? `<p><strong>Calories:</strong> ${item.calories}</p>`
          : `<p><strong>Duration:</strong> ${item.duration}</p>
             <p><strong>Calories Burned:</strong> ${item.caloriesBurned} kcal</p>`
      }
    </div>
  `;

  card.innerHTML = content;
  return card;
}

// Used to fetch the meals images
async function fetchMealImage(mealName) {
  const fallback = "https://via.placeholder.com/300x200?text=No+Image";
  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(mealName)}`
    );
    const data = await res.json();
    if (data.meals && data.meals[0] && data.meals[0].strMealThumb) {
      return data.meals[0].strMealThumb;
    }
  } catch (err) {
    console.error("Error fetching meal image:", err);
  }
  return fallback;
}

async function loadMeals(goal) {
  try {
    const res = await fetch(`${API_URL}/meals`);
    let meals = await res.json();
    meals = meals.filter((meal) => meal.goal === goal);
    mealsContainer.innerHTML = "";

    for (const meal of meals) {
      if (!meal.image) {
        meal.image = await fetchMealImage(meal.name);
      }
      const card = createCard(meal, "meal");
      mealsContainer.appendChild(card);
    }
  } catch (err) {
    console.error("Error loading meals:", err);
  }
}

// Used for uploading workout images
async function loadWorkouts(goal) {
  try {
    const res = await fetch(`${API_URL}/workouts`);
    let workouts = await res.json();

    workouts = workouts.filter((w) => w.goal === goal);

    workoutsContainer.innerHTML = "";
    workouts.forEach((workout) => {
     
      if (!workout.image) {
        workout.image = "https://via.pexels.com/300x200?text=Workout";
      }
      const card = createCard(workout, "workout");
      workoutsContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading workouts:", err);
  }
}

// Used to get user details
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const goal = document.getElementById("goal").value;

  if (!name || !goal) {
    alert("Please enter your name and select a goal.");
    return;
  }

  alert(`Hi ${name}! 🎉 Here's your plan to ${goal} weight.`);
  loadMeals(goal);
  loadWorkouts(goal);
});

// Used for fetching progress data persistence
function getStoredProgress() {
  const raw = localStorage.getItem("progressEntries");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function storeProgress(entries) {
  localStorage.setItem("progressEntries", JSON.stringify(entries));
}

// Used when one wants to input a new progress entry 
progressForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const date = progressDateInput.value;
  const value = parseFloat(progressValueInput.value);
  if (!date || isNaN(value)) {
    alert("Please enter a valid date and numeric value");
    return;
  }

  const entries = getStoredProgress();
  entries.push({ date, value });
  entries.sort((a, b) => new Date(a.date) - new Date(b.date));

  storeProgress(entries);
  progressDateInput.value = "";
  progressValueInput.value = "";

  renderChart(entries);
});

// Represents the Chart 
function renderChart(entries) {
  const labels = entries.map((e) => e.date);
  const dataValues = entries.map((e) => e.value);

  const config = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Progress",
          data: dataValues,
          borderColor: "rgb(46,125,50)",
          backgroundColor: "rgba(46,125,50,0.2)",
          tension: 0.2,
        },
      ],
    },
    options: {
      scales: {
        x: {
          title: {
            display: true,
            text: "Date",
          },
        },
        y: {
          title: {
            display: true,
            text: "Value",
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  };

  if (progressChart) {
    progressChart.data.labels = labels;
    progressChart.data.datasets[0].data = dataValues;
    progressChart.update();
  } else {
    progressChart = new Chart(chartCanvas, config);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const entries = getStoredProgress();
  if (entries.length > 0) {
    renderChart(entries);
  }
});

