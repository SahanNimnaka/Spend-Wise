import type { Request, Response } from "express";

import {
  createBudget as createBudgetRecord,
  deleteBudget as deleteBudgetRecord,
  getBudgetById,
  listBudgets,
  updateBudget as updateBudgetRecord,
} from "../services/budget.service.js";
import {
  parseBudgetFilters,
  parseBudgetId,
  parseCreateBudget,
  parseUpdateBudget,
} from "../utils/budget.validation.js";

export async function getBudgets(req: Request, res: Response): Promise<void> {
  const filters = parseBudgetFilters(req.query);
  const result = await listBudgets(filters);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getBudget(req: Request, res: Response): Promise<void> {
  const id = parseBudgetId(req.params.id);
  const budget = await getBudgetById(id);

  res.status(200).json({
    success: true,
    data: budget,
  });
}

export async function createBudget(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseCreateBudget(req.body);
  const budget = await createBudgetRecord(input);

  res.status(201).json({
    success: true,
    data: budget,
  });
}

export async function updateBudget(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parseBudgetId(req.params.id);
  const input = parseUpdateBudget(req.body);
  const budget = await updateBudgetRecord(id, input);

  res.status(200).json({
    success: true,
    data: budget,
  });
}

export async function deleteBudget(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parseBudgetId(req.params.id);
  await deleteBudgetRecord(id);

  res.status(200).json({
    success: true,
    data: { id },
  });
}
