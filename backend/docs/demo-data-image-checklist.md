# Demo game catalog media and local seeding

The supplied cover images are bundled as public assets under `backend/assets/public/games/`.
The database stores URLs such as `/api/media/games/sudoku/sudoku-cover.jpg`.

| Slug | Cover asset | Trailer asset |
| --- | --- | --- |
| `sudoku` | `sudoku-cover.jpg` | Not supplied |
| `spider-man` | `spider-man-cover.jpeg` | Not supplied |
| `repo` | `repo-cover.jpg` | Not supplied |
| `dragon-ball` | `dragon-ball-cover.jpeg` | Not supplied |
| `ma-soi` | `ma-soi-cover.jpeg` | Not supplied |
| `sky-children-of-the-light` | `sky-children-of-the-light-cover.png` | `sky-children-of-the-light-trailer.mp4` |
| `dr-doom-throne` | `dr-doom-throne-cover.jpg` | Not supplied |
| `squid-game` | `squid-game-cover.jpeg` | Not supplied |
| `wuthering-waves` | `wuthering-waves-cover.jpg` | `wuthering-waves-trailer.mp4` |
| `genshin-impact` | `genshin-impact-cover.jpeg` | `genshin-impact-trailer.mp4` |
| `snake` | `snake-cover.jpg` | Not supplied |
| `tetris` | `tetris-cover.jpg` | Not supplied |

The supplied Sky cover is identical to the already bundled image. The three supplied trailers are bundled as public assets; their canonical URLs are written to `TrailerUrl` by the sample seed. Uploading a cover or trailer through the game create/patch multipart API stores it under `storage/public/games/<slug>/` with the canonical `<slug>-cover.<ext>` or `<slug>-trailer.<ext>` name. Permitted cover formats are JPEG, PNG, and WebP; permitted trailer formats are MP4, WebM, and MOV.

## Storage layout

- Bundled public covers: `backend/assets/public/games/<slug>/`
- Uploaded public media: `backend/storage/public/games/<slug>/`
- Private builds: `backend/storage/private/developers/<DeveloperID>/games/<GameID>/<version>/`
- Temporary uploads: `backend/storage/uploads/`

Only public media is served from `/api/media`. Game builds remain under private storage and are served through the launch-token-protected library route. Previously stored builds under `storage/builds/games/<GameID>/` are still read as a private compatibility fallback; new uploads use the developer-scoped layout.

The local filesystem adapter is the active storage implementation. The paths/object keys are isolated behind `StorageClient`, so an object-storage adapter can replace it later. Vercel deployments should not use this local filesystem for durable uploads; add a persistent object-storage adapter before deploying there.

## Seed behavior

On a **fresh** Compose database, `sql/docker_seed_games.sql` removes the repository's known old sample catalog and inserts the 12 approved catalog rows, genres, and version metadata. MySQL initialization scripts do not run again for an existing volume.

To materialize the HTML demo builds, create demo accounts, deposit funds, create sample orders and reviews, and submit one refund, run the seed script manually from the repository root after Compose is up:

```powershell
docker compose --env-file .env.docker exec `
  -e SEED_DEMO_DATA=1 `
  -e RESET_DEMO_GAMES=1 `
  -e DEMO_ACCOUNT_PASSWORD='use-a-local-password-at-least-12-characters' `
  backend npm run db:seed-demo
```

The script migrates `GAME.Slug` on an existing schema, removes only the known old sample game IDs/titles and their dependent purchases, reviews, licenses, and transactions, then restores wallet balances for deleted sample purchases before creating the new dataset. It also migrates existing game-version files and `BuildFile` keys from `storage/builds/games/<GameID>/` into the developer-scoped private layout. Missing source build files and cleanup errors are included in the command result. It aborts rather than altering a mixed order containing both a sample game and a non-sample game. It refuses to run in production and requires both explicit seed/reset flags.

The generated build is a safe HTML placeholder that says the real game content was not provided; it is not the actual commercial game. To verify the 12 build archives without connecting to MySQL:

```powershell
cd backend
npm run db:seed-demo -- --check
```
