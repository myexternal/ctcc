# Ceylon Tampere CC website: notes

Built 2026-11-06, extended 2026-11-12. It's a static site with six pages and no build step. Open `index.html` through any web server; the 3D lion needs `http://`, not `file://`.

- `index.html`: the home page (hero with the 3D lion, team photo, road to the trophy, honours board, Division 5 leaders, links to the club pages, club, join)
- `club.html`: vision, mission, chairperson's message, committee
- `squad.html`: 2026 captain and vice-captain, and the squad A to Z
- `season.html`: Season 2026 page (results, batting leaders, every bowler in a sortable table)
- `kit.html`: kit order with shirt-number reservation (no duplicates), sizes and quantities
- `join.html`: membership sign-up, member ID, reference number and payment options
- `js/config.js`: prices, fees, sizes, payment details and the form connection. `SETUP.md` explains how to connect the forms; `backend/Code.gs` is the Google Apps Script.
- The site is hardball only (maruti ball and tennis ball removed on 2026-11-12, at the club's request).
- `DESIGN.md`: this club's own design system ("the honours board")

## Where the content came from
| Item | Source |
|---|---|
| Team photo, trophy and medals photo, crest | Thishan (from the club's Facebook page) |
| Founded 2026, email, practice starts January 2027 | Thishan, 2026-11-06 |
| All 10 results, Group B table, captain and vice-captain, 27 registered players, season details | Cricket Finland / CricClubs (screenshots from Thishan, 2026-11-06) |
| Batting and bowling figures | The club's two season-summary posters |
| Squad: 17 players from the 2026 stats, plus Kishan Kavinda, Amith Karunarathna and Malaka Chathuranga Wevita Vidhanalage Don from their CricClubs player pages (via search results; CricClubs blocks direct access) | 2026-11-12 |
| Vision, mission, chairperson's message | Written by Claude on 2026-11-12 for the club to edit |
| Committee (6 people) and the chairperson's name | **Placeholder names**, labelled on the page |
| "A home for cricket lovers in Tampere, Finland" | The club's Facebook page |
| Values (Teamwork, Respect, Passion, Community, Growth) and "Teamwork beyond borders" | The club's posters |
| 3D gold lion | Made from the crest: lion cut out, then Higgsfield image-to-3D (Tripo), gold material added in three.js |

## Still to check with the club
1. **Practice details**: day, time and place in January. The Join section only says "January, Tampere" for now.
2. **Home ground**: CricClubs lists none. The site says Mustavuori Cricket Ground, where all four 2026 home league games were played. Confirm this is right.
3. **Awards night date**: it isn't shown.
4. **Bowling "best figures"**: the poster has impossible values for some players, for example "4/1" for someone with 1 wicket all season. Those show as "–". Yohan Shanaka Fernando's 1/4 was worked out from his figures (1 innings, 4 runs, 1 wicket). Check all of them against CricClubs.
5. **Squad page** (2026-11-12): 20 of the 27 registered players. The other 7 need the full CricClubs squad list. Check spellings, and name the 2027 captains when chosen.
6. **Club paragraph**: "we welcome players whether they have years of cricket behind them or none at all" is my reading of the post ("for most of our players, this was the first time ever playing hardball"). Confirm the club wants to say this.
7. **Sponsors**: none yet. The Join section has a single "talk to us about sponsorship" line, ready for logos later.
8. **Instagram / WhatsApp**: add these if the club has them. Facebook and YouTube are linked.

9. **Committee**: the chairperson is Sharada Jayaweera (confirmed 2026-11-12); the other five names are placeholders. The chairperson's message was written by Claude and should be checked by Sharada. Replace them with the real committee and remove the "Placeholder names" tags in `club.html`.
10. **Kit items, prices and membership fees**: examples in `js/config.js` (and `backend/Code.gs`). Pages say "example" until `PRICES_CONFIRMED` is true.
11. **Forms**: in demo mode until the Apps Script is connected (see `SETUP.md`). Payment details (IBAN, MobilePay, Stripe links) are empty.

## Before going live
- It needs a host and a domain. Any static host works (Netlify, Cloudflare Pages, GitHub Pages).
- The font is Mona Sans from Google Fonts.
- Link preview: `media/share.jpg` (crest on navy, 1200×630). Both pages point to it with the full URL on https://ctcc-p6n1.onrender.com/. **If the site moves to its own domain, change those URLs in both pages** (search for onrender.com).
- On older phones, check that the 3D lion drags smoothly. It renders only while it's on screen, and with reduced motion it stays still in the crest pose.
- Higgsfield cost for the first build: about 13 credits (the 3D lion and ball images; the ball images were removed on 2026-11-12).
