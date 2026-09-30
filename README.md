# Ops Copilot for Disrupted Deliveries

An AI-assisted delivery operations platform that helps dispatchers manage live riders, process photographed addresses, and handle rider disruptions through human-approved AI reassignment.

## Problem

Delivery operations can become difficult when:

- A delivery address is provided as a photograph instead of clean text.
- A rider's bag becomes full or the rider breaks down.
- Remaining orders need to be reassigned while considering rider capacity, location, distance, and priority.
- AI suggestions need to be reviewed before affecting real order assignments.

Ops Copilot provides a single dashboard for handling these situations while keeping the dispatcher in control.

## Key Features

### Live Operations Dashboard

- View active delivery riders on a live map.
- View delivery orders and their current states.
- Receive live rider location updates.
- Keep unassigned orders visible.

### AI-Powered Address Processing

The system accepts a photograph of a delivery address.

```text
Address Image
     ↓
TrOCR
     ↓
Raw OCR Text
     ↓
LLM
     ↓
Structured Address
     ↓
Human Review
