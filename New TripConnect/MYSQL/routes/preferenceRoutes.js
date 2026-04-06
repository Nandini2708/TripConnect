import express from 'express';
import db from '../db.js';

const router = express.Router();

// Save destination preferences
router.post('/save', (req, res) => {
    const {
        user_id,
        destination,
        start_date,
        end_date,
        duration_days,
        budget_min,
        budget_max,
        travelers_count
    } = req.body;

    const query = `
        INSERT INTO travel_preferences 
        (user_id, destination, start_date, end_date, duration_days, 
         budget_min, budget_max, travelers_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
        user_id, destination, start_date, end_date, duration_days,
        budget_min, budget_max, travelers_count
    ], (err, result) => {
        if (err) {
            console.error('Error saving preferences:', err);
            return res.status(500).json({
                success: false,
                message: 'Failed to save travel plan'
            });
        }

        res.json({
            success: true,
            message: 'Travel plan saved successfully',
            preference_id: result.insertId
        });
    });
});

// Get user's travel preferences
router.get('/user/:user_id', (req, res) => {
    const { user_id } = req.params;

    const query = `
        SELECT 
            preference_id,
            destination,
            DATE_FORMAT(start_date, '%d %b %Y') as start_date,
            DATE_FORMAT(end_date, '%d %b %Y') as end_date,
            duration_days,
            budget_min,
            budget_max,
            travelers_count,
            DATE_FORMAT(created_at, '%d %b %Y, %h:%i %p') as saved_date
        FROM travel_preferences 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    `;

    db.query(query, [user_id], (err, results) => {
        if (err) {
            console.error('Error fetching preferences:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        res.json({
            success: true,
            preferences: results
        });
    });
});

// Delete a preference
router.delete('/:preference_id', (req, res) => {
    const { preference_id } = req.params;

    const query = 'DELETE FROM travel_preferences WHERE preference_id = ?';

    db.query(query, [preference_id], (err, result) => {
        if (err) {
            console.error('Error deleting preference:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Travel plan not found'
            });
        }

        res.json({
            success: true,
            message: 'Travel plan deleted successfully'
        });
    });
});

export default router;