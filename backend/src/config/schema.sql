-- ════════════════════════════════════════════════════════════
-- पूजारी डेटाबेस स्कीमा (Pojjari Database Schema)
-- Charset: utf8mb4 (Marathi Unicode Support)
-- ════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS pojjari_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pojjari_db;

-- ─────────────────────────────────────────────────────────────
-- TABLE 1: USERS (वापरकर्ते)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  name         VARCHAR(100) NOT NULL,
  phone        VARCHAR(15) UNIQUE NOT NULL,
  email        VARCHAR(100) UNIQUE,
  password     VARCHAR(255),
  role         ENUM('user','pujari','admin') DEFAULT 'user',
  otp_code     VARCHAR(6),
  otp_expiry   DATETIME,
  is_verified  BOOLEAN DEFAULT FALSE,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- TABLE 2: PUJARI PROFILES (पुजारी प्रोफाईल)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pujari_profiles (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  user_id           INT NOT NULL UNIQUE,
  full_name         VARCHAR(100) NOT NULL,
  experience_yrs    INT DEFAULT 0,
  city              VARCHAR(100),
  district          VARCHAR(100),
  state             VARCHAR(100) DEFAULT 'महाराष्ट्र',
  address           TEXT,
  languages         JSON,           -- ["मराठी","हिंदी","संस्कृत"]
  photo_url         VARCHAR(500),
  certificate_url   VARCHAR(500),
  bio               TEXT,
  status            ENUM('pending','approved','rejected') DEFAULT 'pending',
  rejection_reason  TEXT,
  avg_rating        DECIMAL(3,2) DEFAULT 0.00,
  total_reviews     INT DEFAULT 0,
  total_bookings    INT DEFAULT 0,
  is_available      BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- TABLE 3: POOJA CATEGORIES (पूजा श्रेणी)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pooja_categories (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  name_mr      VARCHAR(100) NOT NULL,
  name_en      VARCHAR(100),
  slug         VARCHAR(100) UNIQUE NOT NULL,
  icon_url     VARCHAR(500),
  description  TEXT,
  sort_order   INT DEFAULT 0,
  is_active    BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- TABLE 4: POOJAS / VIDHI (पूजा / विधी)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS poojas (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  category_id   INT NOT NULL,
  name_mr       VARCHAR(200) NOT NULL,
  name_en       VARCHAR(200),
  slug          VARCHAR(200) UNIQUE NOT NULL,
  description   TEXT,
  short_desc    VARCHAR(500),
  price         DECIMAL(10,2) NOT NULL,
  duration_hrs  DECIMAL(4,2) DEFAULT 2.00,
  image_url     VARCHAR(500),
  steps         JSON,               -- ["चरण १: ...", "चरण २: ..."]
  is_active     BOOLEAN DEFAULT TRUE,
  is_featured   BOOLEAN DEFAULT FALSE,
  views         INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES pooja_categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- TABLE 5: SAMAGRI ITEMS (सामग्री)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS samagri_items (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  pooja_id   INT NOT NULL,
  name_mr    VARCHAR(200) NOT NULL,
  name_en    VARCHAR(200),
  quantity   VARCHAR(100),
  unit       VARCHAR(50),
  note       VARCHAR(255),
  sort_order INT DEFAULT 0,
  FOREIGN KEY (pooja_id) REFERENCES poojas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- TABLE 6: PUJARI SPECIALIZATIONS (पुजारी विशेषज्ञता)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pujari_specializations (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  pujari_id   INT NOT NULL,
  category_id INT NOT NULL,
  UNIQUE KEY unique_spec (pujari_id, category_id),
  FOREIGN KEY (pujari_id)   REFERENCES pujari_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES pooja_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- TABLE 7: BOOKINGS (बुकिंग)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  booking_code     VARCHAR(20) UNIQUE NOT NULL,
  user_id          INT NOT NULL,
  pooja_id         INT NOT NULL,
  pujari_id        INT,
  booking_date     DATE NOT NULL,
  booking_time     TIME NOT NULL,
  address          TEXT NOT NULL,
  city             VARCHAR(100),
  district         VARCHAR(100),
  special_notes    TEXT,
  total_amount     DECIMAL(10,2) NOT NULL,
  platform_fee     DECIMAL(10,2) DEFAULT 0.00,
  pujari_amount    DECIMAL(10,2) DEFAULT 0.00,
  status           ENUM('pending','confirmed','in_progress','completed','cancelled') DEFAULT 'pending',
  payment_status   ENUM('unpaid','paid','refunded') DEFAULT 'unpaid',
  payment_id       VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  cancelled_by     ENUM('user','pujari','admin'),
  cancel_reason    TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)   REFERENCES users(id),
  FOREIGN KEY (pooja_id)  REFERENCES poojas(id),
  FOREIGN KEY (pujari_id) REFERENCES pujari_profiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- TABLE 8: REVIEWS (रेटिंग व अभिप्राय)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  booking_id  INT NOT NULL UNIQUE,
  user_id     INT NOT NULL,
  pujari_id   INT NOT NULL,
  pooja_id    INT NOT NULL,
  rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (user_id)    REFERENCES users(id),
  FOREIGN KEY (pujari_id)  REFERENCES pujari_profiles(id),
  FOREIGN KEY (pooja_id)   REFERENCES poojas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────
-- TABLE 9: PUJARI AVAILABILITY (उपलब्धता)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pujari_availability (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  pujari_id    INT NOT NULL,
  avail_date   DATE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  UNIQUE KEY unique_avail (pujari_id, avail_date),
  FOREIGN KEY (pujari_id) REFERENCES pujari_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
-- TABLE 10: CONTACT INQUIRIES (संपर्क चौकशी)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(100),
  phone      VARCHAR(15),
  subject    VARCHAR(200),
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════
-- SEED DATA
-- ════════════════════════════════════════════════════════════

-- Admin User
INSERT IGNORE INTO users (name, phone, email, password, role, is_verified) VALUES
('प्रशासक', '9307720459', 'admin@pojjari.com',
 '$2a$10$xyzHashedPasswordHere', 'admin', TRUE);

-- Categories
INSERT IGNORE INTO pooja_categories (name_mr, name_en, slug, sort_order) VALUES
('गृह पूजा',          'Gruh Pooja',            'gruh-pooja',      1),
('हवन / जाप',         'Havan / Jaap',           'havan-jaap',      2),
('कथा / नित्य पूजा',  'Katha / Nitya Pooja',    'katha-nitya',     3),
('पित्रुश्राद्ध',     'Pitrupaksha / Shraddha', 'pitru-shraddha',  4),
('उत्सव पूजा',        'Utsav Pooja',            'utsav-pooja',     5),
('वास्तू पूजा',       'Vastu Pooja',            'vastu-pooja',     6),
('आध्यात्मिक सेवा',   'Spiritual Services',     'adhyatmik-seva',  7),
('लग्न हॉल बुकिंग',  'Marriage Hall Booking',  'lagn-hall',       8);

-- Poojas — Gruh Pooja (cat id=1)
INSERT IGNORE INTO poojas (category_id, name_mr, name_en, slug, short_desc, price, duration_hrs, image_url, is_featured) VALUES
(1, 'सत्यनारायण पूजा',    'Satyanarayan Pooja',   'satyanarayan-pooja',   'घरामध्ये सुख-समृद्धी आणि ईश्वरी आशीर्वादासाठी केली जाणारी पूजा.',          3963.00, 3.0, '/uploads/poojas/satyanarayan-pooja.png',  TRUE),
(1, 'बाळ शॉवर पूजा',      'Baby Shower Pooja',    'baby-shower-pooja',    'नवजात बाळाच्या स्वागतासाठी आणि आईच्या सुरक्षिततेसाठी केली जाणारी पूजा.',    3858.00, 2.0, NULL, FALSE),
(1, 'वाढदिवस पूजा',       'Birthday Pooja',       'birthday-pooja',       'वाढदिवसाच्या शुभ प्रसंगी ईश्वराचे आभार मानण्यासाठी केली जाणारी पूजा.',       2974.00, 1.5, NULL, FALSE),
(1, 'साखरपुडा पूजा',      'Engagement Pooja',     'engagement-pooja',     'साखरपुड्याच्या शुभ मुहूर्तावर लग्नाच्या सुरुवातीसाठी केली जाणारी पूजा.',    3964.00, 2.0, '/uploads/poojas/engagement-pooja.png', FALSE),
(1, 'मुंज / उपनयन संस्कार','Munj Upanayan',       'munj-upanayan',        'मुलाच्या जीवनातील महत्त्वाचा संस्कार — ब्रह्मचर्य आश्रम सुरू करण्याचा विधी.',6228.00, 4.0, NULL, TRUE);

-- Poojas — Havan/Jaap (cat id=2)
INSERT IGNORE INTO poojas (category_id, name_mr, name_en, slug, short_desc, price, duration_hrs, image_url, is_featured) VALUES
(2, 'महा मृत्युंजय जाप',       'Maha Mrityunjay Jap',    'maha-mrityunjay-jap',    'मृत्युंजय देवाला प्रसन्न करण्यासाठी व दीर्घायुष्यासाठी केला जाणारा जाप.',    5097.00, 3.0, NULL, TRUE),
(2, 'नवग्रह शांती हवन',        'Navgraha Shanti Havan',  'navgraha-shanti-havan',  'नऊ ग्रहांच्या दोषांपासून मुक्तीसाठी केला जाणारा हवन.',                          5098.00, 4.0, '/uploads/poojas/navgraha-shanti-havan.png', FALSE),
(2, 'धन्वंतरी हवन',            'Dhanvantari Havan',      'dhanvantari-havan',      'आरोग्य आणि दीर्घायुष्यासाठी आयुर्वेदाचे देव धन्वंतरी यांना अर्पण.',           5524.00, 3.0, NULL, FALSE),
(2, 'लक्ष्मी कुबेर हवन',       'Lakshmi Kuber Havan',    'lakshmi-kuber-havan',    'धन-संपत्ती आणि व्यापारवृद्धीसाठी लक्ष्मी-कुबेर यांची विशेष पूजा.',             5524.00, 4.0, NULL, TRUE),
(2, 'सरस्वती हवन',             'Saraswati Havan',        'saraswati-havan',        'विद्या, बुद्धी आणि कलेसाठी देवी सरस्वतीची विशेष पूजा.',                         4531.00, 3.0, NULL, FALSE),
(2, 'गणपती अथर्वशीर्ष हवन',   'Ganpati Atharvashirsha', 'ganpati-atharvashirsha', 'गणेशाला प्रसन्न करण्यासाठी अथर्वशीर्ष पाठासह हवन.',                             4531.00, 3.0, NULL, FALSE),
(2, 'नवचंडी याग',              'Navchandi Yag',          'navchandi-yag',          'देवी चंडीला समर्पित नऊ दिवसांचा विशेष याग.',                                     12441.00, 9.0, NULL, FALSE),
(2, 'दत्त याग',                'Datta Yag',              'datta-yag',              'श्री दत्तात्रेयांची कृपा मिळवण्यासाठी केला जाणारा विशेष याग.',                   10195.00, 6.0, '/uploads/poojas/datta-yag.png', FALSE);

-- Poojas — Katha/Nitya (cat id=3)
INSERT IGNORE INTO poojas (category_id, name_mr, name_en, slug, short_desc, price, duration_hrs, image_url) VALUES
(3, 'रुद्राभिषेक',         'Rudra Abhishek',       'rudra-abhishek',       'भगवान शंकराला जल, दूध, मध, दही अर्पण करून केलेला अभिषेक.',         3540.00, 2.0, '/uploads/poojas/rudra-abhishek.png'),
(3, 'मंगळागौरी पूजा',     'Mangala Gauri Pooja',  'mangalagauri-pooja',   'नवविवाहित स्त्रियांसाठी सौभाग्य आणि पतीच्या दीर्घायुष्यासाठी.',   2973.00, 2.5, NULL),
(3, 'सोमवार पूजा',        'Somvar Pooja',         'somvar-pooja',         'श्रावण मासातील सोमवारी महादेवाची विशेष पूजा.',                      2974.00, 1.5, NULL),
(3, 'सुंदरकांड पाठ',      'Sundarkand Path',      'sundarkand-path',      'हनुमानजींचे स्तोत्र — संकट निवारणासाठी अत्यंत प्रभावी पाठ.',       4862.00, 3.0, NULL);

-- Poojas — Pitru Shraddha (cat id=4) — INCLUDING NEW ADDITIONS
INSERT IGNORE INTO poojas (category_id, name_mr, name_en, slug, short_desc, price, duration_hrs, image_url, is_featured) VALUES
(4, 'दशक्रिया विधी',       'Dashkriya Vidhi',      'dashkriya-vidhi',      'मृत्यूनंतर दहाव्या दिवशी पिंडदान, तर्पण आणि दशगात्र विधान.',       4500.00, 3.0, '/uploads/poojas/dashkriya-vidhi.png', TRUE),
(4, 'बारावे विधी',         'Barave Vidhi',         'barave-vidhi',         'मृत्यूनंतर बाराव्या दिवशी सपिंडीकरण व कुटुंब शुद्धीकरण.',          3800.00, 2.5, '/uploads/poojas/barave-vidhi.png', FALSE),
(4, 'तेरावे विधी',         'Terave Vidhi',         'terave-vidhi',         'तेराव्या दिवशी श्राद्ध पंगत आणि शोककाळ समाप्ती विधी.',             4200.00, 4.0, NULL, FALSE),
(4, 'वार्षिक श्राद्ध विधी','Varshik Shraddha',    'varshik-shraddha',     'पितरांच्या वर्षश्राद्धाचा विधी — आत्म्याच्या सद्गतीसाठी.',        4862.00, 3.0, '/uploads/poojas/varshik-shraddha.png', FALSE),
(4, 'भरणी श्राद्ध',        'Bharani Shraddha',     'bharani-shraddha',     'भरणी नक्षत्रावर केला जाणारा विशेष श्राद्ध.',                       4861.00, 3.0, NULL, FALSE),
(4, 'त्रिपिंडी श्राद्ध',   'Tripindi Shraddha',    'tripindi-shraddha',    'तीन पिंडांचे दान करून पितरांना सद्गती देणारा विधी.',                7080.00, 4.0, NULL, FALSE);

-- Poojas — Utsav Pooja (cat id=5)
INSERT IGNORE INTO poojas (category_id, name_mr, name_en, slug, short_desc, price, duration_hrs, image_url, is_featured) VALUES
(5, 'गणपती स्थापना',       'Ganpati Sthapna',        'ganpati-sthapna',        'गणेशोत्सवाच्या पहिल्या दिवशी गणपतीच्या मूर्तीची स्थापना.',     5098.00, 2.0, '/uploads/poojas/ganpati-sthapna.png', TRUE),
(5, 'गणपती विसर्जन पूजा', 'Ganpati Visarjan Pooja', 'ganpati-visarjan',       'अनंत चतुर्दशीला गणपतीच्या विसर्जनापूर्वीची विशेष पूजा.',       4862.00, 2.0, NULL, FALSE),
(5, 'लक्ष्मी पूजन (दिवाळी)','Lakshmi Poojan',       'lakshmi-poojan-diwali',  'दिवाळीच्या लक्ष्मीपूजनाच्या रात्री धन-संपत्तीसाठी पूजा.',      3682.00, 2.0, '/uploads/poojas/lakshmi-poojan-diwali.png', TRUE),
(5, 'कृष्ण जन्माष्टमी',   'Krishna Janmashtami',    'krishna-janmashtami',    'कृष्णाच्या जन्माचा उत्सव — मध्यरात्री विशेष पूजा.',             3682.00, 2.0, NULL, FALSE),
(5, 'नवरात्री घटस्थापना', 'Navratri Ghatasthapana', 'navratri-ghatasthapana', 'नवरात्रीच्या पहिल्या दिवशी देवीची घटस्थापना.',                  4862.00, 2.5, NULL, FALSE),
(5, 'होळी पूजन',           'Holi Poojan',            'holi-poojan',            'होळी दहनापूर्वी शुभ मुहूर्तावर होळीची पूजा.',                   2974.00, 1.0, NULL, FALSE),
(5, 'तुळशी विवाह',         'Tulsi Vivah',            'tulsi-vivah',            'कार्तिक शुद्ध एकादशीला तुळशी विवाहाचा शुभ विधी.',              4862.00, 2.0, NULL, FALSE);

-- Poojas — Vastu Pooja (cat id=6)
INSERT IGNORE INTO poojas (category_id, name_mr, name_en, slug, short_desc, price, duration_hrs, image_url, is_featured) VALUES
(6, 'गृहप्रवेश व गृहशांती',   'Gruhpravesh',            'gruhpravesh-gruhshanti', 'नवीन घरात प्रवेश करताना केली जाणारी शुभ पूजा.',               6372.00, 4.0, '/uploads/poojas/gruhpravesh-gruhshanti.png', TRUE),
(6, 'भूमिपूजन',               'Bhoomi Pujan',           'bhoomi-pujan',           'नवीन बांधकाम सुरू करण्यापूर्वी जमिनीची पूजा.',               5098.00, 2.0, '/uploads/poojas/bhoomi-pujan.png', FALSE),
(6, 'कार्यालय शुभारंभ पूजा',  'Office Opening Pooja',   'office-shubharambh',     'नवीन व्यवसाय किंवा कार्यालय सुरू करण्यासाठी पूजा.',         6372.00, 2.5, NULL, FALSE),
(6, 'वास्तूशांती व उदक शुद्धी','Vastu Shanti',          'vastu-shanti-udak',      'घरातील वास्तूदोष निवारण आणि संपूर्ण शुद्धीकरण.',            18499.00, 5.0, '/uploads/poojas/vastu-shanti-udak.png', FALSE);

-- Poojas — Gruh Pooja additional (लग्न विधी — cat id=1)
INSERT IGNORE INTO poojas (category_id, name_mr, name_en, slug, short_desc, price, duration_hrs, image_url, is_featured) VALUES
(1, 'लग्न विधी',  'Lagn Vidhi',  'lagn-vidhi',  'पारंपरिक हिंदू पद्धतीने विवाह संस्कार संपन्न करण्याचा शुभ विधी.',  8500.00, 5.0, '/uploads/poojas/lagn-vidhi.png', TRUE);

-- Poojas — Havan/Jaap additional (नक्षत्र जनन शांती — cat id=2)
INSERT IGNORE INTO poojas (category_id, name_mr, name_en, slug, short_desc, price, duration_hrs, image_url, is_featured) VALUES
(2, 'नक्षत्र जनन शांती', 'Nakshatra Janan Shanti', 'nakshatra-janan-shanti', 'जन्म नक्षत्राच्या दोषांपासून मुक्तीसाठी आणि बाळाच्या सुरक्षिततेसाठी केला जाणारा विधी.', 4800.00, 3.0, '/uploads/poojas/nakshatra-janan-shanti.png', FALSE);

-- Samagri — Dashkriya Vidhi
INSERT IGNORE INTO samagri_items (pooja_id, name_mr, name_en, quantity, sort_order) VALUES
((SELECT id FROM poojas WHERE slug='dashkriya-vidhi'), 'काळे तीळ', 'Black Sesame', '५०० ग्रॅम', 1),
((SELECT id FROM poojas WHERE slug='dashkriya-vidhi'), 'कुशा गवत', 'Kusha Grass', '१ जुडी', 2),
((SELECT id FROM poojas WHERE slug='dashkriya-vidhi'), 'गंगाजल', 'Gangajal', '१ बाटली', 3),
((SELECT id FROM poojas WHERE slug='dashkriya-vidhi'), 'जव (सातू)', 'Barley', '२५० ग्रॅम', 4),
((SELECT id FROM poojas WHERE slug='dashkriya-vidhi'), 'मध', 'Honey', '१०० मिली', 5),
((SELECT id FROM poojas WHERE slug='dashkriya-vidhi'), 'पंचामृत साहित्य', 'Panchamrit', '१ संच', 6),
((SELECT id FROM poojas WHERE slug='dashkriya-vidhi'), 'पांढरी फुले', 'White Flowers', '२ हार', 7),
((SELECT id FROM poojas WHERE slug='dashkriya-vidhi'), 'धूप-उदबत्ती', 'Incense', '१ पॅकेट', 8),
((SELECT id FROM poojas WHERE slug='dashkriya-vidhi'), 'दीप (तेल/तूप)', 'Lamp', '१ दीप', 9),
((SELECT id FROM poojas WHERE slug='dashkriya-vidhi'), 'दक्षिणा (ब्राह्मणासाठी)', 'Dakshina', 'यथाशक्ती', 10);

-- Samagri — Satyanarayan Pooja
INSERT IGNORE INTO samagri_items (pooja_id, name_mr, name_en, quantity, sort_order) VALUES
((SELECT id FROM poojas WHERE slug='satyanarayan-pooja'), 'रवा (सुजी)', 'Semolina', '५०० ग्रॅम', 1),
((SELECT id FROM poojas WHERE slug='satyanarayan-pooja'), 'साखर', 'Sugar', '२५० ग्रॅम', 2),
((SELECT id FROM poojas WHERE slug='satyanarayan-pooja'), 'केळी', 'Banana', '५ नग', 3),
((SELECT id FROM poojas WHERE slug='satyanarayan-pooja'), 'पंचामृत', 'Panchamrit', '१ संच', 4),
((SELECT id FROM poojas WHERE slug='satyanarayan-pooja'), 'तुळशीपत्र', 'Tulsi Leaves', '१ मूठ', 5),
((SELECT id FROM poojas WHERE slug='satyanarayan-pooja'), 'फुलांचा हार', 'Flower Garland', '२ हार', 6),
((SELECT id FROM poojas WHERE slug='satyanarayan-pooja'), 'तूप', 'Ghee', '१०० ग्रॅम', 7),
((SELECT id FROM poojas WHERE slug='satyanarayan-pooja'), 'नारळ', 'Coconut', '२ नग', 8);

-- Steps for Dashkriya Vidhi
UPDATE poojas SET
  steps = JSON_ARRAY(
    'स्नान व शुद्धीकरण — पुजारी आणि कुटुंबाने स्नान करावे.',
    'गणेश पूजन — सर्व कार्यारंभी गणेशाची पूजा.',
    'पिंडदान — दहा पिंड तयार करून पितरांना अर्पण.',
    'तर्पण विधी — गंगाजल आणि तीळ यांनी पितरांना तर्पण.',
    'दशगात्र विधान — प्रत्येक दिवसाचे गात्र विधान.',
    'ब्राह्मण भोजन — पुजाऱ्याला जेवण व दक्षिणा देणे.',
    'क्षमायाचना — पितरांकडे क्षमा मागणे.'
  ),
  description = 'मृत्यूनंतर दहाव्या दिवशी केला जाणारा हा महत्त्वपूर्ण संस्कार आहे. या विधीत पिंडदान, तर्पण आणि दशगात्र विधान केले जाते. हा विधी आत्म्याला सद्गती मिळवण्यासाठी अत्यंत आवश्यक मानला जातो. योग्य पुजाऱ्याच्या मार्गदर्शनाखाली हा विधी करणे आवश्यक आहे.'
WHERE slug = 'dashkriya-vidhi';

UPDATE poojas SET
  steps = JSON_ARRAY(
    'स्नान व शुचिर्भूत होणे.',
    'सपिंडीकरण विधी — चार पिंडांचे विलीनीकरण.',
    'पितृ तर्पण — पाण्याने पितरांना तर्पण.',
    'वस्त्र व अन्नदान — ब्राह्मणाला दान.',
    'ब्राह्मण पूजन व सन्मान.',
    'कुटुंब शुद्धी आचमन — सर्व कुटुंबाची शुद्धी.'
  ),
  description = 'मृत्यूनंतर बाराव्या दिवशी केला जाणारा हा विधी शोक निवारण व आत्म्याच्या शांतीसाठी महत्त्वाचा आहे. यामध्ये सपिंडीकरण, दान आणि कुटुंबाचे शुद्धीकरण केले जाते.'
WHERE slug = 'barave-vidhi';

UPDATE poojas SET
  steps = JSON_ARRAY(
    'सकाळी तर्पण व पिंडदान.',
    'पितरांना नैवेद्य अर्पण.',
    'सामुहिक श्राद्ध भोजन — नातेवाईकांना आमंत्रण.',
    'ब्राह्मण सन्मान व दक्षिणा.',
    'गरिबांना अन्नदान.',
    'शोककाळ समाप्ती — मंगलाचरण व आरती.'
  ),
  description = 'तेराव्या दिवशी केला जाणारा हा अंतिम उत्तरकार्य विधी आहे. यामध्ये श्राद्ध, पंगत आणि नातेवाईकांना जेवण घालून शोककाळाची समाप्ती केली जाते. हा विधी पितरांच्या आत्म्याला अंतिम सद्गती देतो.'
WHERE slug = 'terave-vidhi';
