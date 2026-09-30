require("dotenv").config();

const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1"
});

async function parseAddress(ocrText) {

    if (!ocrText || !ocrText.trim()) {
        throw new Error("OCR returned empty text");
    }

    console.log("Sending OCR text to address AI:");
    console.log(ocrText);

    const response =
        await client.chat.completions.create({


            model: "openrouter/free",

            messages: [

                {
                    role: "system",

                    content: `
You are an address extraction assistant.

Convert OCR text into a structured delivery address.

The OCR may contain spelling mistakes.

For example:

DHANDED may actually mean DHANBAD.
MERTHAND may actually mean JHARKHAND.

Correct obvious OCR mistakes when the intended location is strongly
supported by the complete address.

Do not invent unrelated information.

Return ONLY valid JSON.

Use exactly these fields:

{
  "house_number": null,
  "street": null,
  "city": null,
  "state": null,
  "postal_code": null,
  "country": null
}

Rules:

- house_number = house/building number
- street = street or road name
- city = city
- state = state
- postal_code = PIN/postal code
- country = country if present
- If a field cannot be determined, use null.
`
                },

                {
                    role: "user",

                    content:
                        `OCR TEXT:\n${ocrText}`
                }

            ]

        });


    const text =
        response.choices?.[0]?.message?.content;

    console.log("AI raw response:");
    console.log(text);


    if (!text) {
        throw new Error(
            "Address AI returned an empty response"
        );
    }



    const cleaned =
        text
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();


    let result;

    try {

        result =
            JSON.parse(cleaned);

    } catch (error) {

        console.error(
            "Invalid JSON from address AI:",
            cleaned
        );

        throw new Error(
            "Address AI returned invalid JSON"
        );

    }


    return normalizeAddress(result);
}


function normalizeAddress(data) {

    return {

        house_number:
            data.house_number ??
            data.houseNumber ??
            null,

        street:
            data.street ??
            data.street_address ??
            null,

        city:
            data.city ??
            null,

        state:
            data.state ??
            null,

        postal_code:
            data.postal_code ??
            data.pincode ??
            data.pin_code ??
            null,

        country:
            data.country ??
            null

    };

}


module.exports = {
    parseAddress
};