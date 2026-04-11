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
-- Table structure for table `stock`
--

DROP TABLE IF EXISTS `stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock` (
  `id` int NOT NULL AUTO_INCREMENT,
  `inOrOut` enum('In','Out') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `productId` int DEFAULT NULL,
  `qty` double DEFAULT NULL,
  `poBillItemsId` int DEFAULT NULL,
  `branchId` int DEFAULT NULL,
  `salesBillItemsId` int DEFAULT NULL,
  `createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `poReturnItemsId` int DEFAULT NULL,
  `salesReturnItemsId` int DEFAULT NULL,
  `OpeningStockItemsId` int DEFAULT NULL,
  `hsnId` int DEFAULT NULL,
  `inwardItemsId` int DEFAULT NULL,
  `styleItemId` int DEFAULT NULL,
  `uomId` int DEFAULT NULL,
  `inwardType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdById` int DEFAULT NULL,
  `processName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedAt` datetime(3) DEFAULT NULL,
  `updatedById` int DEFAULT NULL,
  `storeId` int DEFAULT NULL,
  `batchNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purchaseReturnItemsId` int DEFAULT NULL,
  `colorId` int DEFAULT NULL,
  `itemGroupId` int DEFAULT NULL,
  `sizeId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Stock_poBillItemsId_key` (`poBillItemsId`),
  UNIQUE KEY `Stock_salesBillItemsId_key` (`salesBillItemsId`),
  UNIQUE KEY `Stock_poReturnItemsId_key` (`poReturnItemsId`),
  UNIQUE KEY `Stock_salesReturnItemsId_key` (`salesReturnItemsId`),
  UNIQUE KEY `Stock_OpeningStockItemsId_key` (`OpeningStockItemsId`),
  KEY `Stock_productId_fkey` (`productId`),
  KEY `Stock_branchId_fkey` (`branchId`),
  KEY `Stock_inwardItemsId_fkey` (`inwardItemsId`),
  KEY `Stock_uomId_fkey` (`uomId`),
  KEY `Stock_styleItemId_fkey` (`styleItemId`),
  KEY `Stock_hsnId_fkey` (`hsnId`),
  KEY `Stock_createdById_fkey` (`createdById`),
  KEY `Stock_updatedById_fkey` (`updatedById`),
  KEY `Stock_storeId_fkey` (`storeId`),
  KEY `Stock_purchaseReturnItemsId_fkey` (`purchaseReturnItemsId`),
  KEY `Stock_itemGroupId_fkey` (`itemGroupId`),
  KEY `Stock_sizeId_fkey` (`sizeId`),
  KEY `Stock_colorId_fkey` (`colorId`),
  CONSTRAINT `Stock_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Stock_colorId_fkey` FOREIGN KEY (`colorId`) REFERENCES `color` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Stock_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Stock_hsnId_fkey` FOREIGN KEY (`hsnId`) REFERENCES `hsn` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Stock_inwardItemsId_fkey` FOREIGN KEY (`inwardItemsId`) REFERENCES `inwarditems` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Stock_itemGroupId_fkey` FOREIGN KEY (`itemGroupId`) REFERENCES `itemgroup` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Stock_OpeningStockItemsId_fkey` FOREIGN KEY (`OpeningStockItemsId`) REFERENCES `openingstockitems` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Stock_poBillItemsId_fkey` FOREIGN KEY (`poBillItemsId`) REFERENCES `pobillitems` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Stock_poReturnItemsId_fkey` FOREIGN KEY (`poReturnItemsId`) REFERENCES `poreturnitems` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Stock_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Stock_purchaseReturnItemsId_fkey` FOREIGN KEY (`purchaseReturnItemsId`) REFERENCES `purchasereturnitems` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Stock_salesBillItemsId_fkey` FOREIGN KEY (`salesBillItemsId`) REFERENCES `salesbillitems` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Stock_salesReturnItemsId_fkey` FOREIGN KEY (`salesReturnItemsId`) REFERENCES `salesreturnitems` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Stock_sizeId_fkey` FOREIGN KEY (`sizeId`) REFERENCES `size` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Stock_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `location` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Stock_styleItemId_fkey` FOREIGN KEY (`styleItemId`) REFERENCES `styleitem` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Stock_uomId_fkey` FOREIGN KEY (`uomId`) REFERENCES `uom` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Stock_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9602 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock`
--

LOCK TABLES `stock` WRITE;
/*!40000 ALTER TABLE `stock` DISABLE KEYS */;
INSERT INTO `stock` VALUES (9451,'In',53,100,NULL,1,NULL,'2025-05-29 03:52:44.996',NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(9599,'In',NULL,2157,NULL,1,NULL,'2026-04-08 10:22:56.690',NULL,NULL,NULL,5,105,16,11,'Order Purchase Inward',12,'Purchase Inward','2026-04-08 10:39:48.014',12,4,NULL,'6058/TPR',NULL,11,2,6);
/*!40000 ALTER TABLE `stock` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:06:25
