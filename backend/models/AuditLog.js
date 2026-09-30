const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true
        },

        entityType: {
            type: String,
            required: true
        },

        entityId: {
            type: String,
            default: null
        },

        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

const AuditLog = mongoose.model(
    "AuditLog",
    auditLogSchema
);

module.exports = AuditLog;