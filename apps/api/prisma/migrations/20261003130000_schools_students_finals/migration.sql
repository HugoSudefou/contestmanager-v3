-- Teachers
ALTER TYPE "Role" ADD VALUE 'TEACHER';

-- Final phase bracket
ALTER TABLE "Match" ADD COLUMN "bracketIndex" INTEGER,
ADD COLUMN "round" INTEGER;

-- Schools become rows instead of free text on Team
CREATE TABLE "School" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "School_name_key" ON "School"("name");

ALTER TABLE "Team" ADD COLUMN "schoolId" INTEGER,
ADD COLUMN "teacherId" INTEGER;

-- Keep existing school names
INSERT INTO "School" ("name")
SELECT DISTINCT trim("school") FROM "Team" WHERE "school" IS NOT NULL AND trim("school") <> '';
UPDATE "Team" t SET "schoolId" = s."id" FROM "School" s WHERE trim(t."school") = s."name";

-- Free-text members are replaced by the Student table
ALTER TABLE "Team" DROP COLUMN "members",
DROP COLUMN "school";

ALTER TABLE "User" ADD COLUMN "firstName" TEXT,
ADD COLUMN "lastName" TEXT,
ADD COLUMN "schoolId" INTEGER;

CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT,
    "teamId" INTEGER NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Team" ADD CONSTRAINT "Team_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Team" ADD CONSTRAINT "Team_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Student" ADD CONSTRAINT "Student_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
