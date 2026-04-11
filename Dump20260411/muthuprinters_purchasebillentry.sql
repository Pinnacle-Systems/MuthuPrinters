-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: muthuprinters
-- ------------------------------------------------------
-- Server version	8.0.44-0ubuntu0.22.04.2

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `purchasebillentry`
--

DROP TABLE IF EXISTS `purchasebillentry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchasebillentry` (
  `id` int NOT NULL AUTO_INCREMENT,
  `docId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `docDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `createdById` int DEFAULT NULL,
  `updatedById` int DEFAULT NULL,
  `branchId` int DEFAULT NULL,
  `finYearId` int DEFAULT NULL,
  `supplierId` int DEFAULT NULL,
  `remarks` longtext COLLATE utf8mb4_unicode_ci,
  `userId` int DEFAULT NULL,
  `companyId` int DEFAULT NULL,
  `netBillValue` double DEFAULT NULL,
  `billType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discountType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discountValue` double DEFAULT NULL,
  `taxTemplateId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `PurchaseBillEntry_createdById_fkey` (`createdById`),
  KEY `PurchaseBillEntry_updatedById_fkey` (`updatedById`),
  KEY `PurchaseBillEntry_branchId_fkey` (`branchId`),
  KEY `PurchaseBillEntry_finYearId_fkey` (`finYearId`),
  KEY `PurchaseBillEntry_supplierId_fkey` (`supplierId`),
  KEY `PurchaseBillEntry_userId_fkey` (`userId`),
  KEY `PurchaseBillEntry_companyId_fkey` (`companyId`),
  KEY `PurchaseBillEntry_taxTemplateId_fkey` (`taxTemplateId`),
  CONSTRAINT `PurchaseBillEntry_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PurchaseBillEntry_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PurchaseBillEntry_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PurchaseBillEntry_finYearId_fkey` FOREIGN KEY (`finYearId`) REFERENCES `finyear` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PurchaseBillEntry_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `party` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PurchaseBillEntry_taxTemplateId_fkey` FOREIGN KEY (`taxTemplateId`) REFERENCES `taxtemplate` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PurchaseBillEntry_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PurchaseBillEntry_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchasebillentry`
--

LOCK TABLES `purchasebillentry` WRITE;
/*!40000 ALTER TABLE `purchasebillentry` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchasebillentry` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:06:50
