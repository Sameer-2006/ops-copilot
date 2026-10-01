const express = require("express");
const mongoose = require("mongoose");

const Rider = require("../models/Rider");
const Order = require("../models/order");
const AuditLog = require("../models/AuditLog");

const {
    calculateDistance
} = require("../services/routing");

const {
    generateReassignmentProposal
} = require("../services/aiReassignment");

module.exports = (io) => {

    const router = express.Router();




    router.get("/", async (req, res) => {

        try {

            const riders = await Rider.find();

            res.json(riders);

        } catch (error) {

            res.status(500).json({
                message: "Failed to fetch riders",
                error: error.message
            });

        }

    });




    router.post("/", async (req, res) => {

        try {

            const rider = new Rider({
                name: req.body.name,
                capacity: req.body.capacity,
                currentLoad: req.body.currentLoad || 0,
                status: req.body.status || "ACTIVE",
                location: req.body.location
            });

            const savedRider = await rider.save();

            res.status(201).json(savedRider);

        } catch (error) {

            res.status(500).json({
                message: "Failed to create rider",
                error: error.message
            });

        }

    });




    router.put("/:id/location", async (req, res) => {

        try {

            const rider = await Rider.findById(req.params.id);

            if (!rider) {

                return res.status(404).json({
                    message: "Rider not found"
                });

            }

            rider.location.lat = req.body.lat;
            rider.location.lng = req.body.lng;

            const updatedRider = await rider.save();

            io.emit(
                "riderUpdated",
                updatedRider.toObject()
            );

            res.json({
                message: "Rider location updated",
                rider: updatedRider
            });

        } catch (error) {

            res.status(500).json({
                message: "Failed to update rider location",
                error: error.message
            });

        }

    });




    router.get("/:id/affected-orders", async (req, res) => {

        try {

            const orders = await Order.find({
                riderId: req.params.id,
                status: {
                    $in: ["ASSIGNED", "IN_TRANSIT"]
                }
            });

            res.json({
                riderId: req.params.id,
                affectedOrders: orders
            });

        } catch (error) {

            res.status(500).json({
                message: "Failed to find affected orders",
                error: error.message
            });

        }

    });




    router.get("/:id/reassignment-candidates", async (req, res) => {

        try {

            const brokenRider = await Rider.findById(
                req.params.id
            );

            if (!brokenRider) {

                return res.status(404).json({
                    message: "Rider not found"
                });

            }

            const affectedOrders = await Order.find({
                riderId: brokenRider._id,
                status: {
                    $in: ["ASSIGNED", "IN_TRANSIT"]
                }
            });

            const availableRiders = await Rider.find({
                status: "ACTIVE",
                _id: {
                    $ne: brokenRider._id
                }
            });

            const candidates = affectedOrders.map((order) => {

                const possibleRiders = availableRiders

                    .filter((rider) => {

                        const remainingCapacity =
                            rider.capacity -
                            rider.currentLoad;

                        return remainingCapacity >= order.weight;

                    })

                    .map((rider) => {

                        const distance =
                            calculateDistance(
                                rider.location.lat,
                                rider.location.lng,
                                order.pickup.lat,
                                order.pickup.lng
                            );

                        return {

                            riderId: rider._id,

                            riderName: rider.name,

                            remainingCapacity:
                                rider.capacity -
                                rider.currentLoad,

                            distanceToPickup:
                                distance

                        };

                    });


                return {

                    orderId: order._id,

                    weight: order.weight,

                    priority: order.priority,

                    pickup: order.pickup,

                    delivery: order.delivery,

                    possibleRiders

                };

            });


            res.json({

                brokenRider: {

                    riderId: brokenRider._id,

                    riderName: brokenRider.name

                },

                affectedOrders: candidates

            });


        } catch (error) {

            console.error(error);

            res.status(500).json({

                message:
                    "Failed to find reassignment candidates",

                error:
                    error.message

            });

        }

    });




    router.post("/:id/ai-reassignment", async (req, res) => {

        try {


            const brokenRider = await Rider.findById(
                req.params.id
            );

            if (!brokenRider) {

                return res.status(404).json({
                    message: "Rider not found"
                });

            }



            const affectedOrders = await Order.find({
                riderId: brokenRider._id,
                status: {
                    $in: ["ASSIGNED", "IN_TRANSIT"]
                }
            });



            const availableRiders = await Rider.find({
                status: "ACTIVE",
                _id: {
                    $ne: brokenRider._id
                }
            });



            const candidates = affectedOrders.map((order) => {

                const possibleRiders = availableRiders

                    .filter((rider) => {

                        const remainingCapacity =
                            rider.capacity -
                            rider.currentLoad;

                        return remainingCapacity >= order.weight;

                    })

                    .map((rider) => {

                        const distance =
                            calculateDistance(
                                rider.location.lat,
                                rider.location.lng,
                                order.pickup.lat,
                                order.pickup.lng
                            );

                        return {

                            riderId:
                                rider._id.toString(),

                            riderName:
                                rider.name,

                            remainingCapacity:
                                rider.capacity -
                                rider.currentLoad,

                            distanceToPickup:
                                distance

                        };

                    });


                return {

                    orderId:
                        order._id.toString(),

                    weight:
                        order.weight,

                    priority:
                        order.priority,

                    pickup:
                        order.pickup,

                    delivery:
                        order.delivery,

                    possibleRiders

                };

            });



            const aiInput = {

    brokenRiderId:
        brokenRider._id.toString(),

    availableRiders:
        availableRiders.map((rider) => ({

            riderId:
                rider._id.toString(),

            riderName:
                rider.name,

            remainingCapacity:
                rider.capacity -
                rider.currentLoad,

            location:
                rider.location

        })),

    affectedOrders:
        candidates

};



            const proposal =
                await generateReassignmentProposal(
                    aiInput
                );



            try {

                await AuditLog.create({

                    action:
                        "AI_REASSIGNMENT_PROPOSED",

                    entityType:
                        "RIDER",

                    entityId:
                        brokenRider._id.toString(),

                    details: {

                        brokenRiderId:
                            brokenRider._id.toString(),

                        affectedOrderCount:
                            affectedOrders.length,

                        proposal:
                            proposal.proposal || []

                    }

                });

            } catch (auditError) {

                console.error(
                    "Audit log error:",
                    auditError.message
                );

            }



            res.json({

                message:
                    "AI reassignment proposal generated",

                proposal

            });

        } catch (error) {

            console.error(
                "AI reassignment error:",
                error
            );

            res.status(500).json({

                message:
                    "Failed to generate AI reassignment proposal",

                error:
                    error.message

            });

        }

    });




    router.post(
        "/:id/approve-reassignment",
        async (req, res) => {

            const session =
                await mongoose.startSession();

            try {

                const brokenRiderId =
                    req.params.id;

                const proposal =
                    req.body.proposal;






                if (
                    !proposal ||
                    !Array.isArray(proposal) ||
                    proposal.length === 0
                ) {

                    return res.status(400).json({

                        message:
                            "Invalid reassignment proposal"

                    });

                }






                for (const item of proposal) {

                    if (!item.orderId) {

                        throw new Error(
                            "Proposal contains missing orderId"
                        );

                    }

                    if (!item.riderId) {

                        throw new Error(
                            `Proposal for order ${item.orderId} has no riderId`
                        );

                    }

                    if (
                        !mongoose.Types.ObjectId.isValid(
                            item.orderId
                        )
                    ) {

                        throw new Error(
                            `Invalid orderId: ${item.orderId}`
                        );

                    }

                    if (
                        !mongoose.Types.ObjectId.isValid(
                            item.riderId
                        )
                    ) {

                        throw new Error(
                            `Invalid riderId: ${item.riderId}`
                        );

                    }

                }






                const brokenRider =
                    await Rider.findById(
                        brokenRiderId
                    );

                if (!brokenRider) {

                    return res.status(404).json({

                        message:
                            "Broken rider not found"

                    });

                }






                session.startTransaction();


                const riderLoads = {};






                for (const item of proposal) {

                    const order =
                        await Order.findById(
                            item.orderId
                        ).session(session);


                    if (!order) {

                        throw new Error(
                            `Order ${item.orderId} does not exist`
                        );

                    }




                    if (
                        order.riderId &&
                        order.riderId.toString()
                            !== brokenRiderId
                    ) {

                        throw new Error(
                            `Order ${item.orderId} is no longer assigned to the broken rider`
                        );

                    }




                    if (
                        order.status !== "ASSIGNED" &&
                        order.status !== "IN_TRANSIT"
                    ) {

                        throw new Error(
                            `Order ${item.orderId} cannot be reassigned`
                        );

                    }


                    const newRider =
                        await Rider.findById(
                            item.riderId
                        ).session(session);


                    if (!newRider) {

                        throw new Error(
                            `Rider ${item.riderId} does not exist`
                        );

                    }



                    if (
                        newRider._id.toString()
                            === brokenRiderId
                    ) {

                        throw new Error(
                            "Cannot assign an order back to the broken rider"
                        );

                    }



                    if (
                        newRider.status !== "ACTIVE"
                    ) {

                        throw new Error(
                            `${newRider.name} is not active`
                        );

                    }



                    const riderId =
                        newRider._id.toString();


                    if (
                        riderLoads[riderId]
                        === undefined
                    ) {

                        riderLoads[riderId] =
                            newRider.currentLoad;

                    }


                    const projectedLoad =
                        riderLoads[riderId]
                        + order.weight;


                    if (
                        projectedLoad >
                        newRider.capacity
                    ) {

                        throw new Error(
                            `${newRider.name} does not have enough capacity for order ${order._id}`
                        );

                    }


                    riderLoads[riderId] =
                        projectedLoad;

                }






                for (const item of proposal) {

                    const order =
                        await Order.findById(
                            item.orderId
                        ).session(session);


                    const oldRider =
                        await Rider.findById(
                            brokenRiderId
                        ).session(session);


                    const newRider =
                        await Rider.findById(
                            item.riderId
                        ).session(session);



                    order.riderId =
                        newRider._id;

                    await order.save({
                        session
                    });



                    oldRider.currentLoad =
                        Math.max(
                            0,
                            oldRider.currentLoad -
                            order.weight
                        );



                    newRider.currentLoad +=
                        order.weight;


                    await oldRider.save({
                        session
                    });

                    await newRider.save({
                        session
                    });

                }






                await session.commitTransaction();






                try {

                    await AuditLog.create({

                        action:
                            "REASSIGNMENT_APPROVED",

                        entityType:
                            "RIDER",

                        entityId:
                            brokenRiderId,

                        details: {

                            brokenRiderId,

                            reassignedOrders:
                                proposal

                        }

                    });

                } catch (auditError) {

                    console.error(
                        "Audit log error:",
                        auditError.message
                    );

                }


                res.json({

                    message:
                        "Reassignment approved successfully",

                    reassignedOrders:
                        proposal

                });


            } catch (error) {

                await session.abortTransaction();

                console.error(
                    "Approval error:",
                    error
                );

                res.status(400).json({

                    message:
                        "Reassignment rejected by server",

                    error:
                        error.message

                });

            } finally {

                session.endSession();

            }

        }
    );


    return router;

};