// Initialize Supabase client
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

// Fetch user data from Supabase
async function fetchUserData(userId, timeframe) {
    const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(timeframe);

    if (error) {
        console.error('Error fetching data:', error);
        return null;
    }
    return data;
}

// Calculate averages and trends
function calculateMetrics(data) {
    const metrics = {
        calories: { total: 0, avg: 0, trend: 0 },
        protein: { total: 0, avg: 0, trend: 0 },
        carbs: { total: 0, avg: 0, trend: 0 },
        fat: { total: 0, avg: 0, trend: 0 },
        water: { total: 0, avg: 0, trend: 0 }
    };

    data.forEach((day, index) => {
        const dailyData = day.data;
        metrics.calories.total += dailyData.summary.calories.consumed;
        metrics.protein.total += dailyData.summary.protein.consumed;
        metrics.carbs.total += dailyData.summary.carbs.consumed;
        metrics.water.total += dailyData.waterIntake;

        // Calculate trend (compare with previous period)
        if (index === 0 && data.length > 1) {
            metrics.calories.trend = ((dailyData.summary.calories.consumed / data[1].data.summary.calories.consumed) - 1) * 100;
            metrics.protein.trend = ((dailyData.summary.protein.consumed / data[1].data.summary.protein.consumed) - 1) * 100;
            metrics.carbs.trend = ((dailyData.summary.carbs.consumed / data[1].data.summary.carbs.consumed) - 1) * 100;
            metrics.water.trend = ((dailyData.waterIntake / data[1].data.waterIntake) - 1) * 100;
        }
    });

    // Calculate averages
    const days = data.length;
    for (const metric in metrics) {
        metrics[metric].avg = metrics[metric].total / days;
    }

    return metrics;
}

// Update KPI cards
function updateKPICards(metrics) {
    const kpiContainer = document.getElementById('kpi-container');
    kpiContainer.innerHTML = '';

    const kpis = [
        {
            title: 'Average Calories',
            value: Math.round(metrics.calories.avg),
            trend: metrics.calories.trend.toFixed(1),
            unit: 'kcal'
        },
        {
            title: 'Average Protein',
            value: Math.round(metrics.protein.avg),
            trend: metrics.protein.trend.toFixed(1),
            unit: 'g'
        },
        {
            title: 'Average Carbs',
            value: Math.round(metrics.carbs.avg),
            trend: metrics.carbs.trend.toFixed(1),
            unit: 'g'
        },
        {
            title: 'Daily Water Intake',
            value: Math.round(metrics.water.avg),
            trend: metrics.water.trend.toFixed(1),
            unit: 'mL'
        }
    ];

    kpis.forEach(kpi => {
        const trendClass = kpi.trend > 0 ? 'text-emerald-600' : kpi.trend < 0 ? 'text-red-600' : 'text-gray-600';
        const trendIcon = kpi.trend > 0 ? '↑' : kpi.trend < 0 ? '↓' : '→';

        const card = document.createElement('div');
        card.className = 'kpi-card bg-white p-6 rounded-xl shadow-green transition-all';
        card.innerHTML = `
            <h3 class="text-lg font-semibold text-gray-700 mb-4">${kpi.title}</h3>
            <div class="flex items-end justify-between">
                <div>
                    <p class="text-3xl font-bold text-theme-primary">${kpi.value}</p>
                    <p class="text-sm text-gray-500">${kpi.unit}</p>
                </div>
                <div class="flex items-center ${trendClass}">
                    <span class="text-2xl mr-1">${trendIcon}</span>
                    <span>${Math.abs(kpi.trend)}%</span>
                </div>
            </div>
        `;
        kpiContainer.appendChild(card);
    });
}

// Update trend chart
function updateTrendChart(data, metric = 'calories') {
    const ctx = document.getElementById('trend-chart').getContext('2d');
    
    const dates = data.map(day => new Date(day.data.lastUpdated).toLocaleDateString());
    const values = data.map(day => {
        switch(metric) {
            case 'calories':
                return day.data.summary.calories.consumed;
            case 'protein':
                return day.data.summary.protein.consumed;
            case 'carbs':
                return day.data.summary.carbs.consumed;
            case 'water':
                return day.data.waterIntake;
            default:
                return 0;
        }
    });

    if (window.trendChart) {
        window.trendChart.destroy();
    }

    window.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: metric.charAt(0).toUpperCase() + metric.slice(1),
                data: values,
                borderColor: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Handle trend tab changes
function handleTrendChange(metric, button) {
    // Update active tab
    document.querySelectorAll('.trend-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    button.classList.add('active');

    // Update chart title
    const titleElement = document.getElementById('line-chart-title');
    titleElement.textContent = `Daily ${metric.charAt(0).toUpperCase() + metric.slice(1)} Consumption Trend (${currentTimeframe})`;

    // Update chart with new metric
    if (currentData) {
        updateTrendChart(currentData, metric);
    }
}

// Handle timeframe changes
let currentTimeframe = '7-day';
let currentData = null;

async function handleTimeframeChange(timeframe) {
    // Update active button
    document.querySelectorAll('.timeframe-button').forEach(btn => {
        btn.classList.remove('bg-theme-primary', 'text-white', 'shadow-md');
        btn.classList.add('text-gray-700', 'hover:bg-emerald-200');
    });
    document.getElementById(timeframe).classList.add('bg-theme-primary', 'text-white', 'shadow-md');
    document.getElementById(timeframe).classList.remove('text-gray-700', 'hover:bg-emerald-200');

    // Update subtitle
    document.getElementById('timeframe-subtitle').textContent = 
        `Review your ${timeframe} dietary habits and track your total calorie goals.`;

    currentTimeframe = timeframe;
    const days = parseInt(timeframe);

    // Fetch and update data
    const user = await checkAuth();
    if (user) {
        currentData = await fetchUserData(user.id, days);
        if (currentData) {
            const metrics = calculateMetrics(currentData);
            updateKPICards(metrics);
            updateTrendChart(currentData, 'calories');
        }
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Set initial timeframe
    await handleTimeframeChange('7-day');

    // Set initial trend tab
    const caloriesTab = document.querySelector('[data-trend="calories"]');
    caloriesTab.classList.add('active');
});