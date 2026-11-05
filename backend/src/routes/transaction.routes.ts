import { Router } from "express";

import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  getTransactions,
  updateTransaction,
} from "../controllers/transaction.controller.js";

export const transactionRouter = Router();

transactionRouter.get("/", getTransactions);
transactionRouter.get("/:id", getTransaction);
transactionRouter.post("/", createTransaction);
transactionRouter.put("/:id", updateTransaction);
transactionRouter.delete("/:id", deleteTransaction);
