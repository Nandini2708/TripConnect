import express from 'express';
import db from '../db.js';

const router = express.Router();

// SAVE MEMBERS
// SAVE MEMBERS - MODIFIED VERSION (बिना DELETE के)
router.post('/save', (req, res) => {
    console.log('='.repeat(50));
    console.log('SAVE REQUEST RECEIVED');
    console.log('Body:', req.body);
    
    const { preference_id, members } = req.body;
    
    if (!preference_id) {
        return res.status(400).json({ 
            success: false, 
            message: 'preference_id is required' 
        });
    }
    
    if (!members || !Array.isArray(members)) {
        return res.status(400).json({ 
            success: false, 
            message: 'members array is required' 
        });
    }
    
    console.log(`Preference ID: ${preference_id}`);
    console.log(`Members to insert: ${members.length}`);
    
    // ❌ DELETE वाली लाइन हटा दी - अब पुराने records नहीं हटेंगे
    
    // Insert each member (नए records जुड़ेंगे)
    let inserted = 0;
    let errors = [];
    
    if (members.length === 0) {
        return res.json({ 
            success: true, 
            message: 'No members to save' 
        });
    }
    
    members.forEach((member, index) => {
        const name = member.name || 'Unknown';
        const age = member.age || 0;
        const relationship = member.relationship || (index === 0 ? 'Self' : 'Other');
        
        const query = 'INSERT INTO travel_group_members (preference_id, member_name, age, relationship) VALUES (?, ?, ?, ?)';
        
        db.query(query, [preference_id, name, age, relationship], (err, result) => {
            if (err) {
                console.error('Insert error:', err);
                errors.push({ member, error: err.message });
            } else {
                inserted++;
                console.log(`✅ Inserted: ${name} (ID: ${result.insertId})`);
            }
            
            // When all inserts are done
            if (inserted + errors.length === members.length) {
                console.log(`Complete: ${inserted} inserted, ${errors.length} errors`);
                
                res.json({
                    success: inserted > 0,
                    message: `Inserted ${inserted} of ${members.length} members`,
                    inserted: inserted,
                    preference_id: preference_id,
                    total_members_in_db: 'Check GET /all/with-details to see all records' // सारे records दिखेंगे
                });
            }
        });
    });
});

// GET members by preference_id
router.get('/:preference_id', (req, res) => {
    const prefId = req.params.preference_id;
    
    db.query('SELECT * FROM travel_group_members WHERE preference_id = ? ORDER BY member_id ASC', [prefId], (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        res.json({
            success: true,
            members: results,
            count: results.length
        });
    });
});

// ============================================
// FIXED: GET ALL MEMBERS - ये सभी records दिखाएगा (1 से लेकर आखिरी तक)
// ============================================
router.get('/all/with-details', (req, res) => {
    console.log('📋 Fetching ALL members from travel_group_members table...');
    
    const query = `
        SELECT 
            tgm.member_id,
            tgm.preference_id,
            tgm.member_name,
            tgm.age,
            tgm.relationship,
            DATE_FORMAT(tgm.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
            tp.user_id,
            tp.destination,
            tp.start_date,
            tp.end_date,
            tp.duration_days,
            tp.budget_min,
            tp.budget_max,
            tp.travelers_count,
            tp.interests,
            tp.companion_type,
            tp.match_status,
            DATE_FORMAT(tp.created_at, '%Y-%m-%d %H:%i:%s') as preference_created_at,
            u.name as user_name,
            u.email as user_email
        FROM travel_group_members tgm
        LEFT JOIN travel_preferences tp ON tgm.preference_id = tp.preference_id
        LEFT JOIN users u ON tp.user_id = u.user_id
        ORDER BY tgm.member_id ASC  -- Ascending order से सभी IDs दिखेंगी
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error fetching all members:', err);
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        console.log(`✅ Found ${results.length} total members in database`);
        
        // Log the range of member_ids found
        if (results.length > 0) {
            const firstId = results[0].member_id;
            const lastId = results[results.length - 1].member_id;
            console.log(`📊 Member ID range: ${firstId} to ${lastId}`);
        }
        
        // Parse JSON interests if they exist
        const processedResults = results.map(row => {
            if (row.interests) {
                try {
                    row.interests = JSON.parse(row.interests);
                } catch (e) {
                    row.interests = [];
                }
            }
            return row;
        });
        
        res.json({
            success: true,
            message: 'All member records fetched successfully',
            total_members: processedResults.length,
            member_id_range: results.length > 0 ? {
                first: results[0].member_id,
                last: results[results.length - 1].member_id
            } : null,
            members: processedResults
        });
    });
});

// GET all members WITHOUT details (सिर्फ members table से)
router.get('/all/simple', (req, res) => {
    console.log('📋 Fetching ALL members (simple view)...');
    
    const query = `
        SELECT 
            member_id,
            preference_id,
            member_name,
            age,
            relationship,
            created_at
        FROM travel_group_members 
        ORDER BY member_id ASC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error fetching members:', err);
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        console.log(`✅ Found ${results.length} members`);
        
        res.json({
            success: true,
            message: 'All members fetched successfully',
            total_count: results.length,
            members: results
        });
    });
});

// GET member by member_id
router.get('/member/:member_id', (req, res) => {
    const { member_id } = req.params;
    
    const query = `
        SELECT 
            tgm.*,
            tp.destination,
            tp.start_date,
            tp.end_date,
            u.name as user_name
        FROM travel_group_members tgm
        LEFT JOIN travel_preferences tp ON tgm.preference_id = tp.preference_id
        LEFT JOIN users u ON tp.user_id = u.user_id
        WHERE tgm.member_id = ?
    `;
    
    db.query(query, [member_id], (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }
        
        res.json({
            success: true,
            member: results[0]
        });
    });
});

// GET members count by preference_id
router.get('/stats/by-preference', (req, res) => {
    const query = `
        SELECT 
            preference_id,
            COUNT(*) as member_count,
            MIN(member_id) as first_member_id,
            MAX(member_id) as last_member_id
        FROM travel_group_members
        GROUP BY preference_id
        ORDER BY preference_id DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        res.json({
            success: true,
            stats: results
        });
    });
});

export default router