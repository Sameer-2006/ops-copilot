require("dotenv").config();

async function testAI() {
    try {

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                   model: "openrouter/free",

                    messages: [
                        {
                            role: "user",
                            content: `
You are a delivery operations assistant.

A rider named Rahul has broken down.

Order 1:
ID: order123
Weight: 2 kg
Priority: HIGH
Possible riders: rider456, rider789

Order 2:
ID: order456
Weight: 5 kg
Priority: MEDIUM
Possible riders: rider789

Suggest which rider should receive each order.

Only use the possible riders provided.
Do not invent any IDs.
Explain your answer briefly.
`
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        console.log("Status:", response.status);
        console.log("Response:");

        console.log(
            data.choices?.[0]?.message?.content || data
        );

    } catch (error) {

        console.error("ERROR:");
        console.error(error.message);

    }
}

testAI();