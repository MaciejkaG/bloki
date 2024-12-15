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
}

function stringInRange(str, rangeStart, rangeEnd) {
    if (typeof str !== 'string') return false;
    str = str.trim();

    return str.length >= rangeStart && str.length <= rangeEnd;
}