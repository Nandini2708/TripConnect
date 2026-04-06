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
        travelers_count,
        interests,           // Array of interests
        companion_type       // 'self-group' or 'buddy'
    } = req.body;

    // Convert interests array to JSON string
    const interestsJSON = interests ? JSON.stringify(interests) : null;

    const query = `
        INSERT INTO travel_preferences 
        (user_id, destination, start_date, end_date, duration_days, 
         budget_min, budget_max, travelers_count, interests, companion_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
        user_id, destination, start_date, end_date, duration_days,
        budget_min, budget_max, travelers_count, interestsJSON, companion_type
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
// In preferenceRoutes.js - Update the save endpoint
router.post('/save', (req, res) => {
    const {
        user_id,
        destination,
        start_date,
        end_date,
        duration_days,
        budget_min,
        budget_max,
        travelers_count,
        interests,
        companion_type
    } = req.body;

    console.log('📝 Saving preference for user:', user_id);

    // First, check if the user exists
    db.query('SELECT * FROM users WHERE user_id = ?', [user_id], (userErr, userResults) => {
        if (userErr) {
            console.error('Error checking user:', userErr);
            return res.status(500).json({
                success: false,
                message: 'Database error checking user'
            });
        }

        // If user doesn't exist, create one
        if (userResults.length === 0) {
            console.log('👤 User not found, creating test user with ID:', user_id);
            
            db.query(
                'INSERT INTO users (user_id, name, email, phone_number, password, dob, gender, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [user_id, 'Test User', `user${user_id}@example.com`, '9999999999', 'password123', '1990-01-01', 'Male', 'Mumbai'],
                (insertErr, insertResult) => {
                    if (insertErr) {
                        console.error('Failed to create user:', insertErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to create user',
                            error: insertErr.message
                        });
                    }
                    console.log('✅ User created successfully');
                    // Now insert the preference
                    insertPreference(user_id);
                }
            );
        } else {
            console.log('✅ User found with ID:', user_id);
            insertPreference(user_id);
        }
    });

    function insertPreference(validUserId) {
        const interestsJSON = interests ? JSON.stringify(interests) : null;

        const query = `
            INSERT INTO travel_preferences 
            (user_id, destination, start_date, end_date, duration_days, 
             budget_min, budget_max, travelers_count, interests, companion_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(query, [
            validUserId, 
            destination || 'Unknown', 
            start_date || null, 
            end_date || null, 
            duration_days || 0,
            budget_min || 0, 
            budget_max || 0, 
            travelers_count || 1, 
            interestsJSON, 
            companion_type || 'self-group'
        ], (err, result) => {
            if (err) {
                console.error('❌ Error saving preferences:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to save travel plan',
                    error: err.message
                });
            }

            console.log('✅ Preference saved with ID:', result.insertId);
            res.json({
                success: true,
                message: 'Travel plan saved successfully',
                preference_id: result.insertId
            });
        });
    }
});
// NEW: Save ONLY interests and companion (without other details)
router.post('/save-interests', (req, res) => {
    const {
        user_id,
        interests,
        companion_type
    } = req.body;

    if (!user_id || !interests || !companion_type) {
        return res.status(400).json({
            success: false,
            message: 'User ID, interests, and companion type are required'
        });
    }

    // Validate companion_type
    const validCompanionTypes = ['self-group', 'buddy'];
    if (!validCompanionTypes.includes(companion_type)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid companion type. Must be "self-group" or "buddy"'
        });
    }

    // Convert interests array to JSON string
    const interestsJSON = JSON.stringify(interests);

    // Check if user already has a preference record
    const checkQuery = 'SELECT preference_id FROM travel_preferences WHERE user_id = ?';
    
    db.query(checkQuery, [user_id], (checkErr, checkResults) => {
        if (checkErr) {
            console.error('Error checking existing preferences:', checkErr);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (checkResults.length > 0) {
            // Update existing record (only interests and companion_type)
            const updateQuery = `
                UPDATE travel_preferences 
                SET interests = ?, companion_type = ?, created_at = NOW()
                WHERE user_id = ?
            `;
            
            db.query(updateQuery, [interestsJSON, companion_type, user_id], (updateErr, updateResult) => {
                if (updateErr) {
                    console.error('Error updating preferences:', updateErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to update travel preferences'
                    });
                }

                res.json({
                    success: true,
                    message: 'Travel preferences updated successfully',
                    updated: true
                });
            });
        } else {
            // Insert new record with minimal data
            const insertQuery = `
                INSERT INTO travel_preferences 
                (user_id, interests, companion_type, created_at)
                VALUES (?, ?, ?, NOW())
            `;
            
            db.query(insertQuery, [user_id, interestsJSON, companion_type], (insertErr, insertResult) => {
                if (insertErr) {
                    console.error('Error saving interests:', insertErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to save travel preferences'
                    });
                }

                res.json({
                    success: true,
                    message: 'Travel preferences saved successfully',
                    preference_id: insertResult.insertId,
                    inserted: true
                });
            });
        }
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
            interests,
            companion_type,
            match_status,
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

        // Parse JSON interests back to array
        results.forEach(pref => {
            if (pref.interests) {
                try {
                    pref.interests = JSON.parse(pref.interests);
                } catch (e) {
                    pref.interests = [];
                }
            }
        });

        res.json({
            success: true,
            preferences: results
        });
    });
});

// Get user's latest travel preferences (just interests and companion)
router.get('/latest/:user_id', (req, res) => {
    const { user_id } = req.params;

    const query = `
        SELECT 
            interests,
            companion_type,
            DATE_FORMAT(created_at, '%d %b %Y, %h:%i %p') as saved_date
        FROM travel_preferences 
        WHERE user_id = ? 
        ORDER BY created_at DESC
        LIMIT 1
    `;

    db.query(query, [user_id], (err, results) => {
        if (err) {
            console.error('Error fetching latest preferences:', err);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (results.length === 0) {
            return res.json({
                success: true,
                hasPreferences: false,
                message: 'No preferences found'
            });
        }

        // Parse JSON interests back to array
        const preference = results[0];
        if (preference.interests) {
            try {
                preference.interests = JSON.parse(preference.interests);
            } catch (e) {
                preference.interests = [];
            }
        }

        res.json({
            success: true,
            hasPreferences: true,
            preferences: preference
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

// Update match status
router.patch('/:preference_id/match-status', (req, res) => {
    const { preference_id } = req.params;
    const { match_status } = req.body;

    const validStatuses = ['pending', 'matched', 'completed', 'cancelled'];
    
    if (!match_status || !validStatuses.includes(match_status)) {
        return res.status(400).json({
            success: false,
            message: 'Valid match status is required'
        });
    }

    const query = `
        UPDATE travel_preferences 
        SET match_status = ?
        WHERE preference_id = ?
    `;

    db.query(query, [match_status, preference_id], (err, result) => {
        if (err) {
            console.error('Error updating match status:', err);
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
            message: 'Match status updated successfully'
        });
    });
});

export default router;