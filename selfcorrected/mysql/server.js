// server.js
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import preferenceRoutes from './routes/preferenceRoutes.js';
import memberRoutes from './routes/memberRoutes.js';  // IMPORT THIS

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/members', memberRoutes);  // USE THIS

// Root route
app.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'TripConnect API Server',
        routes: {
            auth: '/api/auth',
            packages: '/api/packages',
            preferences: '/api/preferences',
            members: '/api/members'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: `Route ${req.url} not found` 
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log(`✅ Auth routes: http://localhost:${PORT}/api/auth`);
    console.log(`✅ Package routes: http://localhost:${PORT}/api/packages`);
    console.log(`✅ Preference routes: http://localhost:${PORT}/api/preferences`);
    console.log(`✅ Member routes: http://localhost:${PORT}/api/members`);
    console.log('='.repeat(50) + '\n');
});