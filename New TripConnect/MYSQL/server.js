import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import preferenceRoutes from './routes/preferenceRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/preferences', preferenceRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'TripConnect API Server' });
});

// Server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});