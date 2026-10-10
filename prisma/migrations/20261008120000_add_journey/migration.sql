-- Journey feature: adds the Roadmap and RoadmapStep tables.
-- Additive only: Habit / HabitLog / auth tables are not touched.
-- "Locked" is not a column on purpose: it is derived in code from the first incomplete step.

-- CreateTable
CREATE TABLE "Roadmap" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Roadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapStep" (
    "id" SERIAL NOT NULL,
    "roadmapId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RoadmapStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Roadmap_userId_createdAt_idx" ON "Roadmap"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapStep_roadmapId_order_key" ON "RoadmapStep"("roadmapId", "order");

-- AddForeignKey
ALTER TABLE "Roadmap" ADD CONSTRAINT "Roadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapStep" ADD CONSTRAINT "RoadmapStep_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

