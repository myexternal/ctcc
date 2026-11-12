# Connecting the kit order and membership forms

Until this is done, `kit.html` and `join.html` run in **demo mode**: a yellow banner says so, and anything people send stays in their own browser. **Don't announce the forms until they're connected.**

Everything runs on the club's own Google account (free). Orders and members land in a Google Sheet, and the club gets an email for each one. It takes about 15 minutes.

## 1. Create the sheet and the script
1. Sign in to Google as **ceylontamperecricket@gmail.com**.
2. Create a new Google Sheet and call it `CTCC orders and members`.
3. In the sheet, open **Extensions → Apps Script**.
4. Delete the code that's there, paste in everything from `backend/Code.gs`, and click **Save**.
5. Check the `SETTINGS` block at the top. The prices, fees, number range and blocked numbers must match `js/config.js`. The script works out every total itself, so a visitor can't change a price in their browser.

## 2. Allow it and create the tabs
1. In the toolbar's function menu, choose `setup` and click **Run**.
2. Google asks for permission. Choose the club account, then **Advanced → Go to (project name)** and **Allow**. It asks because the script is the club's own and isn't published by Google. It needs to edit this sheet and send email.
3. The sheet now has three tabs: **Numbers**, **Orders** and **Members**.

## 3. Publish it as a web app
1. Click **Deploy → New deployment**, then the gear icon, then **Web app**.
2. **Execute as:** Me. **Who has access:** Anyone. (Visitors have to be able to send the form without a Google login. They can't see the sheet.)
3. Click **Deploy** and copy the **Web app URL**. It ends in `/exec`.

## 4. Connect the website
1. Open `js/config.js` and paste the URL between the quotes after `SCRIPT_URL:`.
2. Fill in the payment details you want to offer (see below). Any option left empty is hidden.
3. When the committee has agreed prices and fees, change them in **both** `js/config.js` and the `SETTINGS` in the script, then set `PRICES_CONFIRMED: true`. The "example prices" notes then disappear.
4. Zip the site and upload it to Render as usual.
5. Test it: place a kit order and a membership sign-up with your own email. Both should appear in the sheet, and you should get the emails.

If you change the script later: **Deploy → Manage deployments → pencil icon → Version: New version → Deploy**. The URL stays the same.

## How shirt numbers work
- A number is reserved the moment an order is saved. The script handles one order at a time, so two people can never get the same number, even if they press the button in the same second.
- One number per email address. Ordering again with the same email keeps the same number.
- "Pick a free number for me" gives the lowest free number.
- **To release a number:** delete its row in the **Numbers** tab.
- **To keep a number for someone without an order:** add a row in **Numbers** with the number and their name, and leave the email empty.
- **To retire a number for everyone:** add it to `blocked` in `js/config.js` and to `BLOCKED` in the script.
- The website only ever receives the list of taken numbers, never names or emails.

## Payments
The website can't take card payments by itself, so it offers whichever of these the club sets up in `js/config.js`:

| Option | What you need | Where it goes in config.js |
|---|---|---|
| Bank transfer | The club's bank account (IBAN). Every member gets a Finnish reference number (viitenumero), so payments are easy to match on the bank statement. | `payment.bank` |
| MobilePay | A MobilePay number or box for the club | `payment.mobilepay.number` |
| Card, Apple Pay, Google Pay | A free Stripe account. Create one **Payment Link** per membership tier and paste each link in. Stripe charges a fee per payment. | `payment.stripe` |

The member ID is attached to each Stripe payment, so you can match it in the Stripe dashboard. Mark payments as received in the **Paid** column of the sheet.

Kit orders don't ask for payment straight away: the page says the club will confirm the order and how to pay first. That way nobody pays before the kit maker's prices are final.

## Privacy
The sheet holds members' names, emails, phone numbers and years of birth. Share it only with committee members who need it. The sign-up form tells members the club keeps their details in its member register and only shares them with Cricket Finland when registering players. If that isn't true for the club, change the sentence in `join.html`.

## Limits
Google lets a free account send a limited number of emails per day (around 100). A failed email never loses an order; it's still saved in the sheet.
