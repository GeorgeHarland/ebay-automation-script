# eBay Automation Script

Fetches all active fixed-price listings and reduces each price by 4% (2% if over £100). Min £2

## Setup

1. Install [Node.js](https://nodejs.org)
2. Get an OAuth user token from the [eBay Developer Portal](https://developer.ebay.com), connected to your seller account
3. Create a `.env` file WITH single quotes around the token:
```
EBAY_USER_TOKEN='YOUR_TOKEN_HERE'
```
4. Install dependencies:
```
npm install dotenv fast-xml-parser
```
5. Usage:
```
node index.js
```
