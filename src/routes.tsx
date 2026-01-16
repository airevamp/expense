import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const Capture = lazy(() => import("./pages/Capture"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Receipts = lazy(() => import("./pages/Receipts"));

export const routes: RouteObject[] = [
  { path: "/", element: <Dashboard /> },
  { path: "/capture", element: <Capture /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/receipts", element: <Receipts /> },
];
