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
-- Table structure for table `deliveryinvoiceitems`
--

DROP TABLE IF EXISTS `deliveryinvoiceitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deliveryinvoiceitems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `deliveryInvoiceId` int DEFAULT NULL,
  `styleId` int DEFAULT NULL,
  `styleItemId` int DEFAULT NULL,
  `noOfBox` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uomId` int DEFAULT NULL,
  `colorId` int DEFAULT NULL,
  `qty` double DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '0',
  `deliveryChallanItemsId` int DEFAULT NULL,
  `price` double DEFAULT NULL,
  `deliveryChallanId` int DEFAULT NULL,
  `invoiceQty` double DEFAULT NULL,
  `hsnId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `DeliveryInvoiceItems_styleId_fkey` (`styleId`),
  KEY `DeliveryInvoiceItems_styleItemId_fkey` (`styleItemId`),
  KEY `DeliveryInvoiceItems_uomId_fkey` (`uomId`),
  KEY `DeliveryInvoiceItems_colorId_fkey` (`colorId`),
  KEY `DeliveryInvoiceItems_deliveryChallanItemsId_fkey` (`deliveryChallanItemsId`),
  KEY `DeliveryInvoiceItems_deliveryChallanId_fkey` (`deliveryChallanId`),
  KEY `DeliveryInvoiceItems_deliveryInvoiceId_fkey` (`deliveryInvoiceId`),
  KEY `DeliveryInvoiceItems_hsnId_fkey` (`hsnId`),
  CONSTRAINT `DeliveryInvoiceItems_colorId_fkey` FOREIGN KEY (`colorId`) REFERENCES `color` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `DeliveryInvoiceItems_deliveryChallanId_fkey` FOREIGN KEY (`deliveryChallanId`) REFERENCES `deliverychallan` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DeliveryInvoiceItems_deliveryChallanItemsId_fkey` FOREIGN KEY (`deliveryChallanItemsId`) REFERENCES `deliverychallanitems` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `DeliveryInvoiceItems_deliveryInvoiceId_fkey` FOREIGN KEY (`deliveryInvoiceId`) REFERENCES `deliveryinvoice` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DeliveryInvoiceItems_hsnId_fkey` FOREIGN KEY (`hsnId`) REFERENCES `hsn` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `DeliveryInvoiceItems_styleId_fkey` FOREIGN KEY (`styleId`) REFERENCES `style` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `DeliveryInvoiceItems_styleItemId_fkey` FOREIGN KEY (`styleItemId`) REFERENCES `styleitem` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `DeliveryInvoiceItems_uomId_fkey` FOREIGN KEY (`uomId`) REFERENCES `uom` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deliveryinvoiceitems`
--

LOCK TABLES `deliveryinvoiceitems` WRITE;
/*!40000 ALTER TABLE `deliveryinvoiceitems` DISABLE KEYS */;
/*!40000 ALTER TABLE `deliveryinvoiceitems` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:07:02
