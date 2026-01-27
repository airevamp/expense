import { lazy } from "react";
import { Navigate, RouteObject } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";

const Capture = lazy(() => import("./pages/Capture"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Receipts = lazy(() => import("./pages/Receipts"));
const Login = lazy(() => import("./pages/Login"));

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Navigate to="/capture" replace />,
  },
  { path: "/login", element: <Login /> },
  {
    path: "/capture",
    element: (
      <RequireAuth>
        <Capture />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    ),
  },
  {
    path: "/profile",
    element: (
      <RequireAuth>
        <Profile />
      </RequireAuth>
    ),
  },
  {
    path: "/receipts",
    element: (
      <RequireAuth>
        <Receipts />
      </RequireAuth>
    ),
  },
];
