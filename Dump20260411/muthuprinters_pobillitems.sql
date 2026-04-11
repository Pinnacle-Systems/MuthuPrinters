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
-- Table structure for table `pobillitems`
--

DROP TABLE IF EXISTS `pobillitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pobillitems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `purchaseBillId` int DEFAULT NULL,
  `productBrandId` int DEFAULT NULL,
  `productCategoryId` int DEFAULT NULL,
  `productId` int NOT NULL,
  `qty` double DEFAULT NULL,
  `price` double DEFAULT NULL,
  `stockQty` double DEFAULT NULL,
  `box` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `PoBillItems_purchaseBillId_fkey` (`purchaseBillId`),
  KEY `PoBillItems_productBrandId_fkey` (`productBrandId`),
  KEY `PoBillItems_productCategoryId_fkey` (`productCategoryId`),
  KEY `PoBillItems_productId_fkey` (`productId`),
  CONSTRAINT `PoBillItems_productBrandId_fkey` FOREIGN KEY (`productBrandId`) REFERENCES `productbrand` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PoBillItems_productCategoryId_fkey` FOREIGN KEY (`productCategoryId`) REFERENCES `productcategory` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PoBillItems_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `PoBillItems_purchaseBillId_fkey` FOREIGN KEY (`purchaseBillId`) REFERENCES `purchasebill` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pobillitems`
--

LOCK TABLES `pobillitems` WRITE;
/*!40000 ALTER TABLE `pobillitems` DISABLE KEYS */;
/*!40000 ALTER TABLE `pobillitems` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:06:58
