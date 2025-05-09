import { userModel } from "../../models/admin/index.js";
import { HTTP_STATUS } from "../../constants/index.js";

export const getAllUsers = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid page or limit value",
      });
    }

    const result = await userModel.getAllUsers(page, limit);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Users fetched successfully",
      data: result.users,
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
