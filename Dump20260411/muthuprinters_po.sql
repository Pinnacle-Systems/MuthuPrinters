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
-- Table structure for table `po`
--

DROP TABLE IF EXISTS `po`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `po` (
  `id` int NOT NULL AUTO_INCREMENT,
  `docId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `docDate` datetime(3) DEFAULT NULL,
  `dueDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `createdById` int DEFAULT NULL,
  `updatedById` int DEFAULT NULL,
  `poType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `taxTemplateId` int DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `deliveryType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deliveryToId` int DEFAULT NULL,
  `deliveryBranchId` int DEFAULT NULL,
  `termsAndCondtion` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branchId` int DEFAULT NULL,
  `supplierId` int DEFAULT NULL,
  `discountType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discountValue` double DEFAULT NULL,
  `quoteVersion` int NOT NULL DEFAULT '1',
  `taxPercent` double DEFAULT NULL,
  `termsId` int DEFAULT NULL,
  `payTermId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Po_createdById_fkey` (`createdById`),
  KEY `Po_updatedById_fkey` (`updatedById`),
  KEY `Po_taxTemplateId_fkey` (`taxTemplateId`),
  KEY `Po_deliveryToId_fkey` (`deliveryToId`),
  KEY `Po_deliveryBranchId_fkey` (`deliveryBranchId`),
  KEY `Po_branchId_fkey` (`branchId`),
  KEY `Po_supplierId_fkey` (`supplierId`),
  KEY `Po_termsId_fkey` (`termsId`),
  KEY `Po_payTermId_fkey` (`payTermId`),
  CONSTRAINT `Po_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Po_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Po_deliveryBranchId_fkey` FOREIGN KEY (`deliveryBranchId`) REFERENCES `branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Po_deliveryToId_fkey` FOREIGN KEY (`deliveryToId`) REFERENCES `party` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Po_payTermId_fkey` FOREIGN KEY (`payTermId`) REFERENCES `payterm` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Po_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `party` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Po_taxTemplateId_fkey` FOREIGN KEY (`taxTemplateId`) REFERENCES `taxtemplate` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Po_termsId_fkey` FOREIGN KEY (`termsId`) REFERENCES `termsandconditions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Po_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `po`
--

LOCK TABLES `po` WRITE;
/*!40000 ALTER TABLE `po` DISABLE KEYS */;
INSERT INTO `po` VALUES (61,'MP/26-27/PO/1','2026-04-08 00:00:00.000','2026-04-08 00:00:00.000','2026-04-08 09:16:07.172','2026-04-08 09:33:19.848',12,12,'ORDER',2,1,'ToSelf',NULL,1,'','VECHILE NO : TN39CS6874  , delivery person : Madhanraj',1,322,'Percentage',0,1,NULL,NULL,5),(62,'MP/26-27/PO/2','2026-04-08 00:00:00.000','2026-04-08 00:00:00.000','2026-04-08 10:07:24.649','2026-04-08 10:07:24.649',12,NULL,'ORDER',2,1,'ToSelf',NULL,1,'','',1,323,'Percentage',0,1,NULL,NULL,5),(63,'MP/26-27/PO/3','2026-04-08 00:00:00.000','2026-04-08 00:00:00.000','2026-04-08 11:13:03.272','2026-04-08 11:13:03.272',12,NULL,'GENERAL',5,1,'ToSelf',NULL,1,'','',1,324,'Percentage',0,1,NULL,NULL,NULL),(64,'MP/26-27/PO/4','2026-04-08 00:00:00.000','2026-04-08 00:00:00.000','2026-04-08 11:50:24.533','2026-04-08 11:50:24.533',11,NULL,'GENERAL',2,1,'ToSelf',NULL,1,'','',1,321,'Percentage',0,1,NULL,NULL,1);
/*!40000 ALTER TABLE `po` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:07:14
