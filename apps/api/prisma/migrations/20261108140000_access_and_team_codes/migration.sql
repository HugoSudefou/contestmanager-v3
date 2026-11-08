-- Bonus evaluators (educational advisers, digital-education referents): very simple password.
ALTER TYPE "Role" ADD VALUE 'EVALUATOR';

-- Team codes: class letter (A, B, C...) + team number in the class (1 to 6) = A1, B3...
ALTER TABLE "Group" ADD COLUMN "letter" TEXT;
ALTER TABLE "Team" ADD COLUMN "number" INTEGER;
