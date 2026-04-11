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
-- Table structure for table `partybranch`
--

DROP TABLE IF EXISTS `partybranch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partybranch` (
  `id` int NOT NULL AUTO_INCREMENT,
  `partyId` int DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aliasName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `displayName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cityId` int DEFAULT NULL,
  `pincode` int DEFAULT NULL,
  `panNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tinNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cstNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cstDate` date DEFAULT NULL,
  `cinNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `faxNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactPersonName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gstNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `costCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `contactMobile` bigint DEFAULT '0',
  `companyId` int DEFAULT NULL,
  `yarn` tinyint(1) DEFAULT '0',
  `fabric` tinyint(1) DEFAULT '0',
  `accessoryGroup` tinyint(1) DEFAULT '0',
  `createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) DEFAULT NULL,
  `createdById` int DEFAULT NULL,
  `updatedById` int DEFAULT NULL,
  `isSupplier` tinyint(1) DEFAULT '0',
  `isCustomer` tinyint(1) DEFAULT '0',
  `landMark` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `designation` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactPersonEmail` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alterContactNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bankname` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bankBranchName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accountNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ifscCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coa` bigint DEFAULT NULL,
  `soa` bigint DEFAULT NULL,
  `msmeNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `companyAlterNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `partyCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `PartyBranch_partyId_fkey` (`partyId`),
  KEY `PartyBranch_cityId_fkey` (`cityId`),
  KEY `PartyBranch_updatedById_fkey` (`updatedById`),
  KEY `PartyBranch_companyId_fkey` (`companyId`),
  KEY `PartyBranch_createdById_fkey` (`createdById`),
  CONSTRAINT `PartyBranch_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `city` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PartyBranch_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PartyBranch_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `PartyBranch_partyId_fkey` FOREIGN KEY (`partyId`) REFERENCES `party` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `PartyBranch_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partybranch`
--

LOCK TABLES `partybranch` WRITE;
/*!40000 ALTER TABLE `partybranch` DISABLE KEYS */;
/*!40000 ALTER TABLE `partybranch` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:07:05
