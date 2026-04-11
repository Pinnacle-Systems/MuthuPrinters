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
-- Table structure for table `styleitem`
--

DROP TABLE IF EXISTS `styleitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `styleitem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aliasName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) DEFAULT '0',
  `code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hsnId` int DEFAULT NULL,
  `gsmId` int DEFAULT NULL,
  `itemGroupId` int DEFAULT NULL,
  `sizeTemplateId` int DEFAULT NULL,
  `uomId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `StyleItem_hsnId_fkey` (`hsnId`),
  KEY `StyleItem_sizeTemplateId_fkey` (`sizeTemplateId`),
  KEY `StyleItem_itemGroupId_fkey` (`itemGroupId`),
  KEY `StyleItem_uomId_fkey` (`uomId`),
  KEY `StyleItem_gsmId_fkey` (`gsmId`),
  CONSTRAINT `StyleItem_gsmId_fkey` FOREIGN KEY (`gsmId`) REFERENCES `gsm` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `StyleItem_hsnId_fkey` FOREIGN KEY (`hsnId`) REFERENCES `hsn` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `StyleItem_itemGroupId_fkey` FOREIGN KEY (`itemGroupId`) REFERENCES `itemgroup` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `StyleItem_sizeTemplateId_fkey` FOREIGN KEY (`sizeTemplateId`) REFERENCES `sizetemplate` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `StyleItem_uomId_fkey` FOREIGN KEY (`uomId`) REFERENCES `uom` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `styleitem`
--

LOCK TABLES `styleitem` WRITE;
/*!40000 ALTER TABLE `styleitem` DISABLE KEYS */;
INSERT INTO `styleitem` VALUES (6,'SINGLE SIDE SATIN','',1,NULL,3,NULL,3,4,12),(7,'BROWN BOARD','',1,NULL,NULL,NULL,2,3,11),(15,'CHINA ART BOARD','CHINA ART BOARD',1,NULL,5,NULL,2,4,14),(16,'FSC  RECYCLED 100% NR ICONIC , GB 350 GSM','',1,NULL,5,NULL,2,5,11),(17,'RCC WHITE','',1,NULL,6,NULL,8,NULL,11),(18,'JK IVORY 300 GSM ','',1,NULL,5,NULL,2,6,15);
/*!40000 ALTER TABLE `styleitem` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:06:21
