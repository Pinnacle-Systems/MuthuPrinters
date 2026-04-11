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
-- Table structure for table `deliveryinvoice`
--

DROP TABLE IF EXISTS `deliveryinvoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deliveryinvoice` (
  `id` int NOT NULL AUTO_INCREMENT,
  `docId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplierId` int DEFAULT NULL,
  `branchId` int DEFAULT NULL,
  `deliveryType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdById` int DEFAULT NULL,
  `updatedById` int DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `dcNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dcDate` datetime(3) DEFAULT NULL,
  `transportMode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transporter` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `taxPercent` double DEFAULT NULL,
  `termsandcondtions` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finYearId` int DEFAULT NULL,
  `discountType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discountValue` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `DeliveryInvoice_supplierId_fkey` (`supplierId`),
  KEY `DeliveryInvoice_branchId_fkey` (`branchId`),
  KEY `DeliveryInvoice_createdById_fkey` (`createdById`),
  KEY `DeliveryInvoice_updatedById_fkey` (`updatedById`),
  KEY `DeliveryInvoice_finYearId_fkey` (`finYearId`),
  CONSTRAINT `DeliveryInvoice_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `DeliveryInvoice_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `DeliveryInvoice_finYearId_fkey` FOREIGN KEY (`finYearId`) REFERENCES `finyear` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `DeliveryInvoice_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `party` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `DeliveryInvoice_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deliveryinvoice`
--

LOCK TABLES `deliveryinvoice` WRITE;
/*!40000 ALTER TABLE `deliveryinvoice` DISABLE KEYS */;
/*!40000 ALTER TABLE `deliveryinvoice` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:05:42
