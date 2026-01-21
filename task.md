# Task List: Gym Access & Membership Management System

## Project Initialization
- [x] Initialize React project with Vite
- [x] Install dependencies (Tailwind CSS, React Router, Lucide React, Recharts, Supabase Client, clsx/tailwind-merge)
- [x] Configure Tailwind CSS and localized font (Inter/Poppins)
- [x] Set up project folder structure (components, pages, lib, hooks, layouts)
- [x] Configure Supabase client (`src/lib/supabase.ts`)

## Layout & Infrastructure
- [ ] Create `MainLayout` component (Sidebar + TopBar + Content Area)
- [ ] Implement `Sidebar` with navigation links and active states
- [ ] Implement `TopBar` with search placeholder and notification bell
- [ ] Ensure responsive behavior (mobile drawer for sidebar)
- [ ] Define global types/interfaces (Member, Subscription, Attendance)

## Database Setup (Supabase)
- [ ] Design Database Schema (SQL definitions)
    - [ ] `members` table
    - [ ] `subscriptions` table
    - [ ] `payments` table
    - [ ] `attendance` table
- [ ] Apply migrations/create tables in Supabase
- [ ] Insert mock data for testing

## Feature: Dashboard
- [ ] Create `Dashboard` page component
- [ ] Implement `StatsCard` component (Total Members, Active, Expiring, Revenue)
- [ ] Implement `ActivityChart` using Recharts (Revenue/Attendance trends)
- [ ] Implement `RecentActivity` or `NotificationPanel` (Expiring soon list)
- [ ] Connect Dashboard to real data (Supabase)

## Feature: Member Management
- [ ] Create `MembersList` page
    - [ ] Implement Search and Filter (Active/Expired)
    - [ ] Create Member Table component with Status badges
- [ ] Create `AddMember` form (Modal or Page)
    - [ ] Personal Details inputs
    - [ ] Fitness & Medical inputs
    - [ ] Validation (Unique phone number)
- [ ] Create `MemberDetail` view
    - [ ] Profile overview
    - [ ] Subscription history list
    - [ ] Attendance logs
    - [ ] Edit Member functionality

## Feature: Subscription Management
- [ ] Create `Subscriptions` page (List view)
- [ ] Implement `AddSubscription` logic
    - [ ] Duration dropdown
    - [ ] Price input
    - [ ] Auto-calculate End Date
- [ ] Implement "Check-In" Logic (Mock biometric & validation)
    - [ ] Validate subscription status on entry

## Feature: Attendance & Access Control
- [ ] Create `Attendance` page
- [ ] Implement `DailyAttendance` list
- [ ] Add "Manual Entry" button (Override)
- [ ] Implement Mock Fingerprint Simulation (Button to trigger "scan" event)

## Feature: Payments & Reports
- [ ] Create `Payments` page (History table)
- [ ] Implement Date Range Picker for Revenue Reports
- [ ] Calculate and display Total Revenue based on range

## Polish & Cleanup
- [ ] Audit generic UI components (Buttons, Inputs, Cards) for consistency
- [ ] Verify Mobile responsiveness for all pages
- [ ] Test entire flow (Register -> Subscribe -> Check-in -> Report)
