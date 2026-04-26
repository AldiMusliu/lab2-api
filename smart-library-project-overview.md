# Smart Library Management System

## Project Overview

**Smart Library Management System** is a full-stack web application designed to manage library operations in a structured, scalable, and modern way.  
The project is planned as a course/lab project and is intended to satisfy the required coding-related criteria by using:

- **Frontend Framework:** React (with TanStack Start)
- **Backend Framework:** Express.js
- **SQL Database:** PostgreSQL
- **NoSQL Database:** MongoDB

The application will allow users to browse books, search and filter them, borrow and return books, and manage their personal activity.  
Administrators will be able to manage books, categories, users, and borrowing records.

In addition to the required full-stack structure, the project is planned in a way that it can later include **AI-based features**, such as recommendations, smart search, or assistant-like interactions.

---

## Main Goal

The goal of this project is to build a practical, real-world style application that demonstrates:

- frontend development with a modern React-based stack
- backend API development with Express.js
- relational data modeling with PostgreSQL
- NoSQL usage for flexible/unstructured data with MongoDB
- clean project structure
- scalable architecture for future AI integration

---

## Core Project Scope

The system will include two main user roles:

### 1. Admin
Admin users will be responsible for managing the system, including:

- managing books
- managing categories
- managing users
- monitoring borrowings
- reviewing activity logs and notifications

### 2. Regular User
Regular users will be able to:

- register and log in
- browse books
- search and filter books
- borrow books
- return books
- view their profile
- view their borrowing history

---

## Main Features

### Authentication
- user registration
- user login
- protected pages
- role-based access in later backend phases

### Book Management
- create, edit, delete, and list books
- search and filter books
- organize books by category
- show availability status

### Category Management
- create, edit, delete, and list categories
- assign books to categories

### Borrowing Management
- borrow a book
- return a book
- track due dates
- track borrowing status

### Profile
- show user information
- display borrowing history
- allow future profile editing

### Activity Logs / Notifications
Using MongoDB, the system can store:

- user activity logs
- notifications
- recommendation history
- future AI prompt or assistant history

---

## Technology Stack

## Frontend
- TanStack Start
- React
- TypeScript
- shadcn/ui
- React Hook Form
- Zod
- Zustand

## Backend
- Express.js
- Node.js
- JWT authentication
- bcrypt
- REST API structure

## Databases
- PostgreSQL for structured relational data
- MongoDB for flexible or semi-structured data

---

## Frontend Architecture

The frontend will be built first and organized in phases.

### Planned Frontend Areas
- authentication pages
- dashboard
- books page
- categories page
- borrowings page
- profile page

### Frontend Tooling Purpose
- **TanStack Start** for application structure and routing
- **shadcn/ui** for reusable UI components
- **React Hook Form** for forms
- **Zod** for validation
- **Zustand** for lightweight state management

---

## Database Planning

## PostgreSQL Entities
The SQL database will manage the main structured entities:

- `users`
- `books`
- `categories`
- `borrowings`

### Example Relationships
- one category can contain many books
- one user can have many borrowings
- one book can appear in many borrowing records over time

## MongoDB Collections
The NoSQL database will be used for flexible data such as:

- `activity_logs`
- `notifications`
- `book_reviews`
- `ai_history` or recommendation history

---

## Suggested Development Phases

## Phase 1 — Planning
- define project scope
- define user roles
- define pages and modules
- define SQL and NoSQL responsibilities
- decide where AI will be included

## Phase 2 — Frontend Foundation
- install and configure frontend dependencies
- define folder structure
- prepare shared UI
- prepare layouts and routes

## Phase 3 — Frontend Pages
- create dashboard page
- create books page
- create categories page
- create borrowings page
- create profile page
- use mock data at first

## Phase 4 — Forms and State
- login form
- register form
- book form
- category form
- Zustand auth state
- filter state

## Phase 5 — Backend Setup
- Express project structure
- routes
- controllers
- middleware
- authentication flow

## Phase 6 — PostgreSQL Integration
- create SQL schema
- add relations
- implement CRUD operations
- seed initial data

## Phase 7 — MongoDB Integration
- activity logs
- notifications
- review or flexible metadata collections

## Phase 8 — Full Integration
- connect frontend to backend APIs
- replace mock data
- implement protected routes with real auth
- complete end-to-end flows

## Phase 9 — AI Integration
Possible AI-related additions:
- book recommendation system
- smart search
- assistant/chat feature
- summary generation
- activity-based suggestions

---

## AI Direction

This project is intended to later include an AI-based feature so that it becomes more than just a standard CRUD system.

### Possible AI Features
- recommend books based on category or user behavior
- help users discover similar books
- provide a smart search experience
- summarize book descriptions
- store AI interaction history in MongoDB

To keep development manageable, the AI part should be added **after the core application is stable**.

---

## Why This Project Is a Good Fit

This project is a strong fit because it:

- clearly justifies the use of React, Express, PostgreSQL, and MongoDB
- has a realistic business/domain use case
- supports gradual development in phases
- can start from frontend only
- can be extended with AI features later
- is suitable for teamwork and modular task distribution

---

## Possible Team Split

If the project is developed by a team, work can be divided as follows:

- member 1: authentication and users
- member 2: books and categories
- member 3: borrowings
- member 4: MongoDB logs and notifications
- member 5: frontend pages and reusable components
- member 6: integration, testing, and cleanup

---

## Short Presentation Summary

**Smart Library Management System** is a full-stack web application for managing library operations.  
The frontend is developed with **React and TanStack Start**, the backend with **Express.js**, structured data is stored in **PostgreSQL**, and flexible/unstructured data is stored in **MongoDB**.  
The system supports user and admin workflows such as authentication, book management, category management, and borrowing management, and is designed to support future **AI-based features** such as smart recommendations or intelligent search.

---

## Next Steps

After this general project brief, the next documentation files that can be created are:

1. `frontend-plan.md`
2. `backend-plan.md`
3. `database-design.md`
4. `api-plan.md`
5. `ai-feature-plan.md`

