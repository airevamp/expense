import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const Capture = lazy(() => import("./pages/Capture"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Receipts = lazy(() => import("./pages/Receipts"));

export const routes: RouteObject[] = [
  { path: "/", element: <Dashboard /> },
  { path: "/capture", element: <Capture /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/profile", element: <Profile /> },
  { path: "/receipts", element: <Receipts /> },
];
