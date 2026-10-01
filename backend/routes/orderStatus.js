const express = require("express");

const Order =
    require("../models/order");

const AuditLog =
    require("../models/AuditLog");

const router = express.Router();


const allowedTransitions = {

    UNASSIGNED: [
        "ASSIGNED",
        "FAILED"
    ],

    ASSIGNED: [
        "IN_TRANSIT",
        "FAILED"
    ],

    IN_TRANSIT: [
        "DELIVERED",
        "FAILED"
    ],

    DELIVERED: [],

    FAILED: []

};


router.put(
    "/:id/status",
    async (req, res) => {

        try {

            const {
                status
            } = req.body;


            const order =
                await Order.findById(
                    req.params.id
                );


            if (!order) {

                return res.status(404).json({
                    message:
                        "Order not found"
                });

            }


            if (
                !allowedTransitions[
                    order.status
                ]?.includes(status)
            ) {

                return res.status(400).json({

                    message:
                        `Invalid transition: ${order.status} → ${status}`

                });

            }


            const oldStatus =
                order.status;


            order.status =
                status;


            await order.save();


            await AuditLog.create({

                action:
                    "ORDER_STATUS_CHANGED",

                entityType:
                    "ORDER",

                entityId:
                    order._id.toString(),

                details: {

                    oldStatus,

                    newStatus:
                        status

                }

            });


            res.json({

                message:
                    "Order status updated",

                order

            });

        } catch (error) {

            console.error(
                "Status update failed:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to update order status",

                error:
                    error.message

            });

        }

    }
);


module.exports = router;