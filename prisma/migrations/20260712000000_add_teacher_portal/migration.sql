-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'student';

-- CreateTable
CREATE TABLE "TeacherClass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "inviteCode" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'observe',
    "teacherId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeacherClass_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClassEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "TeacherClass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClassEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PhaseReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phaseId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "feedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PhaseReview_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PhaseReview_classId_fkey" FOREIGN KEY ("classId") REFERENCES "TeacherClass" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PhaseReview_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TeacherClass_inviteCode_key" ON "TeacherClass"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "ClassEnrollment_classId_studentId_key" ON "ClassEnrollment"("classId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "PhaseReview_phaseId_classId_key" ON "PhaseReview"("phaseId", "classId");
