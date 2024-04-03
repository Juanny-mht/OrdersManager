/*
  Warnings:

  - Added the required column `price` to the `ArticleId` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ArticleId" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "price" REAL NOT NULL,
    CONSTRAINT "ArticleId_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ArticleId" ("id", "orderId", "size") SELECT "id", "orderId", "size" FROM "ArticleId";
DROP TABLE "ArticleId";
ALTER TABLE "new_ArticleId" RENAME TO "ArticleId";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
