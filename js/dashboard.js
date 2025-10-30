// Initialize Supabase client
const SUPABASE_URL = window.SUPABASE_URL || 'https://dueaxivhontzkvsiwcjc.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Your public anon key from Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check authentication status
async function checkAuth() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

// Fetch user profile
async function fetchUserProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
}

document.addEventListener('DOMContentLoaded', async function () {
    // Test Supabase connection
    try {
        const { data, error } = await supabase.from('profiles').select('count').single();
        if (error) {
            console.error('Supabase connection error:', error);
            alert('Error connecting to database. Please check console for details.');
        } else {
            console.log('Successfully connected to Supabase');
        }
    } catch (err) {
        console.error('Fatal error connecting to Supabase:', err);
        alert('Error connecting to database. Please check console for details.');
    }

    // Check authentication and get user profile
    const user = await checkAuth();
    if (!user) {
        console.log('No authenticated user found');
        return;
    }

    const profile = await fetchUserProfile(user.id);
    
    // Update profile display
    const sidebarUsername = document.getElementById('sidebar-username');
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    if (profile) {
        sidebarUsername.textContent = profile.full_name || user.email.split('@')[0];
        if (profile.avatar_url) {
            sidebarAvatar.src = profile.avatar_url;
        }
    }

    // Handle sign out
    const signoutBtn = document.getElementById('signout-btn');
    signoutBtn?.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            // Clear local storage
            localStorage.removeItem(`nutriDashUserData_${user.id}`);
            window.location.href = 'login.html';
        }
    });
    
    // Default user data structure
    const defaultUserData = {
        name: "Alex",
        summary: {
            calories: { consumed: 0, goal: 2000, color: "#27ae60" },
            protein: { consumed: 0, goal: 120, color: "#2980b9" },
            carbs: { consumed: 0, goal: 250, color: "#f39c12" },
        },
        todaysMeals: [],
        waterIntake: 0,
        weeklyData: {
            calories: [],
            protein: [],
            carbs: [],
            water: []
        },
        lastUpdated: null
    };

    // Load user data from localStorage or use default
    let userData = loadUserData();

    // Data persistence functions
    function loadUserData() {
        const storedData = localStorage.getItem('nutriDashUserData');
        if (!storedData) {
            return defaultUserData;
        }

        const data = JSON.parse(storedData);
        const lastUpdated = new Date(data.lastUpdated);
        const now = new Date();

        // Check if it's a new day
        if (!lastUpdated || lastUpdated.toDateString() !== now.toDateString()) {
            // Store yesterday's totals in weekly data
            if (data.summary) {
                updateWeeklyData(data);
            }
            // Reset daily totals
            return {
                ...data,
                summary: {
                    calories: { ...data.summary.calories, consumed: 0 },
                    protein: { ...data.summary.protein, consumed: 0 },
                    carbs: { ...data.summary.carbs, consumed: 0 }
                },
                todaysMeals: [],
                waterIntake: 0,
                lastUpdated: now.toISOString()
            };
        }

        return data;
    }

    function updateWeeklyData(data) {
        // Add yesterday's totals to weekly data
        const metrics = ['calories', 'protein', 'carbs'];
        metrics.forEach(metric => {
            data.weeklyData[metric] = data.weeklyData[metric] || [];
            data.weeklyData[metric].push(data.summary[metric].consumed);
            // Keep only last 7 days
            if (data.weeklyData[metric].length > 7) {
                data.weeklyData[metric].shift();
            }
        });

        // Update water data
        data.weeklyData.water = data.weeklyData.water || [];
        data.weeklyData.water.push(data.waterIntake);
        if (data.weeklyData.water.length > 7) {
            data.weeklyData.water.shift();
        }
    }

    async function saveUserData() {
        const user = await checkAuth();
        if (!user) return;

        userData.lastUpdated = new Date().toISOString();
        
        // Save to local storage for immediate access
        localStorage.setItem(`nutriDashUserData_${user.id}`, JSON.stringify(userData));

        // Save to Supabase
        const { error } = await supabase
            .from('user_data')
            .upsert({
                user_id: user.id,
                data: userData,
                updated_at: userData.lastUpdated
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            console.error('Error saving data:', error);
        }
    }

    // Load user data from Supabase
    async function loadUserDataFromSupabase(userId) {
        const { data, error } = await supabase
            .from('user_data')
            .select('data')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Error loading data:', error);
            return null;
        }

        return data?.data;
    }

    // Enhanced loadUserData function
    async function loadUserData() {
        const user = await checkAuth();
        if (!user) return defaultUserData;

        // Try to get data from local storage first
        const localData = localStorage.getItem(`nutriDashUserData_${user.id}`);
        let data = localData ? JSON.parse(localData) : null;

        // If no local data, try to get from Supabase
        if (!data) {
            data = await loadUserDataFromSupabase(user.id);
        }

        // If still no data, use default
        if (!data) {
            return defaultUserData;
        }

        const lastUpdated = new Date(data.lastUpdated);
        const now = new Date();

        // Check if it's a new day
        if (!lastUpdated || lastUpdated.toDateString() !== now.toDateString()) {
            // Store yesterday's totals in weekly data
            if (data.summary) {
                updateWeeklyData(data);
            }
            // Reset daily totals
            return {
                ...data,
                summary: {
                    calories: { ...data.summary.calories, consumed: 0 },
                    protein: { ...data.summary.protein, consumed: 0 },
                    carbs: { ...data.summary.carbs, consumed: 0 }
                },
                todaysMeals: [],
                waterIntake: 0,
                lastUpdated: now.toISOString()
            };
        }

        return data;
    }

    // Save data on page unload
    window.addEventListener('beforeunload', () => {
        saveUserData();
    });

    // Auto-save every minute
    setInterval(saveUserData, 60000);

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
        userData.todaysMeals.forEach((meal, index) => {
            const mealItem = document.createElement('div');
            mealItem.className = 'meal-item';
            mealItem.innerHTML = `
                <div class="meal-item-info">
                    <img src="${meal.img}" alt="${meal.name}">
                    <div>
                        <strong>${meal.name}</strong>
                    </div>
                </div>
                <div class="meal-item-controls">
                    <span class="meal-item-calories">${meal.calories} kcal</span>
                    <button class="meal-item-delete" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;

            // Add click handler for delete button
            const deleteBtn = mealItem.querySelector('.meal-item-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mealIndex = parseInt(deleteBtn.dataset.index);
                const deletedMeal = userData.todaysMeals[mealIndex];
                
                // Update nutrition summary
                userData.summary.calories.consumed -= deletedMeal.calories;
                if (deletedMeal.protein) userData.summary.protein.consumed -= deletedMeal.protein;
                if (deletedMeal.carbs) userData.summary.carbs.consumed -= deletedMeal.carbs;

                // Remove meal from array
                userData.todaysMeals.splice(mealIndex, 1);
                
                // Update UI
                renderMealLog();
                renderRadialProgress();
                renderFocusCard();
            });

            // Add click handler for meal item
            mealItem.addEventListener('click', () => {
                showMealDetails(meal);
            });

            mealLogContainer.appendChild(mealItem);
        });
    }

    // --- RENDER CHART ---
    function renderChart() {
        const ctx = document.getElementById('weekly-chart')?.getContext('2d');
        if (!ctx) return;

        // Sample weekly data (in production, this would come from a backend)
        const weeklyData = {
            calories: [1800, 2100, 1950, 2200, 2000, 2400, userData.summary.calories.consumed],
            protein: [95, 110, 85, 105, 90, 115, userData.summary.protein.consumed],
            carbs: [220, 240, 200, 260, 230, 250, userData.summary.carbs.consumed],
            water: [1800, 2000, 1500, 2200, 1900, 2100, userData.waterIntake]
        };

        // Create gradients
        const caloriesGradient = ctx.createLinearGradient(0, 0, 0, 150);
        caloriesGradient.addColorStop(0, 'rgba(46, 204, 113, 0.5)');
        caloriesGradient.addColorStop(1, 'rgba(46, 204, 113, 0)');

        const proteinGradient = ctx.createLinearGradient(0, 0, 0, 150);
        proteinGradient.addColorStop(0, 'rgba(41, 128, 185, 0.5)');
        proteinGradient.addColorStop(1, 'rgba(41, 128, 185, 0)');

        const carbsGradient = ctx.createLinearGradient(0, 0, 0, 150);
        carbsGradient.addColorStop(0, 'rgba(243, 156, 18, 0.5)');
        carbsGradient.addColorStop(1, 'rgba(243, 156, 18, 0)');

        // Chart configuration
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Calories',
                        data: weeklyData.calories,
                        borderColor: '#27ae60',
                        backgroundColor: caloriesGradient,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#27ae60',
                        pointHoverRadius: 7,
                    },
                    {
                        label: 'Protein',
                        data: weeklyData.protein,
                        borderColor: '#2980b9',
                        backgroundColor: proteinGradient,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#2980b9',
                        pointHoverRadius: 7,
                        hidden: true
                    },
                    {
                        label: 'Carbs',
                        data: weeklyData.carbs,
                        borderColor: '#f39c12',
                        backgroundColor: carbsGradient,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#f39c12',
                        pointHoverRadius: 7,
                        hidden: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            color: 'var(--text-secondary)'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#333',
                        bodyColor: '#666',
                        bodyFont: { family: 'Inter' },
                        titleFont: { family: 'Inter' },
                        padding: 12,
                        borderColor: '#ddd',
                        borderWidth: 1,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y;
                                    if (label.includes('Calories')) {
                                        label += ' kcal';
                                    } else if (label.includes('Water')) {
                                        label += ' mL';
                                    } else {
                                        label += 'g';
                                    }
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        },
                        ticks: {
                            color: 'var(--text-secondary)',
                            callback: function(value) {
                                if (value >= 1000) {
                                    return value/1000 + 'k';
                                }
                                return value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'var(--text-secondary)'
                        }
                    }
                }
            }
        });

        // Add click handlers for the legend to show/hide datasets
        const legendContainer = document.createElement('div');
        legendContainer.className = 'chart-legend';
        legendContainer.style.marginTop = '1rem';
        legendContainer.style.display = 'flex';
        legendContainer.style.justifyContent = 'center';
        legendContainer.style.gap = '1rem';

        const metrics = ['Calories', 'Protein', 'Carbs'];
        const colors = ['#27ae60', '#2980b9', '#f39c12'];

        metrics.forEach((metric, index) => {
            const btn = document.createElement('button');
            btn.className = 'legend-btn' + (index === 0 ? ' active' : '');
            btn.style.padding = '0.5rem 1rem';
            btn.style.border = `2px solid ${colors[index]}`;
            btn.style.borderRadius = '8px';
            btn.style.background = index === 0 ? colors[index] : 'none';
            btn.style.color = index === 0 ? 'white' : colors[index];
            btn.style.cursor = 'pointer';
            btn.textContent = metric;

            btn.addEventListener('click', () => {
                const isActive = btn.classList.contains('active');
                chart.getDatasetMeta(index).hidden = isActive;
                btn.classList.toggle('active');
                btn.style.background = btn.classList.contains('active') ? colors[index] : 'none';
                btn.style.color = btn.classList.contains('active') ? 'white' : colors[index];
                chart.update();
            });

            legendContainer.appendChild(btn);
        });

        // Add legend to chart container
        const chartContainer = ctx.canvas.parentElement;
        chartContainer.appendChild(legendContainer);
    }

    // --- WATER TRACKING FUNCTIONALITY ---
    const waterModal = document.getElementById('water-modal');
    const addWaterBtn = document.getElementById('add-water-btn');
    const waterAmount = document.getElementById('water-amount');
    const waterProgress = document.getElementById('water-progress');
    const decreaseWaterBtn = document.getElementById('decrease-water');
    const increaseWaterBtn = document.getElementById('increase-water');
    const addWaterConfirmBtn = document.getElementById('add-water-confirm');
    const glassSizeBtns = document.querySelectorAll('.glass-size-btn');

    let currentWaterAmount = 0;
    let selectedGlassSize = 300; // Default glass size
    const DAILY_WATER_GOAL = 2000; // 2L daily goal

    // Water Modal Controls
    addWaterBtn?.addEventListener('click', () => {
        waterModal.classList.add('visible');
        updateWaterUI();
    });

    waterModal?.querySelector('.close-modal-btn')?.addEventListener('click', () => {
        waterModal.classList.remove('visible');
    });

    // Glass Size Selection
    glassSizeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            glassSizeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedGlassSize = parseInt(btn.dataset.amount);
        });
    });

    // Water Amount Controls
    decreaseWaterBtn?.addEventListener('click', () => {
        currentWaterAmount = Math.max(0, currentWaterAmount - selectedGlassSize);
        updateWaterUI();
    });

    increaseWaterBtn?.addEventListener('click', () => {
        currentWaterAmount = Math.min(DAILY_WATER_GOAL * 1.5, currentWaterAmount + selectedGlassSize);
        updateWaterUI();
    });

    // Update Water UI
    function updateWaterUI() {
        if (waterAmount) waterAmount.textContent = currentWaterAmount;
        if (waterProgress) {
            const progress = (userData.waterIntake / DAILY_WATER_GOAL) * 100;
            waterProgress.style.width = `${progress}%`;
        }
    }

    // --- MEAL DETAILS FUNCTIONALITY ---
    const mealDetailsModal = document.getElementById('meal-details-modal');
    const mealDetailImg = document.getElementById('meal-detail-img');
    const mealDetailName = document.getElementById('meal-detail-name');
    const mealDetailNutrition = document.getElementById('meal-detail-nutrition');
    const mealNotesInput = document.getElementById('meal-notes-input');
    let currentMealIndex = -1;

    function showMealDetails(meal, index) {
        currentMealIndex = index;
        mealDetailImg.src = meal.img;
        mealDetailName.textContent = meal.name;
        
        // Display nutrition facts
        mealDetailNutrition.innerHTML = `
            <p><strong>Calories:</strong> ${meal.calories} kcal</p>
            ${meal.protein ? `<p><strong>Protein:</strong> ${meal.protein}g</p>` : ''}
            ${meal.carbs ? `<p><strong>Carbs:</strong> ${meal.carbs}g</p>` : ''}
            ${meal.fat ? `<p><strong>Fat:</strong> ${meal.fat}g</p>` : ''}
        `;

        // Set notes if they exist
        mealNotesInput.value = meal.notes || '';

        // Show modal
        mealDetailsModal.classList.add('visible');
    }

    // Close meal details modal
    mealDetailsModal?.querySelector('.close-modal-btn')?.addEventListener('click', () => {
        mealDetailsModal.classList.remove('visible');
    });

    // Update meal notes
    const updateMealBtn = mealDetailsModal?.querySelector('.update-meal-btn');
    updateMealBtn?.addEventListener('click', () => {
        if (currentMealIndex >= 0) {
            userData.todaysMeals[currentMealIndex].notes = mealNotesInput.value;
            mealDetailsModal.classList.remove('visible');
        }
    });

    // --- QUICK ADD FUNCTIONALITY ---
    const quickAddModal = document.getElementById('quick-add-modal');
    const quickAddBtn = document.querySelector('.quick-add-btn');
    const quickAddForm = document.getElementById('quick-add-form');

    // Show quick add modal
    quickAddBtn?.addEventListener('click', () => {
        quickAddModal.classList.add('visible');
        quickAddForm.reset(); // Clear form
    });

    // Close quick add modal
    quickAddModal?.querySelector('.close-modal-btn')?.addEventListener('click', () => {
        quickAddModal.classList.remove('visible');
    });

    // Handle form submission
    quickAddForm?.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get form values
        const name = document.getElementById('food-name').value;
        const calories = parseInt(document.getElementById('food-calories').value);
        const protein = parseInt(document.getElementById('food-protein').value) || 0;
        const carbs = parseInt(document.getElementById('food-carbs').value) || 0;
        const fat = parseInt(document.getElementById('food-fat').value) || 0;

            const meal = {
                name,
                calories,
                protein,
                carbs,
                fat,
                img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=100&auto=format&fit=crop", // Default food image
                timestamp: new Date().toISOString(),
                id: Date.now().toString()
            };

            // Add to today's meals
            userData.todaysMeals.unshift(meal);

            // Update nutrition summary
            userData.summary.calories.consumed += calories;
            userData.summary.protein.consumed += protein;
            userData.summary.carbs.consumed += carbs;

            // Save data
            saveUserData();        // Update UI
        renderMealLog();
        renderRadialProgress();
        renderFocusCard();
        renderChart();

        // Close modal and reset form
        quickAddModal.classList.remove('visible');
        quickAddForm.reset();
    });

    // Add Water Confirmation
    addWaterConfirmBtn?.addEventListener('click', () => {
        userData.waterIntake = currentWaterAmount;
        updateWaterUI();
        waterModal.classList.remove('visible');
        renderRadialProgress(); // Update main dashboard
        saveUserData(); // Save water intake
    });

    // --- FOOD SCANNER FUNCTIONALITY ---
    const scannerModal = document.getElementById('scanner-modal');
    const scanItemBtn = document.getElementById('scan-item-btn');
    const closeModalBtn = scannerModal?.querySelector('.close-modal-btn');
    const cameraView = document.getElementById('camera-view');
    const uploadView = document.getElementById('upload-view');
    const cameraFeed = document.getElementById('camera-feed');
    const imageCanvas = document.getElementById('image-canvas');
    const captureBtn = document.getElementById('capture-photo-btn');
    const switchToUploadBtn = document.getElementById('switch-to-upload-btn');
    
    let stream = null;

    // Scanner Modal Controls
    scanItemBtn?.addEventListener('click', () => {
        scannerModal.classList.add('visible');
        startCamera();
    });

    closeModalBtn?.addEventListener('click', () => {
        scannerModal.classList.remove('visible');
        stopCamera();
    });

    // Camera Functions
    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false
            });
            cameraFeed.srcObject = stream;
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Could not access camera. Please ensure camera permissions are granted.');
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        if (cameraFeed) cameraFeed.srcObject = null;
    }

    // Capture Photo
    captureBtn?.addEventListener('click', () => {
        const context = imageCanvas.getContext('2d');
        imageCanvas.width = cameraFeed.videoWidth;
        imageCanvas.height = cameraFeed.videoHeight;
        context.drawImage(cameraFeed, 0, 0);
        
        // Convert to base64 for API submission
        const imageData = imageCanvas.toDataURL('image/jpeg');
        analyzeFood(imageData);
    });

    // File Upload Handler
    function setupFileUpload() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => analyzeFood(e.target.result);
                reader.readAsDataURL(file);
            }
        });
        
        return fileInput;
    }

    const fileInput = setupFileUpload();
    document.body.appendChild(fileInput);

    switchToUploadBtn?.addEventListener('click', () => {
        fileInput.click();
    });

    // Food Analysis
    async function analyzeFood(imageData) {
        // Show loading state
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loading-indicator';
        loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing image...';
        
        const scanResult = document.createElement('div');
        scanResult.id = 'scan-result';
        
        const modalContent = scannerModal.querySelector('.modal-content');
        modalContent.appendChild(loadingIndicator);

        try {
            // Simulated API response for demo
            // In production, replace with actual API call to food recognition service
            await new Promise(resolve => setTimeout(resolve, 2000));
            const mockResult = {
                name: "Grilled Chicken Salad",
                nutrition: {
                    calories: 350,
                    protein: 28,
                    carbs: 12,
                    fat: 22
                }
            };

            // Update the UI with results
            loadingIndicator.remove();
            scanResult.innerHTML = `
                <h4>${mockResult.name}</h4>
                <div class="nutrition-facts">
                    <p><strong>Calories:</strong> ${mockResult.nutrition.calories} kcal</p>
                    <p><strong>Protein:</strong> ${mockResult.nutrition.protein}g</p>
                    <p><strong>Carbs:</strong> ${mockResult.nutrition.carbs}g</p>
                    <p><strong>Fat:</strong> ${mockResult.nutrition.fat}g</p>
                </div>
                <button class="log-food-btn">Log This Food</button>
            `;
            modalContent.appendChild(scanResult);

            // Log Food Button Handler
            const logFoodBtn = scanResult.querySelector('.log-food-btn');
            logFoodBtn.addEventListener('click', () => {
                // Add to today's meals
                userData.todaysMeals.unshift({
                    name: mockResult.name,
                    calories: mockResult.nutrition.calories,
                    img: "https://images.unsplash.com/photo-1551248429-40974013e521?q=80&w=100&auto=format&fit=crop"
                });

                // Update nutrition summary
                userData.summary.calories.consumed += mockResult.nutrition.calories;
                userData.summary.protein.consumed += mockResult.nutrition.protein;
                userData.summary.carbs.consumed += mockResult.nutrition.carbs;

                // Update UI
                renderMealLog();
                renderRadialProgress();
                renderFocusCard();

                // Close modal
                scannerModal.classList.remove('visible');
                stopCamera();
                scanResult.remove();
            });

        } catch (error) {
            console.error('Error analyzing food:', error);
            loadingIndicator.innerHTML = 'Error analyzing image. Please try again.';
        }
    }

    // Execute all render functions
    renderRadialProgress();
    renderFocusCard();
    renderMealLog();
    renderChart();
});