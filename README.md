# Ops Copilot for Disrupted Deliveries

Ops Copilot is an AI-assisted delivery operations platform designed to help dispatchers manage riders, orders, photographed addresses, and unexpected delivery disruptions from a single dashboard.

The system combines real-time rider tracking, order management, OCR-based address processing, LLM-assisted decision making, human approval, and audit logging.

> **AI recommends. The dispatcher decides.**

---

## Overview

The application addresses three main operational situations:

- Monitoring riders and orders in real time.
- Converting photographed delivery addresses into structured information.
- Handling rider disruptions by generating AI-assisted reassignment proposals.

The AI is used as a decision-support layer. It does not directly modify operational assignments.

```text
                    Operations Dashboard
                            |
             +--------------+--------------+
             |              |              |
           Riders         Orders           Map
                            |
                 +----------+----------+
                 |                     |
                 v                     v
          Address Processing    Rider Disruption
                 |                     |
                 v                     v
              TrOCR              Affected Orders
                 |                     |
                 v                     v
                LLM              AI Proposal
                 |                     |
                 v                     v
       Structured Address       Dispatcher Review
                                       |
                              +--------+--------+
                              |        |        |
                           Approve    Edit    Reject
                              |
                              v
                       Database Update
                              |
                              v
                         Audit Log
```

---

# Interface

The application provides a single operations dashboard for monitoring riders, orders, and delivery activity.

## Operations Dashboard

<img width="1887" height="907" alt="Operations Dashboard" src="https://github.com/user-attachments/assets/df68ba04-5539-447c-a094-384ac3e7efbb" />

## Operations View

<img width="1881" height="906" alt="Operations Interface" src="https://github.com/user-attachments/assets/5f4c1f70-521b-4d1f-b40a-37803872b272" />

---

# Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React | Operations dashboard and UI |
| Build Tool | Vite | Frontend development/build |
| Map | Leaflet / React Leaflet | Rider and delivery visualization |
| Real-time | Socket.IO | Live rider/order updates |
| Backend | Node.js + Express | REST APIs and business logic |
| Database | MongoDB | Riders, orders, assignments, logs |
| ODM | Mongoose | MongoDB data access |
| OCR Service | Python + FastAPI | Dedicated image-processing service |
| OCR Model | `microsoft/trocr-base-printed` | Extract text from address images |
| ML Framework | PyTorch | TrOCR runtime |
| NLP | Hugging Face Transformers | TrOCR integration |
| LLM | OpenRouter `openrouter/free` | Address structuring and reassignment proposals |
| API Interface | OpenAI-compatible API | Backend communication with OpenRouter |

---

# System Architecture

```text
                         Browser
                            |
                            v
                    React + Vite
                            |
                    REST / Socket.IO
                            |
                            v
                   Node.js + Express
                  +---------+---------+
                  |         |         |
                  v         v         v
               MongoDB     OCR     OpenRouter
                           Service      |
                              |         v
                              v        LLM
                            TrOCR
```

The OCR service is separated from the Node.js backend because TrOCR runs using Python, PyTorch, and Hugging Face Transformers.

---

# Live Operations

The frontend displays:

- Active riders
- Rider locations
- Delivery orders
- Order states
- Unassigned orders
- Operational information

Socket.IO is used for real-time updates.

For example:

```text
Rider location changes
        |
        v
Backend updates rider
        |
        v
Socket.IO event
        |
        v
Frontend receives event
        |
        v
Map updates
```

REST APIs are used for normal data operations, while Socket.IO handles real-time events.

---

# Address Processing

A delivery address may arrive as an image instead of clean text.

The application processes it through a two-stage AI pipeline.

```text
Address Image
      |
      v
FastAPI OCR Service
      |
      v
Microsoft TrOCR
      |
      v
Raw OCR Text
      |
      v
OpenRouter LLM
      |
      v
Structured Address
      |
      v
Review / Placement
```

## OCR

The OCR service uses:

```text
microsoft/trocr-base-printed
```

with:

- Python
- FastAPI
- PyTorch
- Hugging Face Transformers

TrOCR is responsible for reading the text visible in the image.

Example raw OCR output:

```text
125 MAIN STREET, DHANDED, MERTHAND, 828001
```

OCR output is not assumed to be perfectly structured or accurate.

---

## Address Structuring

The raw OCR text is passed to an LLM through OpenRouter.

The application uses:

```text
openrouter/free
```

The LLM converts the OCR output into structured fields such as:

```json
{
  "house_number": "125",
  "street": "MAIN STREET",
  "city": "DHANBAD",
  "state": "JHARKHAND",
  "postal_code": "828001",
  "country": null
}
```

The original OCR text is retained so the dispatcher can inspect the extracted text.

If processing fails or requires review, the system does not silently continue with an unverified result.

---

# Rider Disruption and AI Reassignment

When a rider breaks down, the system identifies the orders affected by that rider.

It then gathers available replacement riders and relevant operational information.

The AI receives information such as:

- Available rider IDs
- Rider status
- Rider capacity
- Current rider load
- Rider location
- Affected orders
- Order priority
- Order information
- Broken rider information

The LLM produces a structured reassignment proposal.

Example:

```json
{
  "proposal": [
    {
      "orderId": "order_id",
      "riderId": "replacement_rider_id",
      "reason": "Closest available rider with sufficient capacity"
    }
  ]
}
```

---

# Human Approval Boundary

The AI proposal is **not automatically applied**.

The complete flow is:

```text
Rider Breakdown
      |
      v
Affected Orders
      |
      v
Available Riders
      |
      v
AI Reassignment Proposal
      |
      v
Backend Validation
      |
      v
Dispatcher Review
      |
 +----+----+
 |    |    |
 v    v    v
Approve Edit Reject
 |    |
 |    v
 | Re-validation
 |    |
 +----+
      |
      v
Database Update
```

The dispatcher can:

### Approve

Apply the validated proposal.

### Edit

Modify the proposal and then validate the edited version before applying it.

### Reject

Discard the proposal without changing the assignments.

This creates a strict human-in-the-loop boundary:

> **The AI proposes. The dispatcher makes the final decision.**

---

# Backend Validation

AI output is treated as untrusted input.

Before an assignment can be applied, the backend validates:

- Rider IDs
- Order IDs
- Affected-order coverage
- Duplicate orders
- Rider availability
- Rider capacity
- Broken rider exclusion
- Current order ownership
- Current order state

This prevents an invalid AI response from directly changing operational data.

The database is therefore the source of truth, not the LLM.

---

# Order Lifecycle

Orders use explicit states:

```text
UNASSIGNED
ASSIGNED
IN_TRANSIT
DELIVERED
FAILED
```

Orders remain visible throughout their lifecycle.

For example:

```text
ASSIGNED
   |
   v
Rider Breakdown
   |
   v
Affected Order
   |
   v
AI Proposal
   |
   v
Dispatcher Approval
   |
   v
Replacement Rider
   |
   v
ASSIGNED
```

---

# Audit Logging

The system records important operational actions.

Examples include:

```text
ORDER_CREATED
ADDRESS_GEOCODED
AI_REASSIGNMENT_PROPOSED
REASSIGNMENT_APPROVED
```

The audit trail helps answer:

- What happened?
- When did it happen?
- What did the AI propose?
- What did the dispatcher change?
- What action was finally applied?

This provides traceability for AI-assisted operational decisions.

---

# Resilience and Failure Handling

AI services can fail, so failures are handled without automatically modifying operational state.

### OCR failure

```text
Image
 ↓
OCR Failure
 ↓
Error shown
 ↓
Original input preserved
 ↓
Retry / Manual handling
```

### LLM failure

```text
OCR Text
   ↓
LLM Failure
   ↓
No automatic state change
   ↓
Retry / Manual handling
```

A failed AI proposal must never partially modify order assignments.

---

# Database

MongoDB is used as the primary operational database.

The backend stores information such as:

- Riders
- Rider capacity and current load
- Orders
- Order assignments
- Order status
- Address processing information
- Audit events

Mongoose is used for MongoDB interaction from the Node.js backend.

---

# API and Service Flow

```text
                     React
                       |
                REST / Socket.IO
                       |
                       v
                Node.js / Express
                  |      |       |
                  |      |       |
                  v      v       v
               MongoDB  OCR   OpenRouter
                        |         |
                        v         v
                      TrOCR      LLM
```

The OCR service is kept separate so that the Python/PyTorch workload does not need to run inside the Node.js process.

---

# Project Structure

```text
ops-copilot/
│
├── backend/
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── server.js
│
├── frontend/
│   ├── public/
│   └── src/
│
├── ocr-service/
│   ├── app.py
│   └── requirements.txt
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# Environment Variables

The project keeps secrets outside the source code.

Example:

```env
OPENROUTER_API_KEY=your_api_key
```

The real `.env` file is not committed to the repository.

`.env.example` is provided as a template without exposing credentials.

---

# Running Locally

## MongoDB

Make sure MongoDB is running locally.

## OCR Service

```bash
cd ocr-service
python -m uvicorn app:app --port 8000
```

OCR service:

```text
http://localhost:8000
```

## Backend

```bash
cd backend
npm install
npm start
```

Backend:

```text
http://localhost:5000
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# End-to-End Workflow

```text
                    Dispatcher
                        |
                        v
                Operations Dashboard
                        |
             +----------+----------+
             |          |          |
             v          v          v
           Riders     Orders      Map
                        |
                        v
                Address Processing
                        |
                  +-----+-----+
                  |           |
                  v           v
                TrOCR        LLM
                  |           |
                  +-----+-----+
                        |
                        v
                Structured Address
                        |
                        v
                Delivery Operations
                        |
                 Rider Disruption
                        |
                        v
                 Affected Orders
                        |
                        v
                AI Reassignment
                        |
                        v
                Backend Validation
                        |
                        v
                Dispatcher Review
                  /      |      \
               Approve  Edit   Reject
                  |       |
                  |       v
                  |  Re-validation
                  |       |
                  +-------+
                      |
                      v
                Database Update
                      |
                      v
                   Audit Log
```

---

# Core Design Principles

### AI-Assisted, Not AI-Controlled

AI reduces manual work and generates useful suggestions, but it does not independently modify operational assignments.

### Validate Before Applying

AI output is treated as untrusted input and validated by the backend before affecting operational state.

### Preserve Original Data

Original OCR output is retained so that the dispatcher can inspect the source result.

### Keep Decisions Traceable

Important AI and dispatcher actions are recorded in the audit log.

---

# Core Principle

> **AI recommends. The dispatcher decides.**
