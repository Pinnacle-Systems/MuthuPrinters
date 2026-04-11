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
-- Table structure for table `productuompricedetails`
--

DROP TABLE IF EXISTS `productuompricedetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productuompricedetails` (
  `id` int NOT NULL AUTO_INCREMENT,
  `price` double NOT NULL DEFAULT '0',
  `uomId` int DEFAULT NULL,
  `productId` int NOT NULL,
  `poBillItemsId` int DEFAULT NULL,
  `poReturnItemsId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ProductUomPriceDetails_productId_fkey` (`productId`),
  KEY `ProductUomPriceDetails_uomId_fkey` (`uomId`),
  KEY `ProductUomPriceDetails_poBillItemsId_fkey` (`poBillItemsId`),
  CONSTRAINT `ProductUomPriceDetails_poBillItemsId_fkey` FOREIGN KEY (`poBillItemsId`) REFERENCES `pobillitems` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ProductUomPriceDetails_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ProductUomPriceDetails_uomId_fkey` FOREIGN KEY (`uomId`) REFERENCES `uom` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productuompricedetails`
--

LOCK TABLES `productuompricedetails` WRITE;
/*!40000 ALTER TABLE `productuompricedetails` DISABLE KEYS */;
/*!40000 ALTER TABLE `productuompricedetails` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:05:49
