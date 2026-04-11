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
-- Table structure for table `purchaseinward`
--

DROP TABLE IF EXISTS `purchaseinward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchaseinward` (
  `id` int NOT NULL AUTO_INCREMENT,
  `docId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `docDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `createdById` int DEFAULT NULL,
  `updatedById` int DEFAULT NULL,
  `branchId` int DEFAULT NULL,
  `dcNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dcDate` date DEFAULT NULL,
  `supplierId` int DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `vehicleNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` longtext COLLATE utf8mb4_unicode_ci,
  `inwardType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `locationId` int DEFAULT NULL,
  `storeId` int DEFAULT NULL,
  `invNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discountType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discountValue` double DEFAULT NULL,
  `netBillValue` double DEFAULT NULL,
  `receiptType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `taxTemplateId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `PurchaseInward_createdById_fkey` (`createdById`),
  KEY `PurchaseInward_updatedById_fkey` (`updatedById`),
  KEY `PurchaseInward_branchId_fkey` (`branchId`),
  KEY `PurchaseInward_supplierId_fkey` (`supplierId`),
  KEY `PurchaseInward_storeId_fkey` (`storeId`),
  KEY `PurchaseInward_taxTemplateId_fkey` (`taxTemplateId`),
  CONSTRAINT `PurchaseInward_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PurchaseInward_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PurchaseInward_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `location` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PurchaseInward_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `party` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PurchaseInward_taxTemplateId_fkey` FOREIGN KEY (`taxTemplateId`) REFERENCES `taxtemplate` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PurchaseInward_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchaseinward`
--

LOCK TABLES `purchaseinward` WRITE;
/*!40000 ALTER TABLE `purchaseinward` DISABLE KEYS */;
INSERT INTO `purchaseinward` VALUES (61,'MP/26-27/PI/1','2026-04-08 00:00:00.000','2026-04-08 10:22:56.690','2026-04-08 10:39:48.014',12,12,1,'','2026-04-08',323,1,'TN39CS6874','','Order Purchase Inward',1,4,'6058/TPR','',NULL,101379,'Against Invoice',2);
/*!40000 ALTER TABLE `purchaseinward` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:07:12
