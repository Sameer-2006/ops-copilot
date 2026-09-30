const Rider = require("../models/Rider");



function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth radius in km

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );

    return R * c;
}



function getPriorityMultiplier(priority) {
    if (priority === "HIGH") return 3;
    if (priority === "MEDIUM") return 2;
    return 1;
}



async function findBestRider(order) {


    const riders = await Rider.find({
        status: "ACTIVE"
    });



    const validRiders = riders.filter((rider) => {

        const remainingCapacity =
            rider.capacity - rider.currentLoad;

        return remainingCapacity >= order.weight;
    });



    if (validRiders.length === 0) {
        return null;
    }



    const candidates = validRiders.map((rider) => {

        const distance = calculateDistance(
            rider.location.lat,
            rider.location.lng,
            order.pickup.lat,
            order.pickup.lng
        );

        const remainingCapacity =
            rider.capacity - rider.currentLoad;

        const priorityMultiplier =
            getPriorityMultiplier(order.priority);


        /*
            Higher priority → distance matters more.

            Example:

            HIGH   → distance / 3
            MEDIUM → distance / 2
            LOW    → distance / 1
        */

        const score = distance / priorityMultiplier;


        return {
            rider,
            distance,
            remainingCapacity,
            score
        };
    });



    candidates.sort((a, b) => {

        if (a.score !== b.score) {
            return a.score - b.score;
        }



        return b.remainingCapacity - a.remainingCapacity;
    });


    return candidates[0];
}


module.exports = {
    findBestRider,
    calculateDistance
};