const express = require("express");

const AuditLog = require("../models/AuditLog");

const router = express.Router();







router.get("/", async (req, res) => {

    try {

        const logs =
            await AuditLog.find()
                .sort({
                    createdAt: -1
                })
                .limit(200);


        res.json(logs);

    } catch (error) {

        console.error(
            "Failed to fetch audit logs:",
            error
        );

        res.status(500).json({

            message:
                "Failed to fetch audit logs",

            error:
                error.message

        });

    }

});







router.post("/", async (req, res) => {

    try {

        const {
            action,
            entityType,
            entityId = null,
            details = {}
        } = req.body;



        if (
            !action ||
            !entityType
        ) {

            return res.status(400).json({

                message:
                    "action and entityType are required"

            });

        }


        const log =
            await AuditLog.create({

                action,

                entityType,

                entityId,

                details

            });


        res.status(201).json(log);

    } catch (error) {

        console.error(
            "Failed to create audit log:",
            error
        );

        res.status(500).json({

            message:
                "Failed to create audit log",

            error:
                error.message

        });

    }

});


module.exports = router;