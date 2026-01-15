import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const Capture = lazy(() => import("./pages/Capture"));
const Receipts = lazy(() => import("./pages/Receipts"));

export const routes: RouteObject[] = [
  { path: "/", element: <Capture /> },
  { path: "/receipts", element: <Receipts /> },
];
