const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// CoinMarketCap API configuration
const CMC_API_KEY = '1d5f9b89-aee4-4442-8359-63a05c0cd323';
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

// Database file path
const DB_FILE = path.join(__dirname, 'database.json');

// Initialize database
let database = {
    users: [
        { id: 1, username: 'girishkhot', password: 'girish@123', email: 'khotgirish15@gmail.com' },
        { id: 2, username: 'mayuresh', password: 'mayuresh@123', email: 'mayureshkhot15@gmail.com' },
        { id: 3, username: 'user3', password: 'password123', email: 'user3@example.com' },
        { id: 4, username: 'user4', password: 'password123', email: 'user4@example.com' },
        { id: 5, username: 'user5', password: 'password123', email: 'user5@example.com' },
        { id: 6, username: 'user6', password: 'password123', email: 'user6@example.com' },
        { id: 7, username: 'user7', password: 'password123', email: 'user7@example.com' },
        { id: 8, username: 'user8', password: 'password123', email: 'user8@example.com' },
        { id: 9, username: 'user9', password: 'password123', email: 'user9@example.com' },
        { id: 10, username: 'user10', password: 'password123', email: 'user10@example.com' }
    ],
    portfolios: {}
};

// Load database
async function loadDatabase() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        database = JSON.parse(data);
        console.log('✅ Database loaded successfully');
    } catch (error) {
        console.log('📝 Creating new database...');
        await saveDatabase();
    }
}

// Save database
async function saveDatabase() {
    try {
        await fs.writeFile(DB_FILE, JSON.stringify(database, null, 2));
    } catch (error) {
        console.error('Error saving database:', error);
    }
}

// Email configuration (using Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'khotgirish@gmail.com', // Replace with your Gmail
        pass: 'sjoe sgfy xdcm frzd' // Replace with Gmail app password
    }
});

// API Routes

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = database.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            // Don't send password back
            const { password, ...userWithoutPassword } = user;
            res.json({ 
                success: true, 
                user: userWithoutPassword,
                message: 'Login successful'
            });
        } else {
            res.json({ 
                success: false, 
                message: 'Invalid username or password'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user portfolio
app.get('/api/portfolio/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const userPortfolio = database.portfolios[userId] || { portfolio: [], alerts: [] };
        
        res.json({
            success: true,
            portfolio: userPortfolio.portfolio,
            alerts: userPortfolio.alerts
        });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch portfolio' });
    }
});

// Save user portfolio
app.post('/api/portfolio/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const { portfolio, alerts } = req.body;
        
        database.portfolios[userId] = { portfolio, alerts };
        await saveDatabase();
        
        res.json({ success: true, message: 'Portfolio saved successfully' });
    } catch (error) {
        console.error('Error saving portfolio:', error);
        res.status(500).json({ success: false, error: 'Failed to save portfolio' });
    }
});

// Get live prices for multiple cryptocurrencies
app.get('/api/prices', async (req, res) => {
    try {
        const { symbols } = req.query;
        
        if (!symbols) {
            return res.status(400).json({ success: false, error: 'Symbols parameter required' });
        }

        const response = await axios.get(`${CMC_BASE_URL}/cryptocurrency/quotes/latest`, {
            headers: {
                'X-CMC_PRO_API_KEY': CMC_API_KEY,
                'Accept': 'application/json'
            },
            params: {
                symbol: symbols,
                convert: 'USD'
            }
        });

        res.json({ success: true, data: response.data.data });
    } catch (error) {
        console.error('Error fetching prices:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch prices',
            details: error.response?.data || error.message 
        });
    }
});

// Send email alert
app.post('/api/send-alert', async (req, res) => {
    try {
        const { email, coinName, targetPrice, currentPrice } = req.body;

        const mailOptions = {
            from: 'khotgirish15@gmail.com', // Replace with your Gmail
            to: email,
            subject: `🚀 CryptoVault Alert: ${coinName} reached $${targetPrice.toFixed(2)}!`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: 'Inter', Arial, sans-serif; margin: 0; padding: 0; background-color: #0a0e27; }
                        .container { max-width: 600px; margin: 0 auto; background-color: #151932; }
                        .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center; }
                        .header h1 { color: white; margin: 0; font-size: 32px; }
                        .content { padding: 40px 30px; color: #ffffff; }
                        .coin-info { background: #1e2139; border-radius: 16px; padding: 30px; margin: 20px 0; border: 1px solid #2d3250; }
                        .price { font-size: 42px; font-weight: bold; color: #10b981; margin: 15px 0; }
                        .label { color: #a5b4fc; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
                        .footer { padding: 30px; text-align: center; color: #64748b; font-size: 14px; }
                        .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 12px; margin-top: 20px; font-weight: 600; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>💎 CryptoVault Alert</h1>
                        </div>
                        <div class="content">
                            <h2 style="color: #ffffff;">🎯 Price Target Reached!</h2>
                            <p style="color: #a5b4fc; font-size: 16px;">Your price alert for <strong>${coinName}</strong> has been triggered.</p>
                            
                            <div class="coin-info">
                                <div class="label">Target Price</div>
                                <div class="price">$${targetPrice.toFixed(2)}</div>
                                
                                <div class="label" style="margin-top: 20px;">Current Price</div>
                                <div style="font-size: 36px; font-weight: bold; color: #10b981;">$${currentPrice.toFixed(2)}</div>
                            </div>
                            
                            <p style="color: #a5b4fc; margin-top: 30px;">
                                Congratulations! Your cryptocurrency has reached your target price. 
                                Log in to your CryptoVault dashboard to review your portfolio and take action.
                            </p>
                        </div>
                        <div class="footer">
                            <p>This is an automated alert from CryptoVault Portfolio Tracker</p>
                            <p>💎 Track. Alert. Profit.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Alert email sent to ${email} for ${coinName}`);
        res.json({ success: true, message: 'Alert email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ success: false, error: 'Failed to send email', details: error.message });
    }
});

// Get all users (admin endpoint)
app.get('/api/users', (req, res) => {
    const usersWithoutPasswords = database.users.map(({ password, ...user }) => user);
    res.json({ success: true, users: usersWithoutPasswords });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'CryptoVault API is running',
        users: database.users.length,
        portfolios: Object.keys(database.portfolios).length
    });
});

// Initialize and start server
loadDatabase().then(() => {
    app.listen(PORT, () => {
        console.log('\n🚀 ═══════════════════════════════════════════════════');
        console.log('   💎 CryptoVault API Server');
        console.log('   🌐 Running on http://localhost:' + PORT);
        console.log('   📊 Ready to track portfolios!');
        console.log('   👥 ' + database.users.length + ' users registered');
        console.log('═══════════════════════════════════════════════════\n');
    });
});