const express = require("express");
const multer = require("multer");

const {
    runOCR
} = require("../services/ocrService");

const {
    parseAddress
} = require("../services/addressParser");

const AuditLog =
    require("../models/AuditLog");

const router = express.Router();






const upload = multer({

    storage:
        multer.memoryStorage(),

    limits: {
        fileSize:
            10 * 1024 * 1024
    },

    fileFilter:
        (req, file, cb) => {

            const allowed = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];

            if (
                allowed.includes(
                    file.mimetype
                )
            ) {

                cb(null, true);

            } else {

                cb(
                    new Error(
                        "Only JPG, PNG and WEBP images are allowed"
                    )
                );

            }

        }

});






function calculateAddressConfidence(
    address
) {

    if (!address) {
        return 0;
    }

    let score = 0;

    if (
        address.house_number ||
        address.street
    ) {
        score += 0.30;
    }

    if (address.city) {
        score += 0.25;
    }

    if (address.state) {
        score += 0.20;
    }

    if (address.postal_code) {
        score += 0.20;
    }

    if (address.country) {
        score += 0.05;
    }

    return Number(
        score.toFixed(2)
    );
}






router.post(
    "/process",
    upload.single("file"),

    async (req, res) => {

        let ocrText = "";

        try {

            if (!req.file) {

                return res.status(400).json({
                    message:
                        "Address image is required"
                });

            }






            try {

                const ocrResult =
                    await runOCR(req.file);

                ocrText =
                    ocrResult.text?.trim() || "";

            } catch (ocrError) {

                console.error(
                    "OCR failed:",
                    ocrError.message
                );

                await AuditLog.create({
                    action:
                        "OCR_FAILED",

                    entityType:
                        "ADDRESS",

                    details: {
                        filename:
                            req.file.originalname,

                        error:
                            ocrError.message
                    }
                });

                return res.status(200).json({

                    success: false,

                    placementStatus:
                        "UNPLACED",

                    confidence:
                        0,

                    ocrText: "",

                    structuredAddress:
                        null,

                    requiresHumanReview:
                        true,

                    reason:
                        "OCR failed. Manual address entry required."

                });

            }






            if (!ocrText) {

                await AuditLog.create({

                    action:
                        "OCR_EMPTY",

                    entityType:
                        "ADDRESS",

                    details: {
                        filename:
                            req.file.originalname
                    }

                });

                return res.status(200).json({

                    success: false,

                    placementStatus:
                        "UNPLACED",

                    confidence:
                        0,

                    ocrText: "",

                    structuredAddress:
                        null,

                    requiresHumanReview:
                        true,

                    reason:
                        "No readable text detected."

                });

            }






            let structuredAddress;

            try {

                structuredAddress =
                    await parseAddress(
                        ocrText
                    );

            } catch (llmError) {

                console.error(
                    "LLM failed:",
                    llmError.message
                );

                await AuditLog.create({

                    action:
                        "ADDRESS_LLM_FAILED",

                    entityType:
                        "ADDRESS",

                    details: {

                        ocrText,

                        error:
                            llmError.message

                    }

                });

                return res.status(200).json({

                    success: false,

                    placementStatus:
                        "UNPLACED",

                    confidence:
                        0,

                    ocrText,

                    structuredAddress:
                        null,

                    requiresHumanReview:
                        true,

                    reason:
                        "Address AI processing failed. Manual review required."

                });

            }






            const confidence =
                calculateAddressConfidence(
                    structuredAddress
                );


            const placementStatus =
                confidence >= 0.5
                    ? "READY_FOR_REVIEW"
                    : "UNPLACED";






            await AuditLog.create({

                action:
                    "ADDRESS_PROCESSED",

                entityType:
                    "ADDRESS",

                details: {

                    filename:
                        req.file.originalname,

                    ocrText,

                    structuredAddress,

                    confidence,

                    placementStatus

                }

            });






            return res.json({

                success: true,

                placementStatus,

                confidence,

                ocrText,

                structuredAddress,

                requiresHumanReview:
                    true

            });


        } catch (error) {

            console.error(
                "Address processing error:",
                error
            );

            return res.status(500).json({

                success: false,

                placementStatus:
                    "UNPLACED",

                confidence:
                    0,

                ocrText,

                structuredAddress:
                    null,

                requiresHumanReview:
                    true,

                message:
                    "Address processing failed",

                error:
                    error.message

            });

        }

    }
);






router.post(
    "/geocode",
    async (req, res) => {

        try {

            const address =
                req.body.address?.trim();

            if (!address) {

                return res.status(400).json({
                    message:
                        "Address is required"
                });

            }






            const queries = [
                address
            ];



            const withoutHouseNumber =
                address.replace(
                    /^\s*\d+\s*,?\s*/,
                    ""
                );

            if (
                withoutHouseNumber &&
                withoutHouseNumber !== address
            ) {

                queries.push(
                    withoutHouseNumber
                );

            }



            const parts =
                address
                    .split(",")
                    .map(
                        part => part.trim()
                    )
                    .filter(Boolean);


            if (parts.length >= 3) {

                const cityStatePin =
                    parts
                        .slice(-3)
                        .join(", ");

                queries.push(
                    cityStatePin
                );

            }






            const uniqueQueries =
                [...new Set(queries)];






            for (
                const query
                of uniqueQueries
            ) {

                console.log(
                    "Geocoding:",
                    query
                );


                const url =
                    "https://nominatim.openstreetmap.org/search" +
                    `?format=jsonv2` +
                    `&limit=1` +
                    `&countrycodes=in` +
                    `&q=${encodeURIComponent(
                        query
                    )}`;


                const response =
                    await fetch(
                        url,
                        {
                            headers: {
                                "User-Agent":
                                    "Ops-Copilot-Hackathon/1.0"
                            }
                        }
                    );


                if (!response.ok) {

                    continue;

                }


                const results =
                    await response.json();


                if (
                    results &&
                    results.length > 0
                ) {

                    const result =
                        results[0];


                    const location = {

                        lat:
                            Number(
                                result.lat
                            ),

                        lng:
                            Number(
                                result.lon
                            )

                    };


                    console.log(
                        "Location found:",
                        location
                    );


                    await AuditLog.create({

                        action:
                            "ADDRESS_GEOCODED",

                        entityType:
                            "ADDRESS",

                        details: {

                            originalAddress:
                                address,

                            geocodedQuery:
                                query,

                            location,

                            displayName:
                                result.display_name

                        }

                    });


                    return res.json({

                        success: true,

                        location,

                        displayName:
                            result.display_name,

                        matchedQuery:
                            query

                    });

                }

            }






            await AuditLog.create({

                action:
                    "GEOCODING_FAILED",

                entityType:
                    "ADDRESS",

                details: {

                    address,

                    attemptedQueries:
                        uniqueQueries

                }

            });


            return res.status(404).json({

                success: false,

                message:
                    "Could not locate this address",

                attemptedQueries:
                    uniqueQueries

            });


        } catch (error) {

            console.error(
                "Geocoding failed:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Geocoding service failed",

                error:
                    error.message

            });

        }

    }
);


module.exports = router;