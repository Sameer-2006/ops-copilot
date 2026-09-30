# Ops Copilot for Disrupted Deliveries

An AI-assisted delivery operations platform that helps dispatchers manage live riders, process photographed addresses, and handle rider disruptions through human-approved AI reassignment.
<img width="1887" height="907" alt="image" src="https://github.com/user-attachments/assets/df68ba04-5539-447c-a094-384ac3e7efbb" />
<img width="1881" height="906" alt="image" src="https://github.com/user-attachments/assets/5f4c1f70-521b-4d1f-b40a-37803872b272" />

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
