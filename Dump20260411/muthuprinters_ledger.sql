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
-- Table structure for table `ledger`
--

DROP TABLE IF EXISTS `ledger`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ledger` (
  `id` int NOT NULL AUTO_INCREMENT,
  `EntryType` enum('Purchase_Bill','Process_Bill','Sales','My_Payment','Customer_Payment','Credit_Note','Debit_Note','Opening_Balance','Printing_Job_Work') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LedgerType` enum('Supplier','Customer') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creditOrDebit` enum('Credit','Debit') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deliveryInvoiceId` int DEFAULT NULL,
  `partyId` int DEFAULT NULL,
  `amount` double DEFAULT NULL,
  `dcNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `partyBillDate` date DEFAULT NULL,
  `partyBillNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) DEFAULT NULL,
  `dcDate` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Ledger_deliveryInvoiceId_key` (`deliveryInvoiceId`),
  KEY `Ledger_partyId_fkey` (`partyId`),
  CONSTRAINT `Ledger_deliveryInvoiceId_fkey` FOREIGN KEY (`deliveryInvoiceId`) REFERENCES `deliveryinvoice` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Ledger_partyId_fkey` FOREIGN KEY (`partyId`) REFERENCES `party` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ledger`
--

LOCK TABLES `ledger` WRITE;
/*!40000 ALTER TABLE `ledger` DISABLE KEYS */;
/*!40000 ALTER TABLE `ledger` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:06:02
