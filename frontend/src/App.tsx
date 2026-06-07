import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import AppShell from '@/components/AppShell';
import AdminShell from '@/components/AdminShell';
import { RequireAdmin, RequirePlayer } from '@/components/RouteGuards';

import Landing from '@/pages/Landing';
import Join from '@/pages/Join';
import Login from '@/pages/Login';
import Status from '@/pages/Status';

import Dashboard from '@/pages/app/Dashboard';
import Games from '@/pages/app/Games';
import Leaderboard from '@/pages/app/Leaderboard';
import Benefits from '@/pages/app/Benefits';
import Offers from '@/pages/app/Offers';
import Profile from '@/pages/app/Profile';
import Notifications from '@/pages/app/Notifications';

import AdminDashboard from '@/pages/admin/Dashboard';
import AdminApplications from '@/pages/admin/Applications';
import AdminGames from '@/pages/admin/Games';
import AdminPlayers from '@/pages/admin/Players';
import AdminOffers from '@/pages/admin/Offers';
import AdminResults from '@/pages/admin/Results';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="join" element={<Join />} />
        <Route path="login" element={<Login />} />
      </Route>
      <Route path="/status" element={<Status />} />

      {/* Player area */}
      <Route
        path="/app"
        element={
          <RequirePlayer>
            <AppShell />
          </RequirePlayer>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="games" element={<Games />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="benefits" element={<Benefits />} />
        <Route path="offers" element={<Offers />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      {/* Admin area */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminShell />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="applications" element={<AdminApplications />} />
        <Route path="games" element={<AdminGames />} />
        <Route path="players" element={<AdminPlayers />} />
        <Route path="offers" element={<AdminOffers />} />
        <Route path="results" element={<AdminResults />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
