# Inventory Management System

A full-stack inventory management application built with **Java, Spring Boot, Spring Security, MySQL, and React**. The system provides secure role-based access, product and supplier management, purchase orders, inventory tracking, and audit history through a RESTful backend and React frontend.

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- BCrypt password hashing
- Stateless Spring Security configuration
- Role-based access control
- Supports:
  - Admin
  - Manager
  - Staff
- Protected REST APIs
- Separate handling of:
  - `401 Unauthorized` for unauthenticated requests
  - `403 Forbidden` for unauthorized access

### 📦 Product & Category Management
- Create, update and view products
- Category management
- Product-category relationships
- Soft-delete support
- Low-stock identification
- Product inventory quantity tracking

### 🏭 Supplier Management
- Supplier records
- Supplier-related purchase operations
- Role-based access to supplier management

### 🛒 Purchase Orders
- Create purchase orders
- Multiple products within a purchase order
- Supplier association
- Purchase order item management

### 📊 Inventory Management
- Stock In and Stock Out operations
- Inventory transaction history
- Stock quantity tracking
- Transaction validation
- Optimistic locking for concurrent stock updates
- Approval handling for exceptional inventory adjustments

### 📝 Activity & Audit Logging
- User activity tracking
- Inventory transaction history
- Separate audit records for user actions
- Append-oriented activity tracking

### 🧪 Testing & CI/CD
- Unit testing with JUnit and Mockito
- Integration testing with Spring Boot
- MySQL integration testing using Testcontainers
- Automated GitHub Actions pipeline
- Backend build and test validation
- Frontend build validation
- Docker image build and publishing

---

## 🛠️ Tech Stack

### Backend
- Java 21
- Spring Boot 3
- Spring Security
- Spring Data JPA
- Hibernate
- Maven
- JWT / JJWT
- BCrypt
- JUnit
- Mockito
- Testcontainers

### Frontend
- React
- Vite
- React Router
- Axios
- JavaScript
- CSS

### Database
- MySQL 8+

### DevOps & Tools
- Git
- GitHub
- GitHub Actions
- Docker
- Docker Compose
- Postman

---

## 🏗️ Architecture

The backend follows a layered architecture:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Entity
    ↓
MySQL
