-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastSolveDay" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "puzzles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "cipherId" TEXT NOT NULL,
    "cipherOptions" JSONB NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "answerHash" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "difficultyRank" INTEGER NOT NULL,
    "maxAttempts" INTEGER,
    "timeLimitSeconds" INTEGER,
    "originalLocale" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "solveCount" INTEGER NOT NULL DEFAULT 0,
    "totalSolveSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "puzzles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "puzzle_translations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "puzzleId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',
    "hints" JSONB NOT NULL,
    "isOriginal" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "puzzle_translations_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "puzzles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "puzzle_tags" (
    "puzzleId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("puzzleId", "tagId"),
    CONSTRAINT "puzzle_tags_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "puzzles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "puzzle_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "puzzle_progress" (
    "userId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "solvedAt" DATETIME,

    PRIMARY KEY ("userId", "puzzleId"),
    CONSTRAINT "puzzle_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "puzzle_progress_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "puzzles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "elapsedSeconds" INTEGER NOT NULL,
    "hintsUsed" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "submissions_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "puzzles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hints" (
    "userId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "puzzleId", "position"),
    CONSTRAINT "hints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "hints_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "puzzles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "achievementId"),
    CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "elapsedSeconds" INTEGER NOT NULL,
    "hintsUsed" INTEGER NOT NULL,
    "attempts" INTEGER NOT NULL,
    "solvedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "leaderboard_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "leaderboard_entries_puzzleId_fkey" FOREIGN KEY ("puzzleId") REFERENCES "puzzles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "puzzles_createdAt_idx" ON "puzzles"("createdAt");

-- CreateIndex
CREATE INDEX "puzzles_solveCount_idx" ON "puzzles"("solveCount");

-- CreateIndex
CREATE INDEX "puzzles_difficulty_idx" ON "puzzles"("difficulty");

-- CreateIndex
CREATE INDEX "puzzles_cipherId_idx" ON "puzzles"("cipherId");

-- CreateIndex
CREATE INDEX "puzzles_authorId_idx" ON "puzzles"("authorId");

-- CreateIndex
CREATE INDEX "puzzle_translations_title_idx" ON "puzzle_translations"("title");

-- CreateIndex
CREATE UNIQUE INDEX "puzzle_translations_puzzleId_locale_key" ON "puzzle_translations"("puzzleId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "puzzle_tags_tagId_idx" ON "puzzle_tags"("tagId");

-- CreateIndex
CREATE INDEX "submissions_userId_puzzleId_idx" ON "submissions"("userId", "puzzleId");

-- CreateIndex
CREATE INDEX "submissions_puzzleId_isCorrect_idx" ON "submissions"("puzzleId", "isCorrect");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "achievements"("code");

-- CreateIndex
CREATE INDEX "leaderboard_entries_solvedAt_idx" ON "leaderboard_entries"("solvedAt");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_entries_userId_puzzleId_key" ON "leaderboard_entries"("userId", "puzzleId");
