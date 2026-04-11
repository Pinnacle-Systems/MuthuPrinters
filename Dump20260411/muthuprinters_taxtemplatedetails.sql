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
-- Table structure for table `taxtemplatedetails`
--

DROP TABLE IF EXISTS `taxtemplatedetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `taxtemplatedetails` (
  `id` int NOT NULL AUTO_INCREMENT,
  `taxTemplateId` int NOT NULL,
  `taxTermId` int NOT NULL,
  `displayName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `TaxTemplateDetails_taxTemplateId_fkey` (`taxTemplateId`),
  KEY `TaxTemplateDetails_taxTermId_fkey` (`taxTermId`),
  CONSTRAINT `TaxTemplateDetails_taxTemplateId_fkey` FOREIGN KEY (`taxTemplateId`) REFERENCES `taxtemplate` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `TaxTemplateDetails_taxTermId_fkey` FOREIGN KEY (`taxTermId`) REFERENCES `taxterm` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `taxtemplatedetails`
--

LOCK TABLES `taxtemplatedetails` WRITE;
/*!40000 ALTER TABLE `taxtemplatedetails` DISABLE KEYS */;
INSERT INTO `taxtemplatedetails` VALUES (58,2,11,'GROSS','0','price * qty'),(59,2,14,'DISCOUNT','discountValue','discountType ? ((discountType === \'Flat\') ? discountValue : ({GROSS_AMOUNT}) / 100 * parseInt(discountValue)) : 0'),(60,2,13,'TAXABLE','0','substract(substract( ({GROSS_AMOUNT}), ({DISCOUNT_AMOUNT}) ), ({OVERALLDISCOUNT_AMOUNT}))'),(61,2,20,'OVERALLDISCOUNT','0','((overAllDiscountType=== \'Flat\') ? overAllDiscountValue : ({GROSS_AMOUNT})/ 100 * parseInt(overAllDiscountValue))'),(62,2,15,'SGST','isSupplierOutside ? 0 : taxPercent / 2','({TAXABLE_AMOUNT}) / 100 * ({SGST_VALUE})'),(63,2,16,'CGST','isSupplierOutside ? 0 : taxPercent / 2','({TAXABLE_AMOUNT}) / 100 * ({CGST_VALUE})'),(64,2,12,'NET','(Number({TAXABLE_AMOUNT}) + Number({SGST_AMOUNT}) + Number({CGST_AMOUNT})).toFixed(2)','Math.round(({NET_VALUE}))'),(65,2,18,'ROUNDOFF','0','substract(({NET_AMOUNT}), ({NET_VALUE}))'),(71,5,15,'SGST','9+9',''),(72,5,16,'CGST','9+9',''),(73,5,18,'','','');
/*!40000 ALTER TABLE `taxtemplatedetails` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:05:46
