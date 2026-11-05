import type { Request, Response } from "express";

import {
  createTransaction as createTransactionRecord,
  deleteTransaction as deleteTransactionRecord,
  getTransactionById,
  listTransactions,
  updateTransaction as updateTransactionRecord,
} from "../services/transaction.service.js";
import {
  parseCreateTransaction,
  parseTransactionFilters,
  parseTransactionId,
  parseUpdateTransaction,
} from "../utils/transaction.validation.js";

export async function getTransactions(
  req: Request,
  res: Response,
): Promise<void> {
  const filters = parseTransactionFilters(req.query);
  const result = await listTransactions(filters);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getTransaction(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parseTransactionId(req.params.id);
  const transaction = await getTransactionById(id);

  res.status(200).json({
    success: true,
    data: transaction,
  });
}

export async function createTransaction(
  req: Request,
  res: Response,
): Promise<void> {
  const input = parseCreateTransaction(req.body);
  const transaction = await createTransactionRecord(input);

  res.status(201).json({
    success: true,
    data: transaction,
  });
}

export async function updateTransaction(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parseTransactionId(req.params.id);
  const input = parseUpdateTransaction(req.body);
  const transaction = await updateTransactionRecord(id, input);

  res.status(200).json({
    success: true,
    data: transaction,
  });
}

export async function deleteTransaction(
  req: Request,
  res: Response,
): Promise<void> {
  const id = parseTransactionId(req.params.id);
  await deleteTransactionRecord(id);

  res.status(200).json({
    success: true,
    data: { id },
  });
}
