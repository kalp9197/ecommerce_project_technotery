import { HTTP_STATUS } from "../../constants/index.js";
import { paymentService } from "../../services/index.js";

// Get all transactions
export const getAllTransactions = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const transactions = await paymentService.getAllTransactions(page, limit);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Transactions fetched successfully",
      data: transactions,
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to fetch transactions: ${error.message}`,
    });
  }
};
