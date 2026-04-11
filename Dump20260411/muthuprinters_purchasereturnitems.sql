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
-- Table structure for table `purchasereturnitems`
--

DROP TABLE IF EXISTS `purchasereturnitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchasereturnitems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchaseInwardReturnId` int DEFAULT NULL,
  `uomId` int DEFAULT NULL,
  `styleItemId` int DEFAULT NULL,
  `hsnId` int DEFAULT NULL,
  `poQty` double DEFAULT NULL,
  `returnQty` double DEFAULT NULL,
  `returnType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purchaseInwardId` int DEFAULT NULL,
  `batchNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `colorId` int DEFAULT NULL,
  `itemGroupId` int DEFAULT NULL,
  `sizeId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `PurchaseReturnItems_purchaseInwardReturnId_fkey` (`purchaseInwardReturnId`),
  KEY `PurchaseReturnItems_uomId_fkey` (`uomId`),
  KEY `PurchaseReturnItems_styleItemId_fkey` (`styleItemId`),
  KEY `PurchaseReturnItems_hsnId_fkey` (`hsnId`),
  KEY `PurchaseReturnItems_purchaseInwardId_fkey` (`purchaseInwardId`),
  KEY `PurchaseReturnItems_itemGroupId_fkey` (`itemGroupId`),
  KEY `PurchaseReturnItems_sizeId_fkey` (`sizeId`),
  KEY `PurchaseReturnItems_colorId_fkey` (`colorId`),
  CONSTRAINT `PurchaseReturnItems_colorId_fkey` FOREIGN KEY (`colorId`) REFERENCES `color` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PurchaseReturnItems_hsnId_fkey` FOREIGN KEY (`hsnId`) REFERENCES `hsn` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PurchaseReturnItems_itemGroupId_fkey` FOREIGN KEY (`itemGroupId`) REFERENCES `itemgroup` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PurchaseReturnItems_purchaseInwardId_fkey` FOREIGN KEY (`purchaseInwardId`) REFERENCES `purchaseinward` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PurchaseReturnItems_purchaseInwardReturnId_fkey` FOREIGN KEY (`purchaseInwardReturnId`) REFERENCES `purchaseinwardreturn` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PurchaseReturnItems_sizeId_fkey` FOREIGN KEY (`sizeId`) REFERENCES `size` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PurchaseReturnItems_styleItemId_fkey` FOREIGN KEY (`styleItemId`) REFERENCES `styleitem` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PurchaseReturnItems_uomId_fkey` FOREIGN KEY (`uomId`) REFERENCES `uom` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchasereturnitems`
--

LOCK TABLES `purchasereturnitems` WRITE;
/*!40000 ALTER TABLE `purchasereturnitems` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchasereturnitems` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:06:33
