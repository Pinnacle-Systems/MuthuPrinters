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
-- Table structure for table `party`
--

DROP TABLE IF EXISTS `party`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `party` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  `coa` bigint DEFAULT NULL,
  `soa` bigint DEFAULT NULL,
  `accountNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alterContactNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bankBranchName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bankname` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contactPersonEmail` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `designation` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ifscCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `landMark` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `msmeNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `companyAlterNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `partyCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parentId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branchTypeId` int DEFAULT NULL,
  `isBranch` tinyint(1) DEFAULT '0',
  `aadharNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Party_cityId_fkey` (`cityId`),
  KEY `Party_updatedById_fkey` (`updatedById`),
  KEY `Party_companyId_fkey` (`companyId`),
  KEY `Party_createdById_fkey` (`createdById`),
  KEY `Party_branchTypeId_fkey` (`branchTypeId`),
  CONSTRAINT `Party_branchTypeId_fkey` FOREIGN KEY (`branchTypeId`) REFERENCES `branchtype` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Party_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `city` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Party_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Party_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Party_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=325 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `party`
--

LOCK TABLES `party` WRITE;
/*!40000 ALTER TABLE `party` DISABLE KEYS */;
INSERT INTO `party` VALUES (321,'RAJA LAKSHMI','','RAJA LAKSHMI','','TIRUPUR',29,641654,'','','',NULL,'','','','','RAJA LASKMI','','',1,0,1,0,0,0,'2026-04-08 05:50:28.160','2026-04-08 05:50:28.160',11,NULL,1,0,0,0,NULL,NULL,NULL,'',NULL,'9638527410','RAJALAK@GMAIL.COM',NULL,NULL,NULL,NULL,NULL,'','RL',NULL,NULL,0,''),(322,'K.P.M. PAPER BOARDS','','K.P.M. PAPER BOARDS','','59, RAMAMOORTHY NAGAR MAIN ROAD,TIRUPUR, TIRUPPUR, TAMIL NADU, 641602',29,641602,'BEXPP3212D','','',NULL,'','','','','','33BEXPP3212D1ZL','',1,0,1,0,0,0,'2026-04-08 09:02:13.781','2026-04-08 09:02:13.781',12,NULL,1,0,0,0,'3711627948',NULL,'TIRUPPUR','KARUR VYSYA BANK',NULL,'9655542135',NULL,NULL,NULL,'KKBK0000492','59, RAMAMOORTHY NAGAR MAIN ROAD,',NULL,'','KPMTIRUPUR',NULL,NULL,0,''),(323,'RAJLAKSHMI PAPER AGENCIES','','RAJLAKSHMI PAPER AGENCIES','','332/10A,SILK COMPOUND,P.N.ROAD,DR.RADHAKRISHNAN NAGAR,TIRUPUR-641602',29,641602,'AAFPR6449D','','',NULL,'','','','','','33AAFPR6449D1ZP','',1,0,1,0,0,0,'2026-04-08 09:43:07.581','2026-04-08 09:43:07.581',12,NULL,1,1,0,0,'9911938020',NULL,'TIRUPUR','KOTAK MAHINDRA BANK',NULL,'0421-4330841,9677111192 , 9677111193,8012936074','RAJLAKSHMIPAPERS1997@GMAIL.COM',NULL,NULL,'KKBK0000464','P.N ROAD',NULL,'','RAJLAKSHMI',NULL,NULL,0,''),(324,'PURANDARA GRAPHIC SALES &SERVICES','','PURANDARA GRAPHIC SALES &SERVICES','','D.NO 10-A, RAMAIYA COLONY WEST II STREET',29,641602,'AABFP6355Q','','',NULL,'','','','','','33AABFP6355Q1ZS','',1,0,1,0,0,0,'2026-04-08 11:08:34.436','2026-04-08 11:08:34.436',12,NULL,1,1,0,0,'915030040672133',NULL,'PN PALAYAM','AXIS BANK CC A/C',NULL,'9894744144,9363427198',NULL,NULL,NULL,'UTIB0000090',NULL,NULL,'','PURANDARA',NULL,NULL,0,'');
/*!40000 ALTER TABLE `party` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:06:44
