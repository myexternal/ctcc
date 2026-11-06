# Ceylon Tampere CC website: notes

Built 2026-11-06. It's a static site with two pages and no build step. Open `index.html` through any web server; the 3D lion needs `http://`, not `file://`.

- `index.html`: the home page (hero with the 3D lion, team photo, road to the trophy, honours board, Division 5 leaders, three formats, club, join)
- `season.html`: Season 2026 page (results, batting leaders, every bowler in a sortable table)
- `DESIGN.md`: this club's own design system ("the honours board")

## Where the content came from
| Item | Source |
|---|---|
| Team photo, trophy and medals photo, crest | Thishan (from the club's Facebook page) |
| Founded 2026, email, practice starts January 2027, maruti = red hard tennis ball | Thishan, 2026-11-06 |
| All 10 results, Group B table, captain and vice-captain, 27 registered players, season details | Cricket Finland / CricClubs (screenshots from Thishan, 2026-11-06) |
| Batting and bowling figures | The club's two season-summary posters |
| "A home for cricket lovers in Tampere, Finland" | The club's Facebook page |
| Values (Teamwork, Respect, Passion, Community, Growth) and "Teamwork beyond borders" | The club's posters |
| 3D gold lion | Made from the crest: lion cut out, then Higgsfield image-to-3D (Tripo), gold material added in three.js |
| Ball photos (leather, red hard tennis ball, tennis ball) | **Generated placeholders** (Higgsfield). They're labelled on the page. Swap in real photos of the club's balls if you can. |

## Still to check with the club
1. **Practice details**: day, time and place in January. The Join section only says "January, Tampere" for now.
2. **Home ground**: CricClubs lists none. The site says Mustavuori Cricket Ground, where all four 2026 home league games were played. Confirm this is right.
3. **Awards night date**: it isn't shown.
4. **Bowling "best figures"**: the poster has impossible values for some players, for example "4/1" for someone with 1 wicket all season. Those show as "–". Yohan Shanaka Fernando's 1/4 was worked out from his figures (1 innings, 4 runs, 1 wicket). Check all of them against CricClubs.
5. **Squad section**: removed on 2026-11-06 at Thishan's request, because some club members didn't play in 2026. Player names now appear only in the stats on the Season page. Check the spellings there.
6. **Club paragraph**: "we welcome players whether they have years of cricket behind them or none at all" is my reading of the post ("for most of our players, this was the first time ever playing hardball"). Confirm the club wants to say this.
7. **Sponsors**: none yet. The Join section has a single "talk to us about sponsorship" line, ready for logos later.
8. **Instagram / WhatsApp**: add these if the club has them. Facebook and YouTube are linked.

## Before going live
- It needs a host and a domain. Any static host works (Netlify, Cloudflare Pages, GitHub Pages).
- The font is Mona Sans from Google Fonts.
- On older phones, check that the 3D lion drags smoothly. It renders only while it's on screen, and with reduced motion it stays still in the crest pose.
- Higgsfield cost for this build: about 13 credits (the 3D lion and four ball images).
