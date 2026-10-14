const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-secret-key-change-this';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data storage (in production, use a real database)
const dataFile = path.join(__dirname, 'data', 'investments.json');
let database = {
    users: [],
    investments: [],
    transactions: []
};

// Load data
if (fs.existsSync(dataFile)) {
    database = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

// Save data
function saveData() {
    fs.writeFileSync(dataFile, JSON.stringify(database, null, 2));
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Investment plans
const plans = [
    { id: 1, name: 'Starter', min: 10, max: 99, returnRate: 5 },
    { id: 2, name: 'Growth', min: 100, max: 999, returnRate: 8 },
    { id: 3, name: 'Premium', min: 1000, max: Infinity, returnRate: 12 }
];

// Routes

// Signup
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user exists
        if (database.users.find(u => u.email === email)) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = {
            id: database.users.length + 1,
            name,
            email,
            password: hashedPassword,
            balance: 0,
            createdAt: new Date().toISOString()
        };
        
        database.users.push(user);
        saveData();
        
        // Create token
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        
        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, balance: user.balance }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = database.users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        // Create token
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
        
        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, balance: user.balance }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
    const user = database.users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, balance: user.balance }
    });
});

// Get investment plans
app.get('/api/plans', (req, res) => {
    res.json({ success: true, plans });
});

// Make an investment
app.post('/api/invest', authenticateToken, async (req, res) => {
    try {
        const { amount, planName } = req.body;
        
        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }
        
        // Find plan
        const plan = plans.find(p => p.name.toLowerCase() === planName.toLowerCase());
        if (!plan) {
            return res.status(400).json({ success: false, message: 'Invalid plan' });
        }
        
        // Check minimum investment
        if (amount < plan.min) {
            return res.status(400).json({ success: false, message: `Minimum investment for ${plan.name} is $${plan.min}` });
        }
        
        // Create investment
        const investment = {
            id: database.investments.length + 1,
            userId: req.user.id,
            plan: plan.name,
            amount: parseFloat(amount),
            returnRate: plan.returnRate,
            status: 'active',
            startDate: new Date().toISOString()
        };
        
        database.investments.push(investment);
        
        // Add transaction
        database.transactions.push({
            id: database.transactions.length + 1,
            userId: req.user.id,
            type: 'investment',
            amount: parseFloat(amount),
            date: new Date().toISOString()
        });
        
        // Update user balance
        const user = database.users.find(u => u.id === req.user.id);
        user.balance += parseFloat(amount);
        
        saveData();
        
        res.json({ success: true, investment });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user's investments
app.get('/api/investments', authenticateToken, (req, res) => {
    const userInvestments = database.investments.filter(i => i.userId === req.user.id);
    res.json({ success: true, investments: userInvestments });
});

// Get user's transactions
app.get('/api/transactions', authenticateToken, (req, res) => {
    const userTransactions = database.transactions.filter(t => t.userId === req.user.id);
    res.json({ success: true, transactions: userTransactions });
});

// Get market data
app.get('/api/market', (req, res) => {
    const marketData = [
        { symbol: 'AAPL', price: 182.63, change: 1.24 },
        { symbol: 'GOOGL', price: 141.80, change: -0.42 },
        { symbol: 'MSFT', price: 378.85, change: 0.87 },
        { symbol: 'AMZN', price: 153.42, change: 2.15 },
        { symbol: 'TSLA', price: 248.48, change: -1.32 },
        { symbol: 'BTC', price: 43782.50, change: 3.21 }
    ];
    
    res.json({ success: true, market: marketData });
});

// Start server
app.listen(PORT, () => {
    console.log(`Investment platform running on http://localhost:${PORT}`);
});
