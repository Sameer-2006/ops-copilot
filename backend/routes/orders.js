const express = require("express");
const mongoose = require("mongoose");

const Order = require("../models/order");
const Rider = require("../models/Rider");
const { findBestRider } = require("../services/routing");


const router = express.Router();





router.get("/", async (req, res) => {
    try {
        const orders = await Order.find();

        res.json(orders);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch orders",
            error: error.message
        });
    }
});

router.post("/", async (req, res) => {

    const session = await mongoose.startSession();

    try {


        const orderData = {
            pickup: req.body.pickup,
            delivery: req.body.delivery,
            weight: req.body.weight,
            priority: req.body.priority
        };

        const tempOrder = new Order(orderData);

        const bestCandidate = await findBestRider(tempOrder);






        if (!bestCandidate) {

            const savedOrder = await Order.create([orderData]);

            return res.status(201).json({
                message: "Order created but no suitable rider is available",
                order: savedOrder[0]
            });
        }






        session.startTransaction();



        const order = new Order({
            ...orderData,
            riderId: bestCandidate.rider._id,
            status: "ASSIGNED"
        });

        const savedOrders = await Order.create(
            [order],
            { session }
        );

        const savedOrder = savedOrders[0];



        const rider = await Rider.findById(
            bestCandidate.rider._id
        ).session(session);


        if (!rider) {
            throw new Error("Rider no longer exists");
        }


        rider.currentLoad += order.weight;

        await rider.save({ session });



        await session.commitTransaction();


        res.status(201).json({

            message: "Order created and assigned",

            order: savedOrder,

            assignment: {
                riderId: rider._id,
                riderName: rider.name,
                distanceToPickup: bestCandidate.distance,
                remainingCapacity:
                    rider.capacity - rider.currentLoad
            }

        });

    } catch (error) {


        await session.abortTransaction();

        console.error(error);

        res.status(500).json({
            message: "Failed to create and assign order",
            error: error.message
        });

    } finally {

        session.endSession();

    }
});





router.put("/:id", async (req, res) => {

    try {

        const { riderId } = req.body;


        if (!riderId) {
            return res.status(400).json({
                message: "riderId is required"
            });
        }


        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }


        const rider = await Rider.findById(riderId);

        if (!rider) {
            return res.status(404).json({
                message: "Rider not found"
            });
        }


        if (rider.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Rider is not active"
            });
        }


        if (order.riderId) {
            return res.status(400).json({
                message: "Order is already assigned to a rider"
            });
        }


        const remainingCapacity =
            rider.capacity - rider.currentLoad;

        if (remainingCapacity < order.weight) {
            return res.status(400).json({
                message: "Rider does not have enough capacity"
            });
        }


        order.riderId = rider._id;
        order.status = "ASSIGNED";


        rider.currentLoad += order.weight;

        await order.save();
        await rider.save();

        res.json({
            message: "Order assigned successfully",
            order,
            rider
        });

    } catch (error) {

        console.error(
            "Assign order error:",
            error
        );

        res.status(500).json({
            message: "Failed to assign order",
            error: error.message
        });

    }

});
module.exports = router;