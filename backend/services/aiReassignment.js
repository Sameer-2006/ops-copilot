const OpenAI = require("openai");

require("dotenv").config();

const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1"
});






async function generateReassignmentProposal(aiInput) {





    if (!aiInput) {
        throw new Error("AI input is missing");
    }

    if (!Array.isArray(aiInput.availableRiders)) {
        throw new Error("Available riders data is missing");
    }

    if (!Array.isArray(aiInput.affectedOrders)) {
        throw new Error("Affected orders data is missing");
    }

    if (aiInput.availableRiders.length === 0) {
        throw new Error(
            "No active riders available for reassignment"
        );
    }

    if (aiInput.affectedOrders.length === 0) {
        throw new Error(
            "No affected orders found"
        );
    }






    const validRiderIds = new Set(
        aiInput.availableRiders.map(
            rider => String(rider.riderId)
        )
    );






    const validOrderIds = new Set(
        aiInput.affectedOrders.map(
            order => String(order.orderId)
        )
    );






    const systemPrompt = `
You are an AI delivery reassignment assistant.

A delivery rider has broken down.

Your ONLY task is to propose reassignment of the affected
orders to the available replacement riders.

IMPORTANT RULES:

1. ONLY use riderId values that appear in AVAILABLE RIDERS.

2. NEVER invent a riderId.

3. NEVER use the broken rider's riderId.

4. NEVER return null as riderId.

5. NEVER return an empty riderId.

6. Every affected order MUST appear exactly once.

7. Every affected order MUST have exactly one riderId.

8. The orderId MUST be copied exactly from the affected orders.

9. The riderId MUST be copied exactly from AVAILABLE RIDERS.

10. Only choose riders who have enough remaining capacity.

11. Prefer riders who are closer to the pickup location.

12. HIGH priority orders should be considered important.

13. Do not modify IDs.

14. Do not create new IDs.

15. Do not omit affected orders.

16. Return ONLY valid JSON.

17. Do not use markdown.

18. Do not include explanations outside the JSON.

VERY IMPORTANT:

If AVAILABLE RIDERS contains:

{
    "riderId": "ABC123"
}

then the only valid value you can put in riderId is:

"ABC123"

You must COPY the exact riderId from the input.

Return exactly this structure:

{
    "proposal": [
        {
            "orderId": "EXACT_ORDER_ID",
            "riderId": "EXACT_AVAILABLE_RIDER_ID",
            "reason": "short reason"
        }
    ]
}
`;






    const userPrompt = `
AVAILABLE RIDERS:

${JSON.stringify(
    aiInput.availableRiders,
    null,
    2
)}


AFFECTED ORDERS:

${JSON.stringify(
    aiInput.affectedOrders,
    null,
    2
)}


BROKEN RIDER:

${JSON.stringify(
    {
        riderId: aiInput.brokenRiderId
    },
    null,
    2
)}


FINAL INSTRUCTIONS:

There are exactly:

${aiInput.availableRiders.length} available riders

and

${aiInput.affectedOrders.length} affected orders.

You MUST create exactly:

${aiInput.affectedOrders.length} proposal item(s).

Every proposal item MUST contain:

- one exact orderId from AFFECTED ORDERS
- one exact riderId from AVAILABLE RIDERS
- one short reason

Do NOT return null.

Do NOT return an empty string.

Do NOT invent IDs.

Copy the IDs exactly.
`;






    async function askAI() {

        const response =
            await client.chat.completions.create({

                model: "openrouter/free",

                messages: [

                    {
                        role: "system",
                        content: systemPrompt
                    },

                    {
                        role: "user",
                        content: userPrompt
                    }

                ],

                response_format: {
                    type: "json_object"
                }

            });


        const text =
            response?.choices?.[0]?.message?.content;


        if (!text) {

            throw new Error(
                "AI returned an empty response"
            );

        }


        let result;

        try {

            result = JSON.parse(text);

        } catch (error) {

            throw new Error(
                "AI returned invalid JSON"
            );

        }


        return result;

    }






    let result;

    try {

        result = await askAI();

    } catch (error) {

        console.error(
            "First AI attempt failed:",
            error.message
        );





        try {

            result = await askAI();

        } catch (retryError) {

            throw new Error(
                `AI reassignment failed after retry: ${retryError.message}`
            );

        }

    }






    if (
        !result ||
        !Array.isArray(result.proposal)
    ) {

        throw new Error(
            "AI returned invalid reassignment proposal"
        );

    }






    if (
        result.proposal.length !==
        aiInput.affectedOrders.length
    ) {

        throw new Error(
            "AI did not provide a reassignment for every affected order"
        );

    }






    const assignedOrders = new Set();

    const proposal =
        result.proposal.map(item => {

            const orderId =
                String(item?.orderId || "");

            const riderId =
                String(item?.riderId || "");

            const reason =
                String(
                    item?.reason ||
                    "AI reassignment based on capacity and location"
                );






            if (!orderId) {

                throw new Error(
                    "AI returned an empty orderId"
                );

            }


            if (!validOrderIds.has(orderId)) {

                throw new Error(
                    `AI returned invalid orderId: ${orderId}`
                );

            }






            if (assignedOrders.has(orderId)) {

                throw new Error(
                    `AI assigned order ${orderId} more than once`
                );

            }

            assignedOrders.add(orderId);






            if (!riderId) {

                throw new Error(
                    `AI returned null/empty riderId for order ${orderId}`
                );

            }


            if (!validRiderIds.has(riderId)) {

                throw new Error(
                    `AI returned invalid riderId for order ${orderId}: ${riderId}`
                );

            }






            if (
                aiInput.brokenRiderId &&
                riderId === String(aiInput.brokenRiderId)
            ) {

                throw new Error(
                    `AI attempted to reassign order ${orderId} to the broken rider`
                );

            }






            return {

                orderId,

                riderId,

                reason

            };

        });






    if (
        assignedOrders.size !==
        aiInput.affectedOrders.length
    ) {

        throw new Error(
            "Not all affected orders were reassigned"
        );

    }






    return {

        proposal

    };

}


module.exports = {

    generateReassignmentProposal

};