// mcjk id Server Utility
// © 2024 mcjk

import mysql from 'mysql2/promise';

export default class {
    constructor(mysqlOptions, redis) {
        this.redis = redis;
        this.mysqlOptions = mysqlOptions;
    }

    // Express middelware that redirects the user if they are not set up.
    // You should use this middleware AFTER checking if user is logged in with oidc.
    requiresId() {
        return async (req, res, next) => {
            if (await this.userExists(req.oidc.user.sub)) {
                // User is authenticated, proceed to the next middleware/handler
                return next();
            }

            // Redirect the user to set up their account.
            res.redirect('/id/setup');
        };
    }

    // This method checks whether the user is set up in the database.
    async userExists(userId) {
        const conn = await mysql.createConnection(this.mysqlOptions);
        let results;
        try {
            [results] = await conn.query(`SELECT NULL FROM users WHERE user_id = ?;`, [userId]);
        } catch (error) {
            console.error('Error while querying the databse: ', error);
            await conn.end();
            return false;
        }

        await conn.end();

        if (results.length) return true;
        else return false;
    }

    // This function adds a user to the mcjk id database.
    // Returns true if successful, false if errored.
    async setupUser(userId, displayName, username) {
        // Validation rules
        const validationResult = {
            isValid: true,
            errors: {
                displayName: null,
                username: null
            }
        };

        // Validate displayName
        if (!stringInRange(displayName, 1, 32)) {
            validationResult.isValid = false;
            validationResult.errors.displayName = 'length';
        }

        // Validate username
        const usernameRegex = /^[a-zA-Z0-9_.-]{2,32}$/;
        if (typeof username !== 'string' || !usernameRegex.test(username)) {
            validationResult.isValid = false;
            validationResult.errors.username = 'length/characters';
        }

        // Return early if validation failed
        if (!validationResult.isValid) {
            return { success: false, validation: validationResult };
        }

        // Proceed with database operations
        const conn = await mysql.createConnection(this.mysqlOptions);
        try {
            // Insert user into the database
            await conn.query(
                `INSERT INTO users(user_id, display_name, user_name) VALUES (?, ?, ?);`,
                [userId, displayName, username]
            );
        } catch (error) {
            // If duplicate username
            if (error?.code === 'ER_DUP_ENTRY') {
                validationResult.isValid = false;
                validationResult.errors.username = 'duplicate';

                await conn.end();
                return { success: false, validation: validationResult };
            }

            console.error('Error while querying the database: ', error);

            await conn.end();
            return { success: false, error: "Database error occurred." };
        }

        await conn.end();
        return { success: true, validation: validationResult };
    }

    async setDisplayName(userId, displayName) {
        const conn = await mysql.createConnection(this.mysqlOptions);
        try {
            await conn.query(`UPDATE users SET display_name = ? WHERE user_id = ?;`, [displayName, userId]);
        } catch (error) {
            console.error('Error while querying the databse: ', error);
            await conn.end();
            return false;
        }
        await conn.end();

        return true;
    }

    async setUsername(userId, username) {
        const conn = await mysql.createConnection(this.mysqlOptions);
        try {
            await conn.query(`UPDATE users SET user_name = ? WHERE user_id = ?;`, [username, userId]);
        } catch (error) {
            console.error('Error while querying the databse: ', error);
            await conn.end();
            return false;
        }
        await conn.end();

        return true;
    }

    // This method gets the user data from mcjk id.
    async getUser(userId) {
        const conn = await mysql.createConnection(this.mysqlOptions);
        let results;
        try {
            [results] = await conn.query(`SELECT created_at, display_name, user_name FROM users WHERE user_id = ?;`, [userId]);
        } catch (error) {
            console.error('Error while querying the databse: ', error);
            await conn.end();
            return { success: false, message: 'Internal database error' };
        }

        await conn.end();

        if (results.length) return { success: true, ...results[0] };
        else return { success: false, message: "User doesn't exist" };
    }

    async getUserByUsername(username) {
        username = username.toLowerCase();
        const conn = await mysql.createConnection(this.mysqlOptions);
        let results;
        try {
            [results] = await conn.query(`SELECT created_at, display_name, user_name FROM users WHERE user_name = ?;`, [username]);
        } catch (error) {
            console.error('Error while querying the databse: ', error);
            await conn.end();
            return { success: false, message: 'Internal database error' };
        }

        await conn.end();

        if (results.length) return { success: true, ...results[0] };
        else return { success: false, message: "User doesn't exist" };
    }
    
    // This gets the friends list of a user and friend requests associated with them.
    async getFriends(userId) {
        const friendsListQuery = `
            SELECT (
                    CASE
                        WHEN f.user1 = ? THEN f.user2
                        ELSE f.user1
                    END
                ) AS friend_id,
                u.display_name
            FROM friendships f
                JOIN users u ON (
                    CASE
                        WHEN f.user1 = ? THEN f.user2
                        ELSE f.user1
                    END
                ) = u.user_id
            WHERE f.active_since IS NOT NULL
                AND (
                    user1 = ?
                    OR user2 = ?
                );
        `;

        const friendRequestsQuery = `
            SELECT (
                    CASE
                        WHEN f.user1 = ? THEN f.user2
                        ELSE f.user1
                    END
                ) AS user_id,
                u.display_name,
                (
                    CASE
                        WHEN f.user1 = ? THEN 0
                        ELSE 1
                    END
                ) AS incoming
            FROM friendships f
                JOIN users u ON (
                    CASE
                        WHEN f.user1 = ? THEN f.user2
                        ELSE f.user1
                    END
                ) = u.user_id
            WHERE f.active_since IS NULL
                AND (
                    f.user1 = ?
                    OR f.user2 = ?
                )
            ORDER BY incoming DESC;
        `;

        const conn = await mysql.createConnection(this.mysqlOptions);
        try {
            const [friends] = await conn.query(friendsListQuery, [userId, userId, userId, userId]);
            const [requests] = await conn.query(friendRequestsQuery, [userId, userId, userId, userId, userId, userId]);

            await conn.end();
            return { friends, requests };
        } catch (error) {
            console.error('Error while querying the database: ', error);

            await conn.end();
            throw new Error('Unable to fetch friends and requests.');
        }
    }

    // This removes a friendship.
    async removeFriendship(userId, friendUsername) {
        const conn = await mysql.createConnection(this.mysqlOptions);
        try {
            await conn.query(`
            DELETE FROM friendships 
            WHERE (user1 = ? AND user2 = (SELECT user_id FROM users WHERE user_name = ? LIMIT 1))
               OR (user2 = ? AND user1 = (SELECT user_id FROM users WHERE user_name = ? LIMIT 1));
        `, [userId, friendUsername, userId, friendUsername]);

            await conn.end();
        } catch (error) {
            console.error('Error while querying the database: ', error);
            await conn.end();
            throw new Error('Unable to remove friendship.');
        }
    }

    // This allows a user to accept a friend request sent by another user.
    async acceptFriendship(userId, friendUsername) {
        const conn = await mysql.createConnection(this.mysqlOptions);
        try {
            await conn.query(`
            UPDATE friendships 
            SET active = 1 
            WHERE user1 = (SELECT user_id FROM users WHERE user_name = ? LIMIT 1) AND user2 = ?;
        `, [friendUsername, userId]);

            await conn.end();
        } catch (error) {
            console.error('Error while querying the database: ', error);
            await conn.end();
            throw new Error('Unable to accept friendship.');
        }
    }

    // This allows sending friend requests.
    async inviteToFriends(userId, friendUsername) {
        const conn = await mysql.createConnection(this.mysqlOptions);
        try {
            await conn.query(`
            INSERT INTO friendships (user1, user2)
            SELECT ?, (SELECT user_id FROM users WHERE user_name = ? LIMIT 1)
            WHERE NOT EXISTS (
                SELECT 1 
                FROM friendships 
                WHERE (user1 = ? AND user2 = (SELECT user_id FROM users WHERE user_name = ? LIMIT 1))
                   OR (user1 = (SELECT user_id FROM users WHERE user_name = ? LIMIT 1) AND user2 = ?)
            );
        `, [userId, friendUsername, userId, friendUsername, friendUsername, userId]);

            await conn.end();
        } catch (error) {
            console.error('Error while querying the database: ', error);
            await conn.end();
            throw new Error('Unable to send friend request.');
        }
    }
}

function stringInRange(str, rangeStart, rangeEnd) {
    if (typeof str !== 'string') return false;
    str = str.trim();

    return str.length >= rangeStart && str.length <= rangeEnd;
}