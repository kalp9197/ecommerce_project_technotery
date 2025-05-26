import { beginTransaction, commit, rollback } from "../services/dbService.js";

async function getUserAnalytics(userUuid) {
    let connection;
    try {
        connection = await beginTransaction();

        const [userRows] = await connection.execute(
            `SELECT id FROM users WHERE uuid = ?`,
            [userUuid]
        );

        if (!userRows?.length) {
            throw new Error(`User with UUID ${userUuid} not found`);
        }

        const [rows] = await connection.execute(
            `SELECT user_id, event_type, product_id, 
             DATE_FORMAT(created_at, '%Y-%m-%dT%H:%i:%sZ') as timestamp
             FROM user_analytics
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userRows[0].id]
        );

        await commit(connection);
        return rows;

    } catch (error) {
        if (connection) await rollback(connection);
        console.error("Database error in getUserAnalytics:", error);
        throw new Error(`Failed to fetch user analytics: ${error.message}`);
    } finally {
        if (connection) await connection.release();
    }
}

export { getUserAnalytics };