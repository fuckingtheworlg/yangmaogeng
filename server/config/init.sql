CREATE DATABASE IF NOT EXISTS yaomaogeng DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE yaomaogeng;

CREATE TABLE IF NOT EXISTS admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(200) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ships (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ship_no VARCHAR(50) NOT NULL,
  total_length DECIMAL(10,2) DEFAULT 0,
  width DECIMAL(10,2) DEFAULT 0,
  depth DECIMAL(10,2) DEFAULT 0,
  ship_type VARCHAR(50) DEFAULT '',
  ship_condition VARCHAR(50) DEFAULT '',
  deadweight INT DEFAULT 0,
  gross_tonnage INT DEFAULT 0,
  build_date VARCHAR(20) DEFAULT '',
  build_province VARCHAR(50) DEFAULT '',
  port_registry VARCHAR(50) DEFAULT '',
  engine_brand VARCHAR(50) DEFAULT '',
  engine_power INT DEFAULT 0,
  engine_count INT DEFAULT 1,
  water_type VARCHAR(20) DEFAULT '内河',
  price DECIMAL(10,2) DEFAULT 0,
  images TEXT,
  certificates TEXT,
  contact_name VARCHAR(50) DEFAULT '',
  contact_phone VARCHAR(20) DEFAULT '',
  description TEXT,
  status TINYINT DEFAULT 1 COMMENT '0下架 1在售 2已售',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(100) UNIQUE,
  nickname VARCHAR(100) DEFAULT '',
  avatar VARCHAR(500) DEFAULT '',
  phone VARCHAR(20) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  ship_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_ship (user_id, ship_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS commissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  type ENUM('sell','buy') NOT NULL,
  contact_name VARCHAR(50) DEFAULT '',
  gender VARCHAR(10) DEFAULT '先生',
  phone VARCHAR(20) DEFAULT '',
  total_length DECIMAL(10,2) DEFAULT 0,
  width DECIMAL(10,2) DEFAULT 0,
  depth DECIMAL(10,2) DEFAULT 0,
  deadweight INT DEFAULT 0,
  gross_tonnage INT DEFAULT 0,
  build_date VARCHAR(20) DEFAULT '',
  build_province VARCHAR(50) DEFAULT '',
  water_type VARCHAR(20) DEFAULT '',
  ship_type VARCHAR(50) DEFAULT '',
  engine_brand VARCHAR(50) DEFAULT '',
  engine_power INT DEFAULT 0,
  engine_count INT DEFAULT 1,
  year_start VARCHAR(10) DEFAULT '',
  year_end VARCHAR(10) DEFAULT '',
  budget DECIMAL(10,2) DEFAULT NULL,
  ship_images TEXT,
  cert_images TEXT,
  remark TEXT,
  status TINYINT DEFAULT 0 COMMENT '0待处理 1已处理 2已关闭',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ship_id INT,
  commission_id INT,
  price DECIMAL(10,2) DEFAULT 0,
  buyer_name VARCHAR(50) DEFAULT '',
  buyer_phone VARCHAR(20) DEFAULT '',
  seller_name VARCHAR(50) DEFAULT '',
  seller_phone VARCHAR(20) DEFAULT '',
  remark TEXT,
  deal_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ship_id) REFERENCES ships(id) ON DELETE SET NULL,
  FOREIGN KEY (commission_id) REFERENCES commissions(id) ON DELETE SET NULL
);

-- 插入默认管理员 (密码: admin123)
INSERT IGNORE INTO admins (username, password) VALUES ('admin', '$2b$10$QNFTqxYwi.rfaruzWClv6emNlJr1WlzG.lZaI4wweKO1GvoaweahW');
