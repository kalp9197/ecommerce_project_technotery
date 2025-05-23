import { userAnalyticsModel } from "../models/index.js";
import { HTTP_STATUS } from "../constants/index.js";
import { dbService } from "../services/index.js";

export const trackEvent = async (userId, eventType, data) => {
  try {
    return await userAnalyticsModel.trackEvent(userId, eventType, data);
  } catch (error) {
    console.error(`An error occurred while tracking user event : ${error.message}`);
    return false;
  }
};

export const getUserAnalytics = async (req, res) => {
  try {
    const { userUuid, eventType, limit, offset } = req.query;

    if (!userUuid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "User UUID is required",
      });
    }

    const userResult = await dbService.query(
      "SELECT id FROM users WHERE uuid = ?",
      [userUuid]
    );
    if (!userResult?.length) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    const analytics = await userAnalyticsModel.getUserAnalytics(
      userResult[0].id,
      {
        eventType,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      }
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "User analytics retrieved successfully",
      data: analytics,
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `An error occurred while retrieving user analytics : ${error.message}`,
    });
  }
};
