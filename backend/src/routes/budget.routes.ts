import { Router } from "express";

import {
  createBudget,
  deleteBudget,
  getBudget,
  getBudgets,
  updateBudget,
} from "../controllers/budget.controller.js";

export const budgetRouter = Router();

budgetRouter.get("/", getBudgets);
budgetRouter.get("/:id", getBudget);
budgetRouter.post("/", createBudget);
budgetRouter.put("/:id", updateBudget);
budgetRouter.delete("/:id", deleteBudget);
