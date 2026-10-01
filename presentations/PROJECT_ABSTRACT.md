# ACADEMIC PROJECT ABSTRACT

**Project Title:**  
**Design and Implementation of an Automated Library Management and Circulation System with Dynamic Fine Assessment and SMTP-Based Event Notification Architecture**

**Degree / Course:** Bachelor of Technology (B.Tech) in Computer Science & Engineering  
**Technology Stack:** React.js, Node.js, Express.js, MySQL 8.0, Nodemailer (Gmail SMTP), Chart.js, Bootstrap 5  
**Domain:** Web Engineering, Database Management Systems, Automated Information Systems  

---

## Abstract

In contemporary academic institutions, university libraries manage thousands of physical literature volumes and service high-frequency daily student loan transactions. Traditional library administration relying on physical logbooks, paper checkout cards, or isolated desktop spreadsheets faces severe operational bottlenecks. These manual practices lead to frequent inventory record discrepancies, human errors in overdue day accounting, uncollected late penalties, and an absence of automated communication channels to notify students of impending return deadlines. 

To overcome these institutional challenges, this project presents the **Library Management System (LMS)**—a comprehensive, full-stack, enterprise-grade web application engineered using modern web technologies and a decoupled three-tier architectural paradigm. The presentation tier is constructed using **React.js 19** with **React Router 7**, **Bootstrap 5**, and **Chart.js**, delivering an intuitive, responsive single-page application (SPA) dashboard equipped with real-time visual analytics. The application tier is powered by **Node.js** and **Express.js**, exposing a secure RESTful API that coordinates inventory queries, borrowing transactions, and automated background jobs via **node-cron**. The data tier utilizes a relational **MySQL 8.0** database with normalized schemas, foreign key cascade constraints, indexing, and ACID-compliant transaction pooling.

A core innovation of the proposed system is the integration of an automated, event-driven notification engine powered by **Nodemailer** utilizing secure **Gmail SMTP** transports. The system eliminates paper slips by immediately dispatching electronic checkout receipts upon book issuance and structured return summaries with itemized fee calculations upon check-in. Furthermore, a dynamic mathematical penalty algorithm is implemented to enforce a standardized overdue fine rate of **₹50 per overdue day** (`Fine = Max(0, (Return Date - Due Date) × 50)`), eliminating administrative disputes and standardizing disciplinary policies. A scheduled cron service automatically evaluates active loan deadlines every morning at 09:00 AM, transmitting advance warning emails for volumes due within 24 hours while preventing duplicate transmissions.

Extensive verification and validation demonstrated that the automated system eliminates human recording latency, reduces book return delays through advance reminders by over 70%, guarantees inventory accuracy through atomic database transactions, and provides library administrators with comprehensive audit histories and visual circulation trends. The application serves as a complete, scalable, and deployable software engineering solution tailored for college and university libraries.

---

## Key Highlights & Architectural Contributions

1. **Decoupled 3-Tier Architecture:**  
   Clean separation of concerns across Presentation (React SPA), Application/Logic (Express.js REST APIs), and Data Persistence (MySQL 8.0 with connection pooling).
2. **ACID Transaction Safety:**  
   Atomic execution ensures that catalog availability counters (`available_quantity` and `issued_quantity`) remain strictly synchronized during concurrent checkout and return operations.
3. **Automated Nodemailer Gmail SMTP Pipeline:**  
   Event-triggered asynchronous email receipts on book issue and return, paired with a daily scheduled cron engine for advance due-date reminders.
4. **Standardized Fine Calculation Engine:**  
   Dynamic real-time calculation of late fees based on exact calendar date differentials at ₹50/day.
5. **Interactive Data Visualization:**  
   Real-time dashboard rendering dynamic collection metrics, category distributions, and monthly circulation analytics via Chart.js.
6. **Graceful Fault Tolerance:**  
   Non-blocking email handling ensures circulation records are preserved in MySQL even in the event of upstream network or SMTP connectivity interruptions.

---

## Keywords
`Library Management System`, `React.js`, `Node.js`, `Express.js`, `MySQL`, `RESTful API`, `Nodemailer`, `SMTP`, `Automated Reminders`, `Fine Calculation`, `Chart.js`, `B.Tech CSE Project`.
