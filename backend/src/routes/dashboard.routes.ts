import { Router } from "express";

import {
  getActivity,
  getBudgetOverview,
  getSummary,
} from "../controllers/dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.get("/summary", getSummary);
dashboardRouter.get("/budgets", getBudgetOverview);
dashboardRouter.get("/activity", getActivity);
