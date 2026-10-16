import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import OnboardingCreatePage from '../pages/OnboardingCreatePage';
import DashboardPage from '../pages/DashboardPage';
import BookingsPage from '../pages/BookingsPage';
import AvailabilityPage from '../pages/AvailabilityPage';
import AddSchedulePage from '../pages/AddSchedulePage';
import PagesPage from '../pages/PagesPage';
import EditBookingPage from '../pages/EditBookingPage';
import UsersPage from '../pages/UsersPage';
import HolidaysPage from '../pages/HolidaysPage';
import PublicBookingPage from '../pages/PublicBookingPage';
import CreateBookingPage from '../pages/CreateBookingPage';
import CreateUserPage from '../pages/CreateUserPage';
import CreateLeavePage from '../pages/CreateLeavePage';

import DashboardLayout from '../layouts/DashboardLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/onboarding',
    element: <OnboardingCreatePage />,
  },
  {
    element: <DashboardLayout />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/bookings',
        children: [
          { index: true, element: <BookingsPage /> },
          { path: 'new', element: <CreateBookingPage /> },
          { path: 'create', element: <CreateBookingPage /> },
        ],
      },
      {
        path: '/availability',
        children: [
          { index: true, element: <AvailabilityPage /> },
          { path: 'new', element: <AddSchedulePage /> },
          { path: 'create', element: <AddSchedulePage /> },
        ],
      },
      {
        path: '/holidays',
        children: [
          { index: true, element: <HolidaysPage /> },
          { path: 'new', element: <CreateLeavePage /> },
          { path: 'create', element: <CreateLeavePage /> },
        ],
      },
      {
        path: '/pages',
        children: [
          { index: true, element: <PagesPage /> },
          { path: 'edit/:id', element: <EditBookingPage /> },
        ],
      },
      {
        path: '/users',
        children: [
          { index: true, element: <UsersPage /> },
          { path: 'new', element: <CreateUserPage /> },
          { path: 'create', element: <CreateUserPage /> },
          { path: 'edit/:id', element: <CreateUserPage /> },
        ],
      },
    ],
  },
  {
    path: '/:slug',
    element: <PublicBookingPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

