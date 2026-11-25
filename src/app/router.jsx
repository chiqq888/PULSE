import { createBrowserRouter } from 'react-router-dom';
import { RequireAccount } from '../components/RequireAccount';
import { OrganizerLayout } from '../layouts/OrganizerLayout';
import { StaffLayout } from '../layouts/StaffLayout';
import { UserLayout } from '../layouts/UserLayout';
import { AuthPage } from '../pages/AuthPage';
import { LandingPage } from '../pages/LandingPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { AttendeesPage } from '../pages/org/AttendeesPage';
import { DashboardPage } from '../pages/org/DashboardPage';
import { EventEditorPage } from '../pages/org/EventEditorPage';
import { EventsPage } from '../pages/org/EventsPage';
import { CheckInPage } from '../pages/staff/CheckInPage';
import { StaffEventsPage } from '../pages/staff/StaffEventsPage';
import { EventDetailsPage } from '../pages/user/EventDetailsPage';
import { ExplorePage } from '../pages/user/ExplorePage';
import { MyEventsPage } from '../pages/user/MyEventsPage';
import { TicketDetailsPage } from '../pages/user/TicketDetailsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  { path: '/login', element: <AuthPage key="login" /> },
  { path: '/register', element: <AuthPage key="register" register /> },
  {
    path: '/user',
    element: <UserLayout />,
    children: [
      { index: true, element: <ExplorePage /> },
      { path: 'events/:id', element: <EventDetailsPage /> },
      {
        element: <RequireAccount />,
        children: [
          { path: 'my-events', element: <MyEventsPage /> },
          { path: 'tickets/:ticketId', element: <TicketDetailsPage /> },
        ],
      },
    ],
  },
  {
    path: '/org',
    element: <RequireAccount role="organizer" />,
    children: [
      {
        element: <OrganizerLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'events', element: <EventsPage /> },
          { path: 'events/new', element: <EventEditorPage /> },
          { path: 'events/:id/edit', element: <EventEditorPage /> },
          { path: 'events/:id/attendees', element: <AttendeesPage /> },
        ],
      },
    ],
  },
  {
    path: '/staff',
    element: <RequireAccount role="staff" />,
    children: [
      {
        element: <StaffLayout />,
        children: [
          { index: true, element: <StaffEventsPage /> },
          { path: 'check-in', element: <CheckInPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
