USE steam_store;

INSERT INTO GAME (
  GameID, DeveloperID, Title, Description, Price, CoverImage, TrailerUrl,
  MinSpec, RecSpec, Status, ReleaseDate
) VALUES
  (
    'bac4ae9f-ff75-4686-9ba9-adcdf3df5e43', 'A003', 'Xếp Gạch Tetris',
    'Classic HTML5 Canvas block-stacking puzzle game.', 10000, '',
    NULL, 'Modern browser with HTML5 support.', 'Modern browser with HTML5 support.',
    'Approved', NOW()
  ),
  (
    '87921b9e-4614-4237-aefa-53fe2fe5e559', 'A006', 'Rắn Săn Mồi Cổ Điển',
    'Classic HTML5 Canvas snake game focused on reflex and score.', 19000, '',
    NULL, 'Modern browser with HTML5 support.', 'Modern browser with HTML5 support.',
    'Approved', NOW()
  ),
  (
    '35447c3c-fe6e-4120-8cb7-10ca5efc1abb', 'A007', 'Sudoku Trí Tuệ',
    'HTML5 Sudoku number-placement puzzle game.', 0, '',
    NULL, 'Modern browser with HTML5 support.', 'Modern browser with HTML5 support.',
    'Approved', NOW()
  );

INSERT INTO GAMEVERSION (
  GameID, VersionNumber, BuildFile, FileSize, Sha256, ChangeLog, IsCurrent
) VALUES
  (
    'bac4ae9f-ff75-4686-9ba9-adcdf3df5e43', '1.0.0',
    'games/bac4ae9f-ff75-4686-9ba9-adcdf3df5e43/1.0.0/build.zip',
    7630, 'e697c4ab0b8af144ca614359e42ab877ddfe27cc55d24f47e295feaa5e308431',
    'Initial release.', 1
  ),
  (
    '87921b9e-4614-4237-aefa-53fe2fe5e559', '1.0.0',
    'games/87921b9e-4614-4237-aefa-53fe2fe5e559/1.0.0/build.zip',
    7003, '1f4dae663cf9e5239c8f0af51d9671417b5c3efb4e8272594bada05357395cfb',
    'Initial release.', 0
  ),
  (
    '87921b9e-4614-4237-aefa-53fe2fe5e559', '1.1.0',
    'games/87921b9e-4614-4237-aefa-53fe2fe5e559/1.1.0/build.zip',
    7689, 'f38bd93ad491ef319154256a234514becb1868a5cd67eae708b235fe088cae9e',
    'Cập nhật giao diện Rắn Đỏ Neon, mồi Vàng và bổ sung chế độ Xuyên tường (Wrap-Around).', 1
  ),
  (
    '35447c3c-fe6e-4120-8cb7-10ca5efc1abb', '1.0.0',
    'games/35447c3c-fe6e-4120-8cb7-10ca5efc1abb/1.0.0/build.zip',
    7501, '9fea175df964d59b7ed3e4d6432b84027bbb3c36cee2ea553882279f027c0c52',
    'Initial release.', 1
  );

INSERT INTO GAME_GENRE (GameID, GenreID) VALUES
  ('bac4ae9f-ff75-4686-9ba9-adcdf3df5e43', 'GN05'),
  ('bac4ae9f-ff75-4686-9ba9-adcdf3df5e43', 'GN11'),
  ('87921b9e-4614-4237-aefa-53fe2fe5e559', 'GN11'),
  ('35447c3c-fe6e-4120-8cb7-10ca5efc1abb', 'GN05');

INSERT INTO SALECAMPAIGN (GameID, PercentOff, StartDate, EndDate)
VALUES ('bac4ae9f-ff75-4686-9ba9-adcdf3df5e43', 100, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY));
