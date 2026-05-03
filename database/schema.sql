-- ============================================================
--  FinVault Banking System — Database Schema
--  Database : cp
--  Engine   : MySQL 8.x  |  Charset: utf8mb4_unicode_ci
--  Generated: 2026-04-23
-- ============================================================

CREATE DATABASE IF NOT EXISTS `cp`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `cp`;

-- ─────────────────────────────────────────────
--  1. BANK BRANCH
-- ─────────────────────────────────────────────
CREATE TABLE `bank_branch` (
  `branch_id` INT          NOT NULL,
  `city`      VARCHAR(50)  NOT NULL,
  `pincode`   VARCHAR(10)  NOT NULL,
  `ifs_code`  VARCHAR(20)  NOT NULL,
  PRIMARY KEY (`branch_id`),
  UNIQUE KEY `ifs_code` (`ifs_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  2. USERS  (authentication)
-- ─────────────────────────────────────────────
CREATE TABLE `users` (
  `user_id`    INT          NOT NULL AUTO_INCREMENT,
  `username`   VARCHAR(100) NOT NULL,
  `password`   VARCHAR(255) NOT NULL,                  -- bcrypt hash
  `role`       ENUM('CUSTOMER','EMPLOYEE','ADMIN') NOT NULL,
  `entity_id`  INT          DEFAULT NULL,              -- cust_id / emp_id
  `is_active`  TINYINT(1)   DEFAULT 1,
  `created_at` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  3. CUSTOMER
-- ─────────────────────────────────────────────
CREATE TABLE `customer` (
  `cust_id`  INT          NOT NULL AUTO_INCREMENT,
  `name`     VARCHAR(100) NOT NULL,
  `gender`   ENUM('Male','Female','Other') NOT NULL,
  `mail_id`  VARCHAR(100) DEFAULT NULL,
  `phone_no` VARCHAR(15)  DEFAULT NULL,
  `pan_no`   VARCHAR(20)  DEFAULT NULL,
  `address`  VARCHAR(200) DEFAULT NULL,
  PRIMARY KEY (`cust_id`),
  UNIQUE KEY `mail_id` (`mail_id`),
  UNIQUE KEY `pan_no`  (`pan_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  4. EMPLOYEE
-- ─────────────────────────────────────────────
CREATE TABLE `employee` (
  `emp_id`      INT          NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100) NOT NULL,
  `gender`      ENUM('Male','Female','Other') NOT NULL,
  `designation` VARCHAR(50)  DEFAULT NULL,
  `salary`      DECIMAL(10,2) DEFAULT NULL,            -- base monthly salary
  `join_date`   DATE          DEFAULT NULL,
  `branch_id`   INT           NOT NULL,
  `is_active`   TINYINT(1)    DEFAULT 1,
  PRIMARY KEY (`emp_id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `bank_branch` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  5. ACCOUNT
-- ─────────────────────────────────────────────
CREATE TABLE `account` (
  `acc_num`   INT          NOT NULL AUTO_INCREMENT,
  `branch_id` INT          NOT NULL,
  `balance`   DECIMAL(12,2) DEFAULT 0.00,
  `acc_type`  ENUM('savings','current') NOT NULL DEFAULT 'savings',
  `open_date` DATE          DEFAULT NULL,
  `status`    ENUM('active','inactive','closed','frozen') DEFAULT 'active',
  `atm_pin`   VARCHAR(4)    DEFAULT '1234',
  `vpa`       VARCHAR(100)  DEFAULT NULL,              -- UPI Virtual Payment Address
  PRIMARY KEY (`acc_num`),
  UNIQUE KEY `vpa` (`vpa`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `account_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `bank_branch` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  6. ACCOUNT ↔ CUSTOMER  (many-to-many)
-- ─────────────────────────────────────────────
CREATE TABLE `account_customer` (
  `acc_num`        INT         NOT NULL,
  `cust_id`        INT         NOT NULL,
  `ownership_type` VARCHAR(20) DEFAULT 'primary',
  PRIMARY KEY (`acc_num`, `cust_id`),
  KEY `cust_id` (`cust_id`),
  CONSTRAINT `account_customer_ibfk_1` FOREIGN KEY (`acc_num`)  REFERENCES `account`  (`acc_num`),
  CONSTRAINT `account_customer_ibfk_2` FOREIGN KEY (`cust_id`)  REFERENCES `customer` (`cust_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  7. SAVINGS ACCOUNT  (extends account)
-- ─────────────────────────────────────────────
CREATE TABLE `saving_acc` (
  `acc_num`       INT           NOT NULL,
  `interest_rate` DECIMAL(5,2)  DEFAULT 3.50,
  `min_balance`   DECIMAL(10,2) DEFAULT 1000.00,
  `daily_limit`   DECIMAL(10,2) DEFAULT 50000.00,
  `nominee`       VARCHAR(100)  DEFAULT NULL,
  PRIMARY KEY (`acc_num`),
  CONSTRAINT `saving_acc_ibfk_1` FOREIGN KEY (`acc_num`) REFERENCES `account` (`acc_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  8. CURRENT ACCOUNT  (extends account)
-- ─────────────────────────────────────────────
CREATE TABLE `current_acc` (
  `acc_num`         INT           NOT NULL,
  `overdraft_limit` DECIMAL(10,2) DEFAULT 0.00,
  `business_refno`  VARCHAR(50)   DEFAULT NULL,
  `month_t_quota`   INT           DEFAULT 100,
  `transf_fee_rate` DECIMAL(5,2)  DEFAULT 0.50,
  PRIMARY KEY (`acc_num`),
  CONSTRAINT `current_acc_ibfk_1` FOREIGN KEY (`acc_num`) REFERENCES `account` (`acc_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  9. EMPLOYEE ↔ CUSTOMER MAP
-- ─────────────────────────────────────────────
CREATE TABLE `emp_customer_map` (
  `emp_id`  INT NOT NULL,
  `cust_id` INT NOT NULL,
  PRIMARY KEY (`emp_id`, `cust_id`),
  KEY `cust_id` (`cust_id`),
  CONSTRAINT `emp_customer_map_ibfk_1` FOREIGN KEY (`emp_id`)  REFERENCES `employee` (`emp_id`),
  CONSTRAINT `emp_customer_map_ibfk_2` FOREIGN KEY (`cust_id`) REFERENCES `customer` (`cust_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  10. TRANSACTION
-- ─────────────────────────────────────────────
CREATE TABLE `transaction_tbl` (
  `id`          INT            NOT NULL AUTO_INCREMENT,
  `acc_num`     INT            NOT NULL,
  `cust_id`     INT            DEFAULT NULL,
  `amount`      DECIMAL(12,2)  NOT NULL,
  `status`      ENUM('pending','success','failed','reversed') NOT NULL DEFAULT 'pending',
  `timestamp`   DATETIME       DEFAULT CURRENT_TIMESTAMP,
  `type`        ENUM('card','atm','upi','deposit','withdrawal') NOT NULL,
  `flagged`     TINYINT(1)     DEFAULT 0,
  `flag_reason` VARCHAR(200)   DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `acc_num` (`acc_num`),
  KEY `cust_id` (`cust_id`),
  CONSTRAINT `transaction_tbl_ibfk_1` FOREIGN KEY (`acc_num`)  REFERENCES `account`  (`acc_num`),
  CONSTRAINT `transaction_tbl_ibfk_2` FOREIGN KEY (`cust_id`)  REFERENCES `customer` (`cust_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  11. UPI TRANSFER  (extends transaction)
-- ─────────────────────────────────────────────
CREATE TABLE `upi_transfer` (
  `trans_id`  INT         NOT NULL,
  `mobile_id` VARCHAR(20) DEFAULT NULL,
  `vpa`       VARCHAR(50) DEFAULT NULL,
  `ref_no`    VARCHAR(50) DEFAULT NULL,
  PRIMARY KEY (`trans_id`),
  CONSTRAINT `upi_transfer_ibfk_1` FOREIGN KEY (`trans_id`) REFERENCES `transaction_tbl` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  12. ATM TRANSFER  (extends transaction)
-- ─────────────────────────────────────────────
CREATE TABLE `atm_transfer` (
  `trans_id` INT         NOT NULL,
  `atm_id`   VARCHAR(50) DEFAULT NULL,
  `card_no`  VARCHAR(4)  DEFAULT NULL,
  PRIMARY KEY (`trans_id`),
  CONSTRAINT `atm_transfer_ibfk_1` FOREIGN KEY (`trans_id`) REFERENCES `transaction_tbl` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  13. CARD / POS TRANSFER  (extends transaction)
-- ─────────────────────────────────────────────
CREATE TABLE `card_transfer` (
  `trans_id`  INT         NOT NULL,
  `pos_id`    VARCHAR(50) DEFAULT NULL,
  `merch_id`  VARCHAR(50) DEFAULT NULL,
  `card_last4` VARCHAR(4) DEFAULT NULL,
  PRIMARY KEY (`trans_id`),
  CONSTRAINT `card_transfer_ibfk_1` FOREIGN KEY (`trans_id`) REFERENCES `transaction_tbl` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  14. ATTENDANCE
-- ─────────────────────────────────────────────
CREATE TABLE `attendance` (
  `attendance_id` INT  NOT NULL AUTO_INCREMENT,
  `emp_id`        INT  NOT NULL,
  `date`          DATE NOT NULL,
  `status`        ENUM('present','absent','half_day','leave','holiday') NOT NULL,
  PRIMARY KEY (`attendance_id`),
  UNIQUE KEY `uq_attendance` (`emp_id`, `date`),            -- one record per employee per day
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  15. PAYROLL
-- ─────────────────────────────────────────────
CREATE TABLE `payroll` (
  `payroll_id` INT           NOT NULL AUTO_INCREMENT,
  `emp_id`     INT           NOT NULL,
  `month`      INT           NOT NULL,           -- 1–12
  `year`       INT           NOT NULL,
  `net_salary` DECIMAL(10,2) NOT NULL,           -- computed from attendance
  `paid_on`    DATE          DEFAULT NULL,
  PRIMARY KEY (`payroll_id`),
  UNIQUE KEY `uq_payroll` (`emp_id`, `month`, `year`),      -- one payroll per employee per month
  CONSTRAINT `payroll_ibfk_1` FOREIGN KEY (`emp_id`) REFERENCES `employee` (`emp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
--  16. AUDIT LOG
-- ─────────────────────────────────────────────
CREATE TABLE `audit_log` (
  `audit_id`  INT          NOT NULL AUTO_INCREMENT,
  `user_id`   INT          DEFAULT NULL,
  `username`  VARCHAR(100) DEFAULT NULL,
  `action`    VARCHAR(100) NOT NULL,
  `detail`    TEXT         DEFAULT NULL,
  `ip_addr`   VARCHAR(50)  DEFAULT NULL,
  `timestamp` DATETIME     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`audit_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
--  ENTITY RELATIONSHIP SUMMARY
-- ============================================================
--
--  bank_branch ──< employee ──< attendance
--                           ──< payroll
--                           ──< emp_customer_map >── customer
--
--  bank_branch ──< account ──< account_customer >── customer
--                          ──< transaction_tbl ──< upi_transfer
--                                              ──< atm_transfer
--                                              ──< card_transfer
--
--  users { role: ADMIN | EMPLOYEE | CUSTOMER }
--    └─ entity_id → employee.emp_id  (EMPLOYEE)
--    └─ entity_id → customer.cust_id (CUSTOMER)
--
-- ============================================================
