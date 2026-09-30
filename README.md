# Ops Copilot for Disrupted Deliveries

Ops Copilot is an AI-assisted delivery operations platform built to help dispatchers manage riders, orders, photographed addresses, and unexpected delivery disruptions from a single dashboard.

The core idea is simple:

> **AI recommends. The dispatcher decides.**

The system uses AI to reduce repetitive operational work, while keeping every important operational decision behind a human approval boundary.

---

## What the System Does

The application focuses on three major operational workflows:

1. **Live delivery operations**
   - Track active riders on a live map.
   - View delivery orders and their current states.
   - Receive real-time rider updates.

2. **Photographed address processing**
   - Upload an image containing a delivery address.
   - Extract text using OCR.
   - Use an LLM to convert the OCR output into a structured address.
   - Keep the result available for human review.

3. **Rider disruption handling**
   - Simulate a rider breakdown.
   - Identify affected orders.
   - Find available replacement riders.
   - Generate an AI reassignment proposal.
   - Let the dispatcher approve, edit, or reject the proposal.
   - Apply the reassignment only after explicit approval.

---

# Interface

The application is designed as a single operations dashboard so that a dispatcher can monitor the fleet and handle delivery issues without switching between multiple tools.

## Operations Dashboard

The main dashboard provides an overview of the current operation, including riders, orders, and the live operational map.

<img width="1887" height="907" alt="Operations Dashboard" src="https://github.com/user-attachments/assets/df68ba04-5539-447c-a094-384ac3e7efbb" />

## Operations View

The interface brings the operational workflow together in one place, allowing the dispatcher to move from monitoring riders to handling orders and disruptions.

<img width="1881" height="906" alt="Operations Interface" src="https://github.com/user-attachments/assets/5f4c1f70-521b-4d1f-b40a-37803872b272" />

---

# Tech Stack

## Frontend

### React

The dashboard is built using React.

React is responsible for:

- Rendering the operations dashboard
- Managing rider and order state
- Handling order creation
- Displaying OCR results
- Displaying AI reassignment proposals
- Handling dispatcher approval, editing, and rejection

### Vite

Vite is used as the frontend development and build tool.

### React Leaflet

React Leaflet is used for the operational map.

The map displays rider and delivery information and provides a visual view of the current operation.

### Socket.IO Client

Socket.IO is used for real-time updates between the backend and frontend.

For example:

```text
Backend
   ↓
riderUpdated event
   ↓
React Frontend
   ↓
Map / dashboard update
