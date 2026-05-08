-- MySQL dump 10.13  Distrib 8.0.23, for Win64 (x86_64)
--
-- Host: localhost    Database: world_paintings
-- ------------------------------------------------------
-- Server version	8.0.23

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('new','read','replied') DEFAULT 'new',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` VALUES (3,'Юлия','smolskaaula@gmail.com','Потеря акаунта','Помогите восстановить пароль','2026-04-14 08:07:49','replied');
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forum_topics`
--

DROP TABLE IF EXISTS `forum_topics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forum_topics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `content` text NOT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `forum_topics`
--

LOCK TABLES `forum_topics` WRITE;
/*!40000 ALTER TABLE `forum_topics` DISABLE KEYS */;
INSERT INTO `forum_topics` VALUES (1,'ау','ау',1,'2026-04-09 17:26:54');
/*!40000 ALTER TABLE `forum_topics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `news`
--

DROP TABLE IF EXISTS `news`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `news` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `content` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `news`
--

LOCK TABLES `news` WRITE;
/*!40000 ALTER TABLE `news` DISABLE KEYS */;
INSERT INTO `news` VALUES (3,'Наследие Гауди расширяется: затерянное в горах Каталонии шале официально признали работой мастера','В год столетия со дня смерти Антонио Гауди список его шедевров официально пополнился новым объектом. Рассказываем удивительную историю затерянного в горах Каталонии шале Катльярас, авторство которого знаменитый архитектор долгое время отказывался признавать','2026-04-14 08:06:41');
/*!40000 ALTER TABLE `news` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paintings`
--

DROP TABLE IF EXISTS `paintings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paintings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `artist` varchar(100) DEFAULT NULL,
  `year` int DEFAULT NULL,
  `description` text,
  `image_url` varchar(255) DEFAULT NULL,
  `style` varchar(50) DEFAULT NULL,
  `technique` varchar(50) DEFAULT NULL,
  `mood` varchar(50) DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `views` int DEFAULT '0',
  `likes` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paintings`
--

LOCK TABLES `paintings` WRITE;
/*!40000 ALTER TABLE `paintings` DISABLE KEYS */;
INSERT INTO `paintings` VALUES (3,'Я и мои друзья','Карина',2018,'','/uploads/1776153280054-photo_2026-04-14_10-54-25.jpg','Абстракционизм','Цифровая живопись','Радость',4,'2026-04-14 07:54:40',3,2),(4,'Любимый герой','Карина',2026,'','/uploads/1776153344908-photo_2026-04-14_10-54-29.jpg','Реализм','Карандаш','Вдохновение',4,'2026-04-14 07:55:44',2,1),(5,'Персонажи мультика','Наталья',2000,'','/uploads/1776153587225-photo_2026-04-14_10-54-14.jpg','Реализм','Карандаш','Энергия',5,'2026-04-14 07:59:47',2,1),(6,'Гг','Наталья',2017,'','/uploads/1776153626724-photo_2026-04-14_10-54-04.jpg','Сюрреализм','Карандаш','Спокойствие',5,'2026-04-14 08:00:26',2,1),(7,'Портрет подружки','Ирина',2014,'','/uploads/1776153766820-photo_2026-04-14_10-54-12.jpg','Реализм','Карандаш','Вдохновение',6,'2026-04-14 08:02:46',1,1),(8,'Автопортрет','Ирина',2019,'','/uploads/1776153803788-photo_2026-04-14_10-54-18.jpg','Реализм','Карандаш','Таинственность',6,'2026-04-14 08:03:23',1,1),(9,'Герой мультика','Юлия',2022,'','/uploads/1776153869256-photo_2026-04-14_10-54-21.jpg','Импрессионизм','Акварель','Спокойствие',1,'2026-04-14 08:04:29',1,1),(10,'Лисичка','Юлия',2025,'','/uploads/1776153910865-photo_2026-04-14_10-54-16.jpg','Импрессионизм','Карандаш','Спокойствие',1,'2026-04-14 08:05:10',2,2);
/*!40000 ALTER TABLE `paintings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `bio` text,
  `birth_year` int DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `is_artist` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Юлия','smolskaaula@gmail.com','$2b$10$KfL22rkeruSbCG.Ui.eQheMNgOlx4ZamjqYHcaeMK80D9OP.tiepu','admin','2026-04-09 08:25:58',NULL,NULL,NULL,1),(4,'Карина','oksankauleva@gmail.com','$2b$10$KPPq/jHpWorUipccuKPv7.l2bjvOTPLl5701NVnRIQcvkdE2CaHLe','user','2026-04-14 07:52:29','',2000,'Россия',1),(5,'Наталья','smolskaanatasha388@gmail.com','$2b$10$OU2f.DCKEC12XqDj5tJRsexmkk6F74ZctmEvL8SMT8rgmORPMCL1e','user','2026-04-14 07:57:32','',1975,'Беларусь',1),(6,'Ирина','Orifleam@gmail.com','$2b$10$O925ot474OEZ2uh0ogdJRee0rl8bnymbOhsPCpNlznxI7MG3ib1HS','user','2026-04-14 08:01:46','',2007,'Беларусь',1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-14 20:33:31
