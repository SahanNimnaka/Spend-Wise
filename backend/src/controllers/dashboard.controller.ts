import type { Request, Response } from "express";

import {
  getDashboardActivity,
  getDashboardBudgets,
  getDashboardSummary,
} from "../services/dashboard.service.js";
import { parsePeriodQuery } from "../utils/budget.validation.js";

export async function getSummary(req: Request, res: Response): Promise<void> {
  const period = parsePeriodQuery(req.query);
  const summary = await getDashboardSummary(period);

  res.status(200).json({
    success: true,
    data: summary,
  });
}

export async function getBudgetOverview(
  req: Request,
  res: Response,
): Promise<void> {
  const period = parsePeriodQuery(req.query);
  const overview = await getDashboardBudgets(period);

  res.status(200).json({
    success: true,
    data: overview,
  });
}

export async function getActivity(
  req: Request,
  res: Response,
): Promise<void> {
  const period = parsePeriodQuery(req.query);
  const activity = await getDashboardActivity(period);

  res.status(200).json({
    success: true,
    data: activity,
  });
}
