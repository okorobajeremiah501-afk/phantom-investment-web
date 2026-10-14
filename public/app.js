// Chart.js configuration
const ctx = document.getElementById('heroChart').getContext('2d');

// Sample data for the hero chart
const heroChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'Portfolio Value',
            data: [10000, 10500, 11200, 10800, 11500, 12300, 12800, 13500, 14200, 13800, 14500, 15200],
            borderColor: '#fff',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            fill: true,
            tension: 0.4
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
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#fff'
                }
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                },
                ticks: {
                    color: '#fff'
                }
            }
        }
    }
});

// Investment Plans Data
const investmentPlans = [
    {
        id: 1,
        name: 'Starter',
        price: '$10 - $99',
        features: ['Basic portfolio', 'Monthly reports', 'Email support'],
        featured: false
    },
    {
        id: 2,
        name: 'Growth',
        price: '$100 - $999',
        features: ['Advanced portfolio', 'Weekly reports', 'Priority support', 'Tax optimization'],
        featured: true
    },
    {
        id: 3,
        name: 'Premium',
        price: '$1,000+',
        features: ['Premium portfolio', 'Daily reports', 'Dedicated advisor', 'Custom strategies'],
        featured: false
    }
];

// Load plans dynamically
function loadPlans() {
    const plansGrid = document.getElementById('plansGrid');
    plansGrid.innerHTML = investmentPlans.map(plan => `
        <div class="plan-card ${plan.featured ? 'featured' : ''}">
            <h3>${plan.name}</h3>
            <div class="plan-price">${plan.price}</div>
            <ul class="plan-features">
                ${plan.features.map(feature => `<li>✓ ${feature}</li>`).join('')}
            </ul>
            <button class="btn ${plan.featured ? 'btn-outline' : 'btn-primary'}" onclick="openInvest('${plan.name}')">
                Invest Now
            </button>
        </div>
    `).join('');
}

// Market Data
const marketData = [
    { symbol: 'AAPL', price: 182.63, change: 1.24 },
    { symbol: 'GOOGL', price: 141.80, change: -0.42 },
    { symbol: 'MSFT', price: 378.85, change: 0.87 },
    { symbol: 'AMZN', price: 153.42, change: 2.15 },
    { symbol: 'TSLA', price: 248.48, change: -1.32 },
    { symbol: 'BTC', price: 43782.50, change: 3.21 }
];

function loadMarketData() {
    const marketGrid = document.getElementById('marketGrid');
    marketGrid.innerHTML = marketData.map(stock => `
        <div class="market-card">
            <div class="symbol">${stock.symbol}</div>
            <div class="price">$${stock.price.toLocaleString()}</div>
            <div class="change ${stock.change >= 0 ? 'positive' : 'negative'}">
                ${stock.change >= 0 ? '+' : ''}${stock.change}%
            </div>
        </div>
    `).join('');
}

// User state
let currentUser = null;
let userInvestments = [];
let userTransactions = [];

// Modal functions
function openLogin() {
    document.getElementById('loginModal').style.display = 'block';
}

function openSignup() {
    document.getElementById('signupModal').style.display = 'block';
}

function openInvest(planName) {
    document.getElementById('investModal').style.display = 'block';
    document.getElementById('planSelect').value = planName;
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Form handlers
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (data.success) {
            currentUser = data.user;
            updateDashboard();
            closeModal('loginModal');
            alert('Login successful!');
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Login failed. Please try again.');
    }
});

document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = e.target[0].value;
    const email = e.target[1].value;
    const password = e.target[2].value;
    
    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        if (data.success) {
            currentUser = data.user;
            updateDashboard();
            closeModal('signupModal');
            alert('Account created successfully!');
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Signup failed. Please try again.');
    }
});

document.getElementById('investForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = e.target[0].value;
    const plan = e.target[1].value;
    
    if (!currentUser) {
        alert('Please login first!');
        openLogin();
        return;
    }
    
    try {
        const response = await fetch('/api/invest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, amount, plan })
        });
        
        const data = await response.json();
        if (data.success) {
            userInvestments.push(data.investment);
            updateDashboard();
            closeModal('investModal');
            alert('Investment successful!');
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert('Investment failed. Please try again.');
    }
});

// Update dashboard
function updateDashboard() {
    if (!currentUser) return;
    
    // Update balance
    const totalBalance = userInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    document.getElementById('totalBalance').textContent = `$${totalBalance.toFixed(2)}`;
    
    // Update investments list
    const investmentList = document.getElementById('investmentList');
    investmentList.innerHTML = userInvestments.map(inv => `
        <div class="investment-item">
            <span>${inv.plan}</span>
            <span>$${inv.amount.toFixed(2)}</span>
            <span class="status">Active</span>
        </div>
    `).join('') || '<p>No investments yet</p>';
    
    // Update transactions
    const transactionList = document.getElementById('transactionList');
    transactionList.innerHTML = userTransactions.map(txn => `
        <div class="transaction-item">
            <span>${txn.type}</span>
            <span>$${txn.amount.toFixed(2)}</span>
            <span>${new Date(txn.date).toLocaleDateString()}</span>
        </div>
    `).join('') || '<p>No transactions yet</p>';
}

// Initialize
loadPlans();
loadMarketData();
updateDashboard();
