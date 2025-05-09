import { dbService } from "../../services/index.js";

// Get paginated list of users for admin panel
export const getAllUsers = async (page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    const users = await dbService.query(
      `SELECT
          uuid,
          name,
          email,
          is_active
        FROM
          users
        WHERE
          is_active = 1 AND is_admin = 0
        ORDER BY
          id DESC
        LIMIT
          ${limit}
        OFFSET
          ${offset}`
    );

    if (!users?.length) throw new Error("No users found");
    return { users };
  } catch (error) {
    throw new Error(`Error fetching users: ${error.message}`);
  }
};
