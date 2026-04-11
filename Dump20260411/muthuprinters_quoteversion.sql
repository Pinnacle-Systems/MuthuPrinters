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
-- Table structure for table `quoteversion`
--

DROP TABLE IF EXISTS `quoteversion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quoteversion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `poId` int DEFAULT NULL,
  `quoteVersion` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `QuoteVersion_poId_fkey` (`poId`),
  CONSTRAINT `QuoteVersion_poId_fkey` FOREIGN KEY (`poId`) REFERENCES `po` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quoteversion`
--

LOCK TABLES `quoteversion` WRITE;
/*!40000 ALTER TABLE `quoteversion` DISABLE KEYS */;
INSERT INTO `quoteversion` VALUES (48,NULL,1),(49,NULL,1),(50,NULL,1),(51,NULL,2),(52,NULL,1),(53,NULL,1),(54,NULL,1),(55,NULL,1),(56,NULL,1),(57,NULL,1),(58,NULL,1),(59,NULL,1),(60,NULL,1),(61,NULL,1),(62,NULL,1),(63,NULL,1),(64,NULL,1),(65,NULL,1),(66,NULL,1),(67,NULL,1),(68,NULL,1),(69,NULL,1),(70,NULL,1),(71,NULL,1),(72,NULL,1),(73,61,1),(74,62,1),(75,63,1),(76,64,1);
/*!40000 ALTER TABLE `quoteversion` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:06:34
