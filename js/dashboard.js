document.addEventListener('DOMContentLoaded', function () {

    const userData = {
        name: "Alex",
        summary: {
            calories: { consumed: 1250, goal: 2000, color: "#27ae60" },
            protein: { consumed: 40, goal: 120, color: "#2980b9" },
            carbs: { consumed: 150, goal: 250, color: "#f39c12" },
        },
        todaysMeals: [
            { name: "Oatmeal & Berries", calories: 350, img: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=100&auto=format&fit=crop" },
            { name: "Chicken Salad", calories: 450, img: "https://images.unsplash.com/photo-1551248429-40974013e521?q=80&w=100&auto=format&fit=crop" },
            { name: "Apple & Peanut Butter", calories: 280, img: "https://images.unsplash.com/photo-1636402432928-3905553a6f1d?q=80&w=100&auto=format&fit=crop" },
            { name: "Avocado Toast", calories: 320, img: "https://images.unsplash.com/photo-1584917865416-932141208130?q=80&w=100&auto=format&fit=crop" }
        ]
    };

    // --- SIDEBAR TOGGLE LOGIC ---
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if(sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-collapsed');
        });
    }

    // --- DYNAMIC GREETING ---
    const greetingElement = document.getElementById('dynamic-greeting');
    if (greetingElement) {
        const currentHour = new Date().getHours();
        let greeting = "Good Morning";
        if (currentHour >= 12 && currentHour < 17) greeting = "Good Afternoon";
        if (currentHour >= 17) greeting = "Good Evening";
        greetingElement.textContent = `${greeting}, ${userData.name}!`;
    }

    // --- RENDER RADIAL PROGRESS BARS ---
    function renderRadialProgress() {
        const radialContainer = document.getElementById('radial-summaries');
        if (!radialContainer) {
            console.error("Error: The 'radial-summaries' container was not found in the HTML.");
            return;
        }
        
        radialContainer.innerHTML = '';
        for (const key in userData.summary) {
            const metric = userData.summary[key];
            const progress = (metric.consumed / metric.goal) * 100;
            const radialBar = document.createElement('div');
            radialBar.className = 'radial-progress';
            
            const arc = document.createElement('div');
            arc.className = 'radial-progress-arc';
            arc.style.setProperty('--color', metric.color);

            radialBar.innerHTML = `
                <div class="radial-progress-inner">
                    <span class="radial-progress-text">${metric.consumed}</span>
                    <span class="radial-progress-label">${key}</span>
                </div>
            `;
            radialBar.appendChild(arc);
            radialContainer.appendChild(radialBar);

            setTimeout(() => {
                arc.style.setProperty('--progress', progress);
            }, 200);
        }
    }

    // --- RENDER DAILY FOCUS CARD ---
    function renderFocusCard() {
        const focusContainer = document.getElementById('daily-focus-card');
        if (!focusContainer) return;

        let lowestProgress = { key: '', value: 101 };
        for (const key in userData.summary) {
            if (key === 'calories') continue;
            const metric = userData.summary[key];
            const progress = (metric.consumed / metric.goal) * 100;
            if (progress < lowestProgress.value) {
                lowestProgress = { key: key, value: progress, remaining: metric.goal - metric.consumed };
            }
        }
        
        focusContainer.innerHTML = `
            <div class="card-header"><h3>Your Daily Focus</h3></div>
            <p style="margin-bottom: auto;">To stay balanced, prioritize your <strong>${lowestProgress.key}</strong> intake.</p>
            <p class="focus-value" style="font-size: 2rem; font-weight: 800; color: var(--dark-green);">You need ${lowestProgress.remaining}g more</p>
        `;
    }

    // --- RENDER MEAL LOG ---
    function renderMealLog() {
        const mealLogContainer = document.getElementById('meal-log-container');
        if (!mealLogContainer) {
             console.error("Error: The 'meal-log-container' was not found in the HTML.");
            return;
        }

        mealLogContainer.innerHTML = '';
        userData.todaysMeals.forEach(meal => {
            const mealItem = document.createElement('div');
            mealItem.className = 'meal-item';
            mealItem.innerHTML = `
                <div class="meal-item-info">
                    <img src="${meal.img}" alt="${meal.name}">
                    <div>
                        <strong>${meal.name}</strong>
                    </div>
                </div>
                <span class="meal-item-calories">${meal.calories} kcal</span>
            `;
            mealLogContainer.appendChild(mealItem);
        });
    }

    // --- RENDER CHART ---
    function renderChart() {
        const ctx = document.getElementById('weekly-chart')?.getContext('2d');
        if (ctx) {
            const gradient = ctx.createLinearGradient(0, 0, 0, 150);
            gradient.addColorStop(0, 'rgba(46, 204, 113, 0.5)');
            gradient.addColorStop(1, 'rgba(46, 204, 113, 0)');
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Calories',
                        data: [1800, 2100, 1950, 2200, 2000, 2400, 1900],
                        borderColor: 'var(--dark-green)',
                        backgroundColor: gradient,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: 'var(--dark-green)',
                        pointHoverRadius: 7,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { ticks: { color: 'var(--text-secondary)' }, grid: { color: 'rgba(0,0,0,0.05)' } },
                        x: { ticks: { color: 'var(--text-secondary)' }, grid: { display: false } }
                    }
                }
            });
        }
    }

    // Execute all render functions
    renderRadialProgress();
    renderFocusCard();
    renderMealLog();
    renderChart();
});