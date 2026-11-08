-- CreateTable
CREATE TABLE "TeamEvaluation" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "part" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "evaluatorId" INTEGER,
    "scoredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamEvaluation_teamId_part_key" ON "TeamEvaluation"("teamId", "part");

-- AddForeignKey
ALTER TABLE "TeamEvaluation" ADD CONSTRAINT "TeamEvaluation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamEvaluation" ADD CONSTRAINT "TeamEvaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
