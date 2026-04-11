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
-- Table structure for table `employee`
--

DROP TABLE IF EXISTS `employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `regNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chamberNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `departmentId` int DEFAULT NULL,
  `joiningDate` datetime(3) DEFAULT NULL,
  `fatherName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dob` datetime(3) DEFAULT NULL,
  `gender` enum('MALE','FEMALE','OTHER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `maritalStatus` enum('SINGLE','MARRIED','SEPARATED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bloodGroup` enum('AP','BP','AN','BN','ABP','ABN','OP','ON') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `panNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consultFee` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salaryPerMonth` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `commissionCharges` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mobile` bigint DEFAULT NULL,
  `accountNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ifscNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branchName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `degree` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialization` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `localAddress` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `localCityId` int DEFAULT NULL,
  `localPincode` int DEFAULT NULL,
  `permAddress` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permCityId` int DEFAULT NULL,
  `permPincode` int DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `image` longblob,
  `branchId` int DEFAULT NULL,
  `employeeCategoryId` int DEFAULT NULL,
  `permanent` tinyint(1) DEFAULT '0',
  `leavingReason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `leavingDate` datetime(3) DEFAULT NULL,
  `canRejoin` tinyint(1) DEFAULT '1',
  `rejoinReason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) DEFAULT NULL,
  `bankName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `employeeId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Employee_regNo_key` (`regNo`),
  KEY `Employee_departmentId_fkey` (`departmentId`),
  KEY `Employee_permCityId_fkey` (`permCityId`),
  KEY `Employee_branchId_fkey` (`branchId`),
  KEY `Employee_employeeCategoryId_fkey` (`employeeCategoryId`),
  KEY `Employee_localCityId_fkey` (`localCityId`),
  CONSTRAINT `Employee_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Employee_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Employee_employeeCategoryId_fkey` FOREIGN KEY (`employeeCategoryId`) REFERENCES `employeecategory` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Employee_localCityId_fkey` FOREIGN KEY (`localCityId`) REFERENCES `city` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Employee_permCityId_fkey` FOREIGN KEY (`permCityId`) REFERENCES `city` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee`
--

LOCK TABLES `employee` WRITE;
/*!40000 ALTER TABLE `employee` DISABLE KEYS */;
INSERT INTO `employee` VALUES (9,'SELVA MANI ','SELVAMANIB986@GAMIL.COM','MS/EMP/1','',7,'2025-01-01 00:00:00.000','','2025-01-01 00:00:00.000','MALE','SINGLE','AP','','','','',9025070195,'','895T3-558','COLLEGE ROAD','BS CIT','','WDF;WJFKBN IWDHF',NULL,NULL,'',NULL,641652,1,_binary 'ÿ\Øÿ\à\0JFIF\0\0\0\0\0\0ÿ\Û\0„\0	\r\r( \Z%!1!%)+...383,7(-.+\n\n\n\r-%--+-+-+---------------+----+---+---+--------------ÿÀ\0\0\ê\0\×\0ÿ\Ä\0\0\0\0\0\0\0\0\0\0\0\0\0\0ÿ\Ä\0I\0\n	\0\0\0\0\0!1AQ‘Raq±\"2’¡Áğ#BSbr‚²\Â\Ñ$3Cs“¢\Ã\ác\ÒñDd£³ÿ\Ä\0\0\0\0\0\0\0\0\0\0\0\0\0ÿ\Ä\06\0\0\0\0\0!1QAa‘\"q¡±Á\Ñ23\áğ#Bñ$r4Rÿ\Ú\0\0\0?\0¹…\æŞ\Ğ\0€@ Et\Ğ@]t\Ğ@\Ğ5\Z„¦ @\"\0¡$P ²\Ê,€²\È D)I D¢	\0‰P wR”‚H€€@ ’„\0€@Š\ÈD•*GDì¥ò=‘±º\Ş÷´v’‘3¤\"f\"5•_(\ç\í,w²J‡\é÷bp¿xiª›\çórs\Ûk¬t\æ\ÑT\çõ[\Å\ÇM\ÜZù\Ç¥¾6<q\Öe¦v»øD1zeßŒub·¬]eÿ\0o‹ù9;²i³ö±§\Ëe<­\Ú0º7qÃ‚\Æv<s\ÒfF\×x\ë¢Ñ‘3Îš¤¶7ŞWX\ÈAc\æÉªıDv]sd\ÙoNq\Îöšß”ò•‘s7š!”  5 $’„\0€*`@”*F“9sŠ*&rg‹\Ç6\Ñ\Óq\Ø\ß›Hİ‡\äŸ&¬¹£y¹T\Ês\Õ?\ï/#\Íh\Ñ:˜\İC·Y\ÚJ³¦:\Ò4¬+¯{^u´±L\08_^\İcz˜“Ü¶ù\ã}4®.’œF\ç¹ÑNòÓ·s†\å]µ\âŠ\Ïx»öl“h\áŸ¼.GQ¨(JH€€P\Z$\"	HY	(A)0 €\".R­m<2\Ìÿ\065»sGY6\ë:Vmh¬x±½¢µ™—¯®|ò>i]w\Èq8\ìš7\04\ÅsZEb+\n«Zm:\Ë\á\r|T\è\ÇXHNÓ´w\èM$\Õ\è\n€ E\ÎR1¥˜\Ü’\rÃšK\\ğF‘Ú²ˆc2¿\æ&yI$¤«v7?DŸ9\ÇdRo\'c¶\ê7&\ê¿iÙ¢#Ÿ¼;v}¢fxoûK¡.p\nš  0¡!@ ˆY	+! TyL¨,¢k6MQ]\ØÖ½ş,j\ì\Ø\ã\\“=¡ÍµÎ”ˆór™~\Í\Ê\Î![2·f·\'5uğŠƒ$t\ĞÉ¦##\\÷\Ê:a€‹7q\'N»Z\Ä\ál‘YÑ•i6\æ\È\Ê|”\å0º¨\rŒyŠSö_fÿ\0Rˆ\ËY\'¡Q\Ê9.ª”Ÿ„S\ÔAm¤\ìgs\í„÷²&\'£\ä\Ã_LqN†¬\ì›EWTCi¡rM¯e\Í®{\ÈXÎ‘Ô‰™\è¹\äşIò„­\Å<\Ôô\äØ†\é\Ş:†\Í\Î+	\ËX\è\Î1\Úz«9Ó›52f\Å>	\Z]±’Y \Ç^E\Å\ÆËk:\Ş-˜\Ú4–˜8´‡4–¹¤9®\Z\Ú\àn:Áe\ïb\ïù:¨M3\rS\Å£\í°;Ú¨o^Lv]R\ÜU‰\î\ÈI¨PD’…h jJ‘‚™Êœ%\Ô,xı\ÕLnwac\Ù\â\æ®ÍŠt\É1\Ş»dkHŸ7\'”Ù®;ğVŠ\É}I“bÁm\068£`@\00\0=K†z»\"92”¡‚÷\æaÅ¿›eø\ÙN²!\î7l6(H(9—. |ˆ\í\È/\Ôc\Ò=C‚ßƒ¬µerºÀ\Âë¡¡\ß2%9Š–š#®*xc=­ ø*,“­\æ{Ì®±\Ç\r\";D3‚Ášj\0€@(D,ƒ@ ©b‰P–§:ry©¢©„¹\Ñ0o{{¤Ğ·a¿\âZ³SŠ“#AMğ‰a€\Ü\Ë õ\êWSËšŸ«\ê]Ë\Úw@ h\ĞA\Ïyk¦. †AûŠ¶u5ñ½¿x·Šİ†}¦¬\İ«62oÂ«)\àµ\Ú\é\ä\ÑqÍ³\Ê}û@\Ã\Ú\à¶\æ¿&\Íx©\Çx«»*E\È\nÂ€ @ $D,„J¢(”\à…\Ïv\ë\×s¨\r\ë*\Öm:CZ+\ZËœ\ä¬\Ú4\Ù\Í&\Æ6ºZ\Ön\æ\İ\Ël>Œ‡\ÙV\Ü_\â\ç×¢§Oòy.O)g\æ\Ñ\äºF08†¾¢ª9\\ö\Ü\Ù\ØXö\á\'A¶›,kLs\ÖYZù;+,\Ê9\ÍS#¢§¬\ÉVb.†šz	dh\Æ\í8\È\0\å·ğñ\ÇX–ŸÄ¼ô•\Ç1 \Ë¥¥d„˜¹Œ<Ç’<³h\×vkÜ´d\à\å\Âßı–ZÀó‚3io:4;	\Âtõ\Ùa\r“Ó“”\ÉO\Ñ1\ÒIYMq‹¾Id\Éí‚ö»œ\æXi\ŞWTF+t‡,\ÎJõ–NHÊ¹\Ï#q\Â\ì^Æ»É©\Ş\Ğ\ë_	1= Û­E©:\ë	­òONm\Ær\ZÊ¬‹”E})d†!+y¹\Ù;$\æ\Ü$\Ä0\ém‹-c¿^µ®ºE\ã†[-35(iù+\ÍW²\ÙA\Ö\ÇT\Ü0²\ŞSb\Ò\ë\ïy\0\Ûs[½k\Úõ¼pÇƒn\Ë1Y\Ö|WX±‘!Pd	JM@JB\Ét\Ğ@]t”*FvGw”á´¶üù[ğu–Œı!‹.I?¤)\êˆ$\ÇD%\Û×€\ás¼júEt\Öf\"c»E\â-¥£Ác§—¯¯e–t¿\êÕ’œQ£\æ&\ç%e\'\Ö\Z†\Ë+)\ã\rp’\Ï\Ğ‡V†\î½\Î\å\Ñ;Di\Êñ‚u\ç.‚\ç\\“¿J\år\êˆĞ”%«\Î\ì‘úC\'T\Ğ\ãš€\Â\É¸k™#^.7\Ği[±e\àğiË‹‹œ5|›\æ«òE°K,sIQ7:\çF\Ğ\Z\Z\Z/¤\ê&ú5¬²f\â\"\ã\Å5e·\ÎJWMC[mŠjJˆ›}Xš/\ŞB\Ó\Ã:Ïƒt\Öm\ZG‰d:b61 ¶8£dLnğ\Ğ\0<­j®³33\â\İyˆˆ¬x0¦>S­¨¹\Öâ¸­ù¥\×^€P”‚$\Ô\èt\ĞD•\Ñ\0,ƒ@\"\0€(\"Q)C!cƒ†±Àõ)­¦³¬\"Õ‹F’\Û\Ã[\ì!\Ç\ä|u.ºå­œv\Åj²\Æ\0€@]\0¤\'8\0I6\0\\•:F²DkÉ…U”ˆa¹:1i\0vu­\Í\ZiVüxg]l\Ö.WH$‰4A \Z€ŠA \0€@*@¡\"7\ás]\Ñ ğ*k:LJ&5‰……w¸9¥-±\ÂH¿•mc­Dòeª\r© 2\î\Şl@hëº.ÉšLF²÷Y0\nF.Q}£;\ÜCG¿`+ViÒ­˜£[\ÃP°(\0D¤ˆ€º€D,„‘\0€@ . H\"\äKm’\ê13ó™\ën\Î\Z¸.¼7\Ö4\ì\ä\Í]\'^ì·ƒm°‘q\Â\ánj!s^\'UŠ ş‹=3ş\Ô\Ğ/,ô\Z6ù\Ï\'\ÂŞ´9½%§\Ê3\ãu‡š\Í§i\\™o¬\é\Ù×ŠšF³\â\ÅZ›L(I h@@ \n\n!¬„‘\0€@\n\è\"\äKÒü\ãp›;M¸f?\Í2i\ÃÍº§œ<np\Öİ¡u\Ä\ê\äµf«&!@bO>#‡\ë8lmÖ°™×”6Vºs–œ.\'a©\0P$¤\0@ \"\"Ht\n\è	t\n\êB@‰AŸ’¨$y\ç@ò{“£ƒp\İ\ë£\ÛÛÑ›5+\ìOY{\Õ@|ö\ß\×mg¬u­¶a[xKÉ•\ï\Z\ì\î\İÔ±‹\Ë)\Ç	¤zøSÆ\Âóy:¢I·ctò±\Ög“(­kÍŸMMa¾s´¼şKei\á-W¿ûOƒUYFø]…\â\ÇX#K\\7‚¹2b¶9á³§Z\ä*¼VÂ„€PH@@\î€@ &	\nCD\n\èÔ…t\è(5Uùvn\Ü\\äš„q\ÙÎ¾\âuòºğ\ìY²óˆ\Ò;Ë“6İ‡)g´:•4\"61ƒS\ZùV´¬V±XğU^\ÓkM§ÅƒYDE\ÜÁqµ£X\ì\\\Ùpø\ÕÕ‹?…š™©\Z\í:ñù.Y¬K²/0ñ?{´u\r+ş\'“2š˜%$\'´­•®¼¡ª\×ñ´·4tšN—¨.\ÜX¸9\ÏW\\¼|££KŸul‚•³=®8%c|›b\×_wöi\Ï\ZW¬6˜Á36\é*­T‚\Ù\È\×ò^>\ÉÒª²\ì\Ùq~zşş«l;N,ß’\Úùxú3V†òR„P\Ğ; w@(I K$¤% P\Ğx\Ô\ÕGqHö1»\Ü\à/Ù½gLv¼\éX\ÖX_%)\Z\Şt6‚¿;bm\Ä,t§¤|†w_I\à–-Õ’\ÜòNŸû+r\ï\\u\å5øG\ß\à¯\×eš‰ô>K4üˆ\î\Ævo=\ä«L;]#Y\ï<\ÕY¶\Ü\ÙyL\é£“†\Ü\ì[¹\Èşø]6\é.jõ‡\Ò*½bcTR1\×\'\É:Ë†+UñVÍ´\Ëjò…{ \åz*É¥†)œ\çE¤\Ğ\Ñ+Fr3s‰·Ñ°\ê\ØEô\Ófz»öŒy°\Ò-jõøyOŸ÷º\ÏMh³@\Õ\ÓZ\ÅyB¶Ö›N²šÉŠ‹\Êôøh¡g\ÎT¶ı‚9–\ì™£<û.Eÿ\0+­\Æ\Ù\Ñg\rT6\ç8ÎŒ·}»\çz\×mßƒ\'=4Ÿ._\ì;\Ã>>Z\ë|ş=[ú,\í…\Ú&c\â;\Ç\Æ3Õ¤pU¹wVZó\Ç1?	û|Vx·¶+r\É_Œ}ş\rõ-TrŒQ½’7{n£mJ¶ø\ït¼LOš\ËJdi11\äöºÅ‘ \n YJ•($\Z¬¡œğ\Üó\";8Ó¨q]xv\Ùy\Äi\åÉ›oÃ‹”Î³\Ú\Ú\ì\è÷†\Â\İ\ã\Ë wõk‡u\â§;\ÏúG÷÷T\æŞ™oÊ‘\Ã³ııšYds\Î\'¹\ÏqùN%\Î\âU…kZÆ•#\É]k\ÚÓ­§YyûH2‚¶\äkh\Ä;´§‘®œ\ßL1\×\Z‘\ØUr\É$Ç”\\\ï\ÇCL\ë°Ú‰Zt;|-;ºG»z\ç\É_nİƒM3dt}~Ş½”*J©!‘’\Ä\â\É\"v&<kiö‹\\´˜\'X]^•½f¶b]¯3ó¢<¡\ÆTF=õ}6\ïaõj+®—‹C\É\í›¶{\éÖ³\Ò¾+\Í\Æ\åÜ²TùTqnlÒ¸v–5¾]#¬¹¶‰\épº\\¤P\r(=\"yi\Ä\Ç9\Zœ\ÒZ\á\ŞZ±h\ÒÑ¬y•´\Öu¬\é>M\ÕtTG¢L37\éyô€ñW\å\İxoÎ\ÌúÇ§ò±Ã½sS•ı¨ôŸ_\áb\Éù\ÇO5†#\ÏÉ–Í¿cµ¥WŸw\æ\Å\ÏMc¼}º­°oyk¤öŸ¿F\áp»‚€+ Š’¥\n.\\\ËÏ\Îdn-€h\ĞeúN;º¸õz-a®(‹^5·\É\çvÍ¾\ÙfkIÒ¿?\ãÉ¦V*Ğ $ Bÿ\0\å\Ñm\é—\Ñ½Q\Î\Ñ\ÒK¶Jh^{\ãi!W\Ú4™…gX‰l-~\Ïœ”œƒğj£;\ÄÕ’ño‘&··¿\Î\ïv\åË–ºN½ŞŸu\í?‹‹‚5~^oE6\ëZ\Í\×y.Èœ\Í)ª}¹\Ê\Ë\í\Ã¾\ÚM\Ü{Z¥ÓŠºF½\Şk{m‰—ğ\ã¥~~?oû]Ø¶ªœc•jœyI\ÍöC‰\Å\'„v`eÅ}µ>\ËkI}\è$’ah\r\ÆB\ËÏ§sX÷@lN“\é7¨n\\f\Ã\\\Ñ6¬iŸ¿\î°\Øö\ëá˜­§Z|½\ßeøæ•%ŠB¬‚Aª\ÎZƒ,\Äkp¶CO¨•Ù°\ã\ã\ÏXŸ~=¿\'\Ïi^®zM­Ázw—I\"v jB*s\äŞ§œ\Ét\×\×9\ê\Ã+ƒ¦Ë‹,iywai2\Ö\Ú\å®\Õâ«§‡\æ`/ê¼µ¸D8®|\Ó\Î!\è÷54\Åk÷=?\íDZW\ÑÉ•F<™&\æ)&Œÿ\00¸EÁubŸe\å7¥t\Úm\ç¤ü¥±^ù÷;j¹\ì¡Y&ú‰:\Ã6ß4¬+òN¶™jVmh»Áah\Z\r¼=ıi	tLÙ¨2RBN¶û´z€^_o\Ç\Ú-ùú½F\ï\ÉÇ³\ÖgÃ—§&\Õq;B²AZ\Ïi>&&ô¥\Å\Ú\Z\Ãş\à­wM\Éi\í9T\ï{±\Ş~Šc†\Í\êõ@m7Ş¥ \nD\\4!\"ƒ¬ò9UŠ–¦\"nb¨s_@õ±Ë“<{NÍ}™‡@ZŸu<\îR«u\îö\ÄŞ¬kHôƒ¸®L“­¥\ë·u86jyóõŸ¶Á\Ú\êT\r\\W\ÒÉ™-¾¼x´º0\Ï)y\İó_òR\İ\ãOIşWÚ¹\ÄQ\É#¼Ø˜\çÆ‚O‚Ü¦|\Ø\ç9\ŞS\Ü\í.;\É\ÒOc\ÑY®¤¥F¡\ß\Ã\Ü ’h(FJ\é˜\Ò^[Ñšı\Ìoµ¥Pozé–³\Ş>«ı\ÑoñZ;O\ÒPªV\áY œ‚¡\ïò\àoEw¤\à?\n¼\İöoo8şüT[\Ş\Ş\İ#\Ê~Ÿe`«e93oQ?ŸµJe$@@Š³h\İ\ï\ïØ„™A|\äz¯\rdğìœ?´\Æña\ÂG\åÏ´G(—F\Ï>\ÔÃ®m;—+±ó¥UG;$“|ü’Ké¼»Ú¸§œ\ê÷§\"½¢#\Ò4y—¾Hj-UQ\ÎÓ‡ÿ\0.@?º·ar§\ß4\×m\Útõ\át\å¯šÉ•g\ç#öó®ŸSÙŠ5¼<\ÎYÒ’\áK¹^E\Z\É\î÷÷Ø h€‚.ñ6ü\Ñ0h,ùŠû>vô™½\áø•>ø¯³IóŸ\ïÁq¹\í\í^<£\ë÷\\B£_,‰AF\Î÷Ş¨„Lo‹¿ô[²º`×¼\Ï\Û\èó{\Ò\Ú\íè¿Õ¤*Á\\†\Ş\Ñ\áÿ\0*D\Ğ€‚Az=ıö¢|(7™Y\Ìe*7“`\éy£\×\Î4\Æ/\Ş\à{–¼±­e³\éxv¬\å©0\ÑU\È<\æSL[õ°>»*ûN‘+}šœy©Yñ˜ù¸\0\ìÁAg\ä\Ò|NóÌš/ıeÿ\0\Û[1~evõ¯\Í3\Úb~ŸU¯–\Z¼4´ğƒc4\å\äokoıOb±\Ù\ãÚ™x\í¢}˜‡\']n4\\P@\Ğ„N¾\Í>ş´JH7™šûU[§\Û\ëk¿\n®Ş•\×g×´\Ç\Ö;ªt\Ú=ñ?E\ì/8ôŠ\É•e÷âªœÿ\0©‡\Ñ¿…zŠ¼;=#\Ë\ç\Í\å6\Ûk´^|ş\\šõ\Ò\åA\Û:øö©R\"\à‰€\r\ĞIsHsMœ\ÒÓ¸ƒpx¨\ÓTô\è\íï”„™\Ó3US)‹~¬a#\Ñ%U\å\åCº\â/´R}óğq\à¹°Š\r¾g\Í\Í\å\n7\ä1Ÿ‘ø–tü\Ğ\äÛ«Å³\Ş<¾\\\Û\ÎWªñ\Ö\Ã\È)Á\ìt7\Î*\Ûgfe\á6‰ö¢e½\Îóy\Ş@¶(:grvú†¶z\ÜqB\í,€y2\È7¸ü†õk=[yòfÓ•]ğk\Î\Ë\ßı“0s†Ö¶/+œşeñ_®\ëG\âß»£ğ©\Ù\Ì3\ã4“¤k\Ø]%,\Æ\Ì{¼\æ:\×\æß¿@$ \Úz±d\ã7&\\\\Ë¢®¶´¢6ğ÷õ¢RD69¸ü5t\ç\é–úLs}«—n®»=\ã\Ë\å.½†t\Ú)>8—EÊ½X(’Y ’G0ª“’?§#\ß\é8Ÿjõø\ë\ÃJ×´D|7%¸¯kw™Ÿ‹\ÉfÀœ/q¼ \ZnŞ¥ ‚_¯ó÷\ëD¤‚\ë[•9ÌI\î\è\ëM;úš\ÆI#Gs]\Z­\Û#I÷½&\à,“?şb~qôT‚\áz TŒŒ’ü54\Î\èT@\î´û×¬5m®+Ç”ü™Y\åY\Ï\å\Z\É6sÎŒvFb\İGû\Õ\Ş8Ò°ù\ÖY\Öó-)Yµ¬;%¤…±EM“\ÜZ\ç?š\É+‰u\îHxÕ wª\Ø\âÓ¬\Ëur\ÍcH†\Ìò™”\Ê!õa“\Û!Xş<\Óÿ\0\"ş_\ß\İ\æ\îQò™ùt\ã²\í%O\àPÿ\0‘v¿+\ç}u\\N†yX\èœA-\Ä4‚7µÆ‘°¬«µa²\ÚÑ¤´[\ZCF…$š\ëE&bBX\İÁ\àûkÅ\Õ\ïòl\Ån•\Ó7Q^9\ìAñ«—r? Ç»ƒIö,ñ×Šõ¯y†¼–\á¤Û´K˜`\à½|¼tt ›´uø\éBRR\Z€Š?~\ïL$ƒ&:—s|\Íüs\éa\ÂO.\rº¼«/Eÿ\0\Ço“%|f\"~<ş„sÕ‚¥$Ç–¸8ki\Æ\ë:WŠ\Ñ\Ú6¬‘\r\ï>?\'”.%\ÄÜ¸’NòM\ÉWœ \í:7ø!d5\r‹¼t~~¤R/\ZaSQ=%\Õ`“\Z\î›Z\î\"\ë\Æ^¼6˜\ìöµ·b{¦V,‘YnpI†–s½˜=\"\í];x³\Óß¯§7&\İnş\í=y9ñ^¡\åB -½£\ß\Åhƒ@ ‹&xhFR›N•§h§9‡v\ì\Ïø;U-á®“\î_\Ë\ÙS=ùz\ê\Ù+®M{)w\în\r—‡\Æ\Óõú<Êµx²nş\äR€ \n}ÿ\0š	 :6@“%9\İ[\èŒ>\Å\äö\Êğ\í9øózÍŠ\Ú\ìøı\Ñğ\ä\Ï+ÔŠ\Èi3¾KR‘ó’1¼.\ïÂ¬7euÏ¯hŸ·\Õ[½-¦\r;\Ì}şŠA^…\ç$\"Zzc \Ü\Æe=\Ípq=\ËVL±I¬OûNŸ	nÇŠo˜ÿ\0X\×\ãµ¨\ÑHEN»\ï\Ñù{õ¨JH=ATyiÁy«\è›\Ç\Ùé“¼s÷\Ç)ø‚°u<\ÜU\Ç])3\İ\ã·ö~=¢1\ÇJ\Ç\Æw…Ø¢H)A ‰@oˆ·	p¶6‡·\êÜ€x´¬kx¶ºxNŸ\ßVv¤\×M|c_ÛŸØ–l\0@¼Ï’ô\È\Ş.\Åø—š\Şu\Óh™\ïöú=.\ëvh\Ó?=~­\Ñ\\VB±²y3¤÷¿\Ñh[nšûW·”G÷\ÑM½\í\ìÒ¾s>Ÿöª+µ\r›3©C\ÙR]ªL0÷a%\ßx*m\é–k|qcŸ\Û\äº\İX¢\Ô\É3\ã\Ë\ïóV¤ai-wœ\ÂZ{A±ğW´Z\"\Ñ\Òy©­Y¬\Íg¬rôEKR\à¡0M(=XUv\İM&-û=Wÿ\0\Ú5¥ğÏ‡µ\é\å?™•\ÅŞŠÖŠ\Ä\Ìô‡‘*\î•\á¬W³\ç;FiÍ–\Ù\'ı§_\ï\ìM\×~\á\í÷\êY´¤ˆ4¤\'@\'@\É\ÔL\Äs”\ÄLò²°\çeˆR\á\Ô\È\Ì7ú–·‹•V\ë\Í7œšø\Ï¯ö\Û\ÓcŒztˆ\áô\éõWUª Ô@·\æ4Ÿ;:2µş“-ø÷¯·Kyi\é?\Êûs\ÛØ½|õõ\áf*¥p‚\ÈT³\×ö}Gı\à®÷Oä¿¾[\ßó\Ó\İ*Ò¶S…\0At\Ì\Ñú³¿Œÿ\0º\ÅA½?^=\Ñõz-\Õú¼ı¬º?ZŸø…[\ì¡OrŸmÿ\0\ì_\ŞÀ].P·Y\îD½­ríŸ¥û­÷ÿ\0\æGº~F\íª¿\êW\Şõ\Êñ2ÿ\0\ë/2®^\03P\ì\nc¡)\"  H–^I¬\Óÿ\0/¾§ô/îŸ“~\Ëúô÷\Ç\Íf\Ïo\ØEüqÿ\0\Í\êŸtş­½\ßX\\\ïÒ¯ş\ßIS•óÏš  ³\æ\'ŸSõañz§\ß—\ïô\\noÍ“\İ_ªÚ©\Ïÿ\Ù',1,4,0,'',NULL,1,'','2025-12-30 06:57:16.300','2025-12-30 06:58:04.434','STATE BANO OF INDA',NULL);
/*!40000 ALTER TABLE `employee` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11 13:07:07
