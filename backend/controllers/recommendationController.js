import { getUserAnalytics } from "../services/analyticsService.js";
import { getRecommendationsFromGemini } from "../services/geminiService.js";
import { getProductByUuid } from "../models/productModel.js";
import * as dbService from "../services/dbService.js";

async function GetPersonalizedUserRecommendations(req, res) {
    const { uuid } = req.params;

    try {
        const userAnalyticsData = await getUserAnalytics(uuid);
        if (!userAnalyticsData?.length) {
            return res.status(404).json({
                message: "No analytics data found for this user.",
                recommendations: []
            });
        }

        const relevantEvents = userAnalyticsData.filter(event =>
            ["add_to_cart", "remove_from_cart", "add_to_wishlist", "remove_from_wishlist"]
            .includes(event.event_type)
        );

        if (!relevantEvents.length) {
            return res.status(200).json({
                message: "Not enough relevant activity to generate recommendations.",
                recommendations: []
            });
        }

        const geminiResponse = await getRecommendationsFromGemini(relevantEvents);
        const detailedRecommendations = [];

        for (const rec of geminiResponse.recommendations || []) {
            try {
                let productUuid = rec;

                if (/^\d+$/.test(String(rec))) {
                    const rows = await dbService.query(
                        `SELECT uuid FROM products WHERE id = ? AND is_active = 1 LIMIT 1`,
                        [rec]
                    );
                    productUuid = rows?.[0]?.uuid;
                    if (!productUuid) continue;
                }

                const product = await getProductByUuid(productUuid);
                if (product) detailedRecommendations.push(product);
            } catch (err) {
                console.error(`Failed to process recommendation ${rec}:`, err.message);
            }
        }

        return res.status(200).json({
            message: "Recommendations generated successfully.",
            uuid,
            comment: geminiResponse.comment || "No comment generated.",
            recommendations: detailedRecommendations
        });

    } catch (error) {
        console.error(`Error getting recommendations for user ${uuid}:`, error);
        return res.status(500).json({
            error: "Failed to generate recommendations.",
            details: error.message
        });
    }
}

export { GetPersonalizedUserRecommendations };