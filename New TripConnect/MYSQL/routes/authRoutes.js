import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();

// JWT Secret
const JWT_SECRET = 'tripconnect-secret-key-2024';

// SIGNUP
router.post('/signup', async(req, res) => {
    const {
        user_id,
        name,
        email,
        phone_number,
        password,
        dob,
        gender,
        location
    } = req.body;

    // 1. Check if user exists
    const checkUser = 'SELECT * FROM users WHERE email = ? OR user_id = ?';

    db.query(checkUser, [email, user_id], async(err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (result.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Insert user
        const insertUser = `
      INSERT INTO users
      (user_id, name, email, phone_number, password, dob, gender, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

        db.query(
            insertUser, [
                user_id,
                name,
                email,
                phone_number,
                hashedPassword,
                dob,
                gender,
                location
            ],
            (err, insertResult) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Database error'
                    });
                }

                // 4. Get created user (without password)
                const getNewUser = `
          SELECT id, user_id, name, email, phone_number, dob, gender, location
          FROM users WHERE id = ?
        `;

                db.query(getNewUser, [insertResult.insertId], (err, userResult) => {
                    if (err) {
                        return res.status(201).json({
                            success: true,
                            message: 'Signup successful'
                        });
                    }

                    const user = userResult[0];

                    // 5. Create token
                    const token = jwt.sign({ userId: user.id, email: user.email },
                        JWT_SECRET, { expiresIn: '7d' }
                    );

                    // 6. Send response
                    res.status(201).json({
                        success: true,
                        message: 'Signup successful',
                        token: token,
                        user: user
                    });
                });
            }
        );
    });
});

// LOGIN
router.post('/login', async(req, res) => {
    const { email, password } = req.body;

    // 1. Find user
    const findUser = 'SELECT * FROM users WHERE email = ?';

    db.query(findUser, [email], async(err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }

        if (result.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = result[0];

        // 2. Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // 3. Create token
        const token = jwt.sign({ userId: user.id, email: user.email },
            JWT_SECRET, { expiresIn: '7d' }
        );

        // 4. Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        // 5. Send response
        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: userWithoutPassword
        });
    });
});

// ============================================
// UPDATED PROFILE ENDPOINT
// ============================================

// GET USER PROFILE
router.get('/profile', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log('Token verification failed:', err);
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        console.log('Token decoded:', decoded);

        // Get user by ID from token
        const getUser = `
      SELECT id, user_id, name, email, phone_number, dob, gender, location
      FROM users WHERE id = ?
    `;

        db.query(getUser, [decoded.userId], (err, result) => {
            if (err) {
                console.error('Profile DB error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (result.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = result[0];
            console.log('User found:', user);

            res.json({
                success: true,
                message: 'Profile retrieved',
                user: user
            });
        });
    });
});

// KEEP THIS LINE (EXACTLY AS IT WAS)
export default router;