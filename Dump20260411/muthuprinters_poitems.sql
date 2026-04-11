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
-- Table structure for table `poitems`
--

DROP TABLE IF EXISTS `poitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `poitems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `poId` int DEFAULT NULL,
  `uomId` int DEFAULT NULL,
  `styleItemId` int DEFAULT NULL,
  `hsnId` int DEFAULT NULL,
  `qty` double DEFAULT NULL,
  `price` double DEFAULT NULL,
  `discountType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discountValue` double DEFAULT NULL,
  `taxPercent` double DEFAULT NULL,
  `quoteVersion` int NOT NULL DEFAULT '1',
  `colorId` int DEFAULT NULL,
  `itemGroupId` int DEFAULT NULL,
  `sizeId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `PoItems_poId_fkey` (`poId`),
  KEY `PoItems_uomId_fkey` (`uomId`),
  KEY `PoItems_styleItemId_fkey` (`styleItemId`),
  KEY `PoItems_hsnId_fkey` (`hsnId`),
  KEY `PoItems_itemGroupId_fkey` (`itemGroupId`),
  KEY `PoItems_sizeId_fkey` (`sizeId`),
  KEY `PoItems_colorId_fkey` (`colorId`),
  CONSTRAINT `PoItems_colorId_fkey` FOREIGN KEY (`colorId`) REFERENCES `color` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PoItems_hsnId_fkey` FOREIGN KEY (`hsnId`) REFERENCES `hsn` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PoItems_itemGroupId_fkey` FOREIGN KEY (`itemGroupId`) REFERENCES `itemgroup` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PoItems_poId_fkey` FOREIGN KEY (`poId`) REFERENCES `po` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PoItems_sizeId_fkey` FOREIGN KEY (`sizeId`) REFERENCES `size` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PoItems_styleItemId_fkey` FOREIGN KEY (`styleItemId`) REFERENCES `styleitem` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PoItems_uomId_fkey` FOREIGN KEY (`uomId`) REFERENCES `uom` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=125 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `poitems`
--

LOCK TABLES `poitems` WRITE;
/*!40000 ALTER TABLE `poitems` DISABLE KEYS */;
INSERT INTO `poitems` VALUES (119,61,14,15,5,1100,28,NULL,NULL,18,1,NULL,2,8),(120,61,14,15,5,1100,28,NULL,0,18,2,NULL,2,8),(121,62,11,16,5,2157,47,NULL,NULL,18,1,11,2,6),(122,63,11,17,6,10,715,NULL,NULL,18,1,NULL,8,NULL),(123,64,12,6,3,100,10,NULL,NULL,5,1,NULL,3,NULL),(124,64,11,16,5,2000,20,NULL,NULL,18,1,NULL,2,NULL);
/*!40000 ALTER TABLE `poitems` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:06:47
