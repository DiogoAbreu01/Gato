-- Additive Gato workspace migration.
CREATE TYPE "WorkspacePageKind" AS ENUM ('PAGE','SHEET','FLOW','DATABASE');
CREATE TABLE "WorkspacePage" (
 "id" TEXT NOT NULL,
 "title" TEXT NOT NULL DEFAULT 'Sem título',
 "icon" TEXT DEFAULT '🌙',
 "kind" "WorkspacePageKind" NOT NULL DEFAULT 'PAGE',
 "departmentId" TEXT NOT NULL,
 "parentId" TEXT,
 "content" JSONB NOT NULL DEFAULT '[]',
 "data" JSONB NOT NULL DEFAULT '{}',
 "version" INTEGER NOT NULL DEFAULT 1,
 "createdById" TEXT NOT NULL,
 "updatedById" TEXT NOT NULL,
 "archivedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "WorkspacePage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WorkspacePageRevision" (
 "id" TEXT NOT NULL,
 "pageId" TEXT NOT NULL,
 "version" INTEGER NOT NULL,
 "title" TEXT NOT NULL,
 "content" JSONB NOT NULL,
 "data" JSONB NOT NULL,
 "changedById" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "WorkspacePageRevision_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "WorkspacePageFavorite" (
 "pageId" TEXT NOT NULL,
 "userId" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "WorkspacePageFavorite_pkey" PRIMARY KEY ("pageId","userId")
);
CREATE INDEX "WorkspacePage_departmentId_archivedAt_parentId_idx" ON "WorkspacePage"("departmentId","archivedAt","parentId");
CREATE INDEX "WorkspacePage_createdAt_idx" ON "WorkspacePage"("createdAt");
CREATE UNIQUE INDEX "WorkspacePageRevision_pageId_version_key" ON "WorkspacePageRevision"("pageId","version");
CREATE INDEX "WorkspacePageFavorite_userId_idx" ON "WorkspacePageFavorite"("userId");
ALTER TABLE "WorkspacePage" ADD CONSTRAINT "WorkspacePage_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkspacePage" ADD CONSTRAINT "WorkspacePage_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "WorkspacePage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkspacePage" ADD CONSTRAINT "WorkspacePage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkspacePageRevision" ADD CONSTRAINT "WorkspacePageRevision_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WorkspacePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspacePageFavorite" ADD CONSTRAINT "WorkspacePageFavorite_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "WorkspacePage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspacePageFavorite" ADD CONSTRAINT "WorkspacePageFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
