USE steam_store;
SET NAMES utf8mb4;

-- Replace only the repository's known sample catalog and its dependent records.
START TRANSACTION;

CREATE TEMPORARY TABLE _sample_game_ids (GameID CHAR(36) PRIMARY KEY);
INSERT IGNORE INTO _sample_game_ids (GameID)
SELECT GameID
FROM GAME
WHERE GameID IN (
  'G001', 'G002', 'G003', 'G004', 'G005', 'G006', 'G007', 'G008',
  'G009', 'G010', 'G011', 'G012', 'G013', 'G014', 'G015', 'G016',
  'G017', 'G018', 'G019', 'G020', 'G021', 'G022', 'G023',
  'bac4ae9f-ff75-4686-9ba9-adcdf3df5e43',
  '87921b9e-4614-4237-aefa-53fe2fe5e559',
  '35447c3c-fe6e-4120-8cb7-10ca5efc1abb'
)
OR Title IN (
  'Xếp Gạch Tetris', 'Rắn Săn Mồi Cổ Điển', 'Sudoku Trí Tuệ',
  'Dò Mìn Cổ Điển'
);

CREATE TEMPORARY TABLE _sample_order_ids (OrderID CHAR(36) PRIMARY KEY);
INSERT IGNORE INTO _sample_order_ids (OrderID)
SELECT DISTINCT OrderID FROM ORDERITEM
WHERE GameID IN (SELECT GameID FROM _sample_game_ids);

-- Restore wallet balances for removed sample purchases/refunds before deleting their ledger rows.
UPDATE WALLET AS wallet
JOIN (
  SELECT transactionRow.WalletID,
         SUM(CASE transactionRow.Type
           WHEN 'Purchase' THEN transactionRow.Amount
           WHEN 'Refund' THEN -transactionRow.Amount
           ELSE 0
         END) AS BalanceAdjustment
  FROM `TRANSACTION` AS transactionRow
  WHERE transactionRow.OrderID IN (SELECT OrderID FROM _sample_order_ids)
    AND transactionRow.Status = 'Success'
    AND transactionRow.Type IN ('Purchase', 'Refund')
  GROUP BY transactionRow.WalletID
) AS sampleLedger ON sampleLedger.WalletID = wallet.WalletID
SET wallet.Balance = wallet.Balance + sampleLedger.BalanceAdjustment;

DELETE FROM REFUNDREQUEST WHERE OrderID IN (SELECT OrderID FROM _sample_order_ids);
DELETE FROM `TRANSACTION` WHERE OrderID IN (SELECT OrderID FROM _sample_order_ids);
DELETE FROM ORDERITEM WHERE OrderID IN (SELECT OrderID FROM _sample_order_ids);
DELETE FROM ORDERS WHERE OrderID IN (SELECT OrderID FROM _sample_order_ids);
DELETE FROM CARTITEM WHERE GameID IN (SELECT GameID FROM _sample_game_ids);
DELETE FROM WISHLISTITEM WHERE GameID IN (SELECT GameID FROM _sample_game_ids);
DELETE FROM REVIEW WHERE GameID IN (SELECT GameID FROM _sample_game_ids);
DELETE FROM ACTIVATIONKEY WHERE GameID IN (SELECT GameID FROM _sample_game_ids);
DELETE FROM SALECAMPAIGN WHERE GameID IN (SELECT GameID FROM _sample_game_ids);
DELETE FROM COUPON WHERE GameID IN (SELECT GameID FROM _sample_game_ids);
DELETE FROM LICENSE WHERE GameID IN (SELECT GameID FROM _sample_game_ids);
DELETE FROM GAMEREVIEW WHERE GameID IN (SELECT GameID FROM _sample_game_ids);
DELETE FROM GAME_GENRE WHERE GameID IN (SELECT GameID FROM _sample_game_ids);
DELETE FROM GAMEVERSION WHERE GameID IN (SELECT GameID FROM _sample_game_ids);
DELETE FROM GAME WHERE GameID IN (SELECT GameID FROM _sample_game_ids);

DROP TEMPORARY TABLE _sample_order_ids;
DROP TEMPORARY TABLE _sample_game_ids;

INSERT IGNORE INTO GENRE (GenreID, GenreName, Description) VALUES
  (UUID(), 'Action', 'Game hành động'),
  (UUID(), 'Action RPG', 'Game nhập vai hành động'),
  (UUID(), 'Adventure', 'Game phiêu lưu'),
  (UUID(), 'Arcade', 'Game arcade'),
  (UUID(), 'Casual', 'Game giải trí nhẹ nhàng'),
  (UUID(), 'Classic', 'Game phong cách cổ điển'),
  (UUID(), 'Co-op', 'Game phối hợp'),
  (UUID(), 'Fighting', 'Game đối kháng'),
  (UUID(), 'Hero Shooter', 'Game bắn súng theo đội hình nhân vật'),
  (UUID(), 'Horror', 'Game kinh dị'),
  (UUID(), 'Indie', 'Game độc lập'),
  (UUID(), 'Multiplayer', 'Game nhiều người chơi'),
  (UUID(), 'Open World', 'Game thế giới mở'),
  (UUID(), 'Party', 'Game party'),
  (UUID(), 'Puzzle', 'Game giải đố'),
  (UUID(), 'Sci-fi', 'Game khoa học viễn tưởng'),
  (UUID(), 'Strategy', 'Game chiến thuật'),
  (UUID(), 'Survival', 'Game sinh tồn');

INSERT INTO GAME (
  GameID, DeveloperID, Title, Slug, Description, Price, CoverImage, TrailerUrl,
  MinSpec, RecSpec, Status, ReleaseDate
) VALUES
  ('4062f680-6ca3-4382-a191-27f44e853bcc', 'A003', 'Sudoku Classic', 'sudoku',
   'Giải các bảng Sudoku cổ điển với nhiều mức độ thử thách.', 0,
   '/api/media/games/sudoku/sudoku-cover.jpg', NULL,
   'Trình duyệt hiện đại.', 'Trình duyệt hiện đại.', 'Approved', NOW()),
  ('10abda67-23bc-4ce7-a65c-5aeb2609e915', 'A003', 'Marvel''s Spider-Man', 'spider-man',
   'Game hành động phiêu lưu với nhịp độ nhanh và các nhiệm vụ trong thành phố.', 1299000,
   '/api/media/games/spider-man/spider-man-cover.jpeg', NULL,
   'Trình duyệt hiện đại.', 'Trình duyệt hiện đại.', 'Approved', NOW()),
  ('335a42d6-86bc-461b-8be2-c2a41d6e42a9', 'A003', 'R.E.P.O.', 'repo',
   'Game kinh dị phối hợp, nơi người chơi khám phá và thu thập vật phẩm cùng đồng đội.', 149000,
   '/api/media/games/repo/repo-cover.jpg', NULL,
   'Trình duyệt hiện đại.', 'Trình duyệt hiện đại.', 'Approved', NOW()),
  ('0c604156-99c9-43c7-9418-6fe59e55ec43', 'A003', 'Dragon Ball: Sparking! ZERO', 'dragon-ball',
   'Game đối kháng hành động với các trận đấu tốc độ cao.', 1490000,
   '/api/media/games/dragon-ball/dragon-ball-cover.jpeg', NULL,
   'Trình duyệt hiện đại.', 'Trình duyệt hiện đại.', 'Approved', NOW()),
  ('2ae9b50b-5e46-4bfc-80a2-4026e4cd425f', 'A003', 'Ma Sói (Agrou - Werewolf)', 'ma-soi',
   'Game suy luận xã hội nhiều người chơi với các vai trò và chiến thuật khác nhau.', 140000,
   '/api/media/games/ma-soi/ma-soi-cover.jpeg', NULL,
   'Trình duyệt hiện đại.', 'Trình duyệt hiện đại.', 'Approved', NOW()),
  ('77af5bcf-2166-4e4b-9d0a-1c8464a79034', 'A003', 'Sky: Children of the Light', 'sky-children-of-the-light',
   'Game phiêu lưu thư giãn, khuyến khích khám phá và kết nối với người chơi khác.', 0,
   '/api/media/games/sky-children-of-the-light/sky-children-of-the-light-cover.png',
   '/api/media/games/sky-children-of-the-light/sky-children-of-the-light-trailer.mp4',
   'Trình duyệt hiện đại.', 'Trình duyệt hiện đại.', 'Approved', NOW()),
  ('a0a83077-1b60-47cd-bfe9-c0f572dd3e61', 'A003', 'Marvel Rivals: Dr. Doom', 'dr-doom-throne',
   'Game hành động góc nhìn thứ ba với các trận đấu đội hình.', 450000,
   '/api/media/games/dr-doom-throne/dr-doom-throne-cover.jpg', NULL,
   'Trình duyệt hiện đại.', 'Trình duyệt hiện đại.', 'Approved', NOW()),
  ('105c2452-1568-4112-8dad-4a845ed49054', 'A003', 'Squid Game: The Challenge', 'squid-game',
   'Game sinh tồn và party với các thử thách cạnh tranh nhiều người chơi.', 180000,
   '/api/media/games/squid-game/squid-game-cover.jpeg', NULL,
   'Trình duyệt hiện đại.', 'Trình duyệt hiện đại.', 'Approved', NOW()),
  ('6397c897-5ed9-4c01-9636-d244dc958e82', 'A003', 'Wuthering Waves', 'wuthering-waves',
   'Game nhập vai hành động thế giới mở với chiến đấu thời gian thực.', 0,
   '/api/media/games/wuthering-waves/wuthering-waves-cover.jpg',
   '/api/media/games/wuthering-waves/wuthering-waves-trailer.mp4',
   'Trình duyệt hiện đại.', 'Trình duyệt hiện đại.', 'Approved', NOW()),
  ('997cc33e-7a1e-4dbd-b0f4-63f463f909f0', 'A003', 'Genshin Impact', 'genshin-impact',
   'Game nhập vai hành động miễn phí trong thế giới mở.', 0,
   '/api/media/games/genshin-impact/genshin-impact-cover.jpeg',
   '/api/media/games/genshin-impact/genshin-impact-trailer.mp4',
   'Trình duyệt hiện đại.', 'Trình duyệt hiện đại.', 'Approved', NOW()),
  ('1f1e3734-3a06-4bad-9bd1-7d5ee19da93b', 'A003', 'Retro Snake', 'snake',
   'Game arcade cổ điển, điều khiển rắn thu thập vật phẩm và tránh va chạm.', 0,
   '/api/media/games/snake/snake-cover.jpg', NULL,
   'Trình duyệt hiện đại.', 'Trình duyệt hiện đại.', 'Approved', NOW()),
  ('77e0f14a-1617-49d1-80ab-e5cc594c8464', 'A003', 'Tetris Effect', 'tetris',
   'Game xếp hình arcade với các màn chơi theo nhịp.', 120000,
   '/api/media/games/tetris/tetris-cover.jpg', NULL,
   'Trình duyệt hiện đại.', 'Trình duyệt hiện đại.', 'Approved', NOW());

INSERT INTO GAMEVERSION (GameID, VersionNumber, BuildFile, FileSize, Sha256, ChangeLog, IsCurrent) VALUES
  ('4062f680-6ca3-4382-a191-27f44e853bcc', '1.0.0', 'developers/A003/games/4062f680-6ca3-4382-a191-27f44e853bcc/1.0.0/build.zip', NULL, NULL, 'Bản demo giả lập 1.0.0.', 1),
  ('10abda67-23bc-4ce7-a65c-5aeb2609e915', '1.0.0', 'developers/A003/games/10abda67-23bc-4ce7-a65c-5aeb2609e915/1.0.0/build.zip', NULL, NULL, 'Bản demo giả lập 1.0.0.', 1),
  ('335a42d6-86bc-461b-8be2-c2a41d6e42a9', '1.0.0', 'developers/A003/games/335a42d6-86bc-461b-8be2-c2a41d6e42a9/1.0.0/build.zip', NULL, NULL, 'Bản demo giả lập 1.0.0.', 1),
  ('0c604156-99c9-43c7-9418-6fe59e55ec43', '1.0.0', 'developers/A003/games/0c604156-99c9-43c7-9418-6fe59e55ec43/1.0.0/build.zip', NULL, NULL, 'Bản demo giả lập 1.0.0.', 1),
  ('2ae9b50b-5e46-4bfc-80a2-4026e4cd425f', '1.0.0', 'developers/A003/games/2ae9b50b-5e46-4bfc-80a2-4026e4cd425f/1.0.0/build.zip', NULL, NULL, 'Bản demo giả lập 1.0.0.', 1),
  ('77af5bcf-2166-4e4b-9d0a-1c8464a79034', '1.0.0', 'developers/A003/games/77af5bcf-2166-4e4b-9d0a-1c8464a79034/1.0.0/build.zip', NULL, NULL, 'Bản demo giả lập 1.0.0.', 1),
  ('a0a83077-1b60-47cd-bfe9-c0f572dd3e61', '1.0.0', 'developers/A003/games/a0a83077-1b60-47cd-bfe9-c0f572dd3e61/1.0.0/build.zip', NULL, NULL, 'Bản demo giả lập 1.0.0.', 1),
  ('105c2452-1568-4112-8dad-4a845ed49054', '1.0.0', 'developers/A003/games/105c2452-1568-4112-8dad-4a845ed49054/1.0.0/build.zip', NULL, NULL, 'Bản demo giả lập 1.0.0.', 1),
  ('6397c897-5ed9-4c01-9636-d244dc958e82', '1.0.0', 'developers/A003/games/6397c897-5ed9-4c01-9636-d244dc958e82/1.0.0/build.zip', NULL, NULL, 'Bản demo giả lập 1.0.0.', 1),
  ('997cc33e-7a1e-4dbd-b0f4-63f463f909f0', '1.0.0', 'developers/A003/games/997cc33e-7a1e-4dbd-b0f4-63f463f909f0/1.0.0/build.zip', NULL, NULL, 'Bản demo giả lập 1.0.0.', 1),
  ('1f1e3734-3a06-4bad-9bd1-7d5ee19da93b', '1.0.0', 'developers/A003/games/1f1e3734-3a06-4bad-9bd1-7d5ee19da93b/1.0.0/build.zip', NULL, NULL, 'Bản demo giả lập 1.0.0.', 1),
  ('77e0f14a-1617-49d1-80ab-e5cc594c8464', '1.0.0', 'developers/A003/games/77e0f14a-1617-49d1-80ab-e5cc594c8464/1.0.0/build.zip', NULL, NULL, 'Bản demo giả lập 1.0.0.', 1);

INSERT IGNORE INTO GAME_GENRE (GameID, GenreID)
SELECT game.GameID, genre.GenreID FROM GAME AS game JOIN GENRE AS genre
  ON genre.GenreName IN ('Puzzle', 'Casual') WHERE game.Slug = 'sudoku';
INSERT IGNORE INTO GAME_GENRE (GameID, GenreID)
SELECT game.GameID, genre.GenreID FROM GAME AS game JOIN GENRE AS genre
  ON genre.GenreName IN ('Action', 'Adventure') WHERE game.Slug = 'spider-man';
INSERT IGNORE INTO GAME_GENRE (GameID, GenreID)
SELECT game.GameID, genre.GenreID FROM GAME AS game JOIN GENRE AS genre
  ON genre.GenreName IN ('Horror', 'Co-op', 'Sci-fi') WHERE game.Slug = 'repo';
INSERT IGNORE INTO GAME_GENRE (GameID, GenreID)
SELECT game.GameID, genre.GenreID FROM GAME AS game JOIN GENRE AS genre
  ON genre.GenreName IN ('Fighting', 'Action') WHERE game.Slug = 'dragon-ball';
INSERT IGNORE INTO GAME_GENRE (GameID, GenreID)
SELECT game.GameID, genre.GenreID FROM GAME AS game JOIN GENRE AS genre
  ON genre.GenreName IN ('Multiplayer', 'Strategy') WHERE game.Slug = 'ma-soi';
INSERT IGNORE INTO GAME_GENRE (GameID, GenreID)
SELECT game.GameID, genre.GenreID FROM GAME AS game JOIN GENRE AS genre
  ON genre.GenreName IN ('Adventure', 'Indie', 'Casual') WHERE game.Slug = 'sky-children-of-the-light';
INSERT IGNORE INTO GAME_GENRE (GameID, GenreID)
SELECT game.GameID, genre.GenreID FROM GAME AS game JOIN GENRE AS genre
  ON genre.GenreName IN ('Hero Shooter', 'Action') WHERE game.Slug = 'dr-doom-throne';
INSERT IGNORE INTO GAME_GENRE (GameID, GenreID)
SELECT game.GameID, genre.GenreID FROM GAME AS game JOIN GENRE AS genre
  ON genre.GenreName IN ('Survival', 'Party', 'Action') WHERE game.Slug = 'squid-game';
INSERT IGNORE INTO GAME_GENRE (GameID, GenreID)
SELECT game.GameID, genre.GenreID FROM GAME AS game JOIN GENRE AS genre
  ON genre.GenreName IN ('Action RPG', 'Open World') WHERE game.Slug = 'wuthering-waves';
INSERT IGNORE INTO GAME_GENRE (GameID, GenreID)
SELECT game.GameID, genre.GenreID FROM GAME AS game JOIN GENRE AS genre
  ON genre.GenreName IN ('Action RPG', 'Open World') WHERE game.Slug = 'genshin-impact';
INSERT IGNORE INTO GAME_GENRE (GameID, GenreID)
SELECT game.GameID, genre.GenreID FROM GAME AS game JOIN GENRE AS genre
  ON genre.GenreName IN ('Arcade', 'Casual', 'Classic') WHERE game.Slug = 'snake';
INSERT IGNORE INTO GAME_GENRE (GameID, GenreID)
SELECT game.GameID, genre.GenreID FROM GAME AS game JOIN GENRE AS genre
  ON genre.GenreName IN ('Puzzle', 'Arcade') WHERE game.Slug = 'tetris';

COMMIT;
