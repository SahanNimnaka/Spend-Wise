-- DropIndex
DROP INDEX "Budget_category_key";

-- CreateIndex
CREATE INDEX "Budget_year_month_idx" ON "Budget"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_category_month_year_key" ON "Budget"("category", "month", "year");