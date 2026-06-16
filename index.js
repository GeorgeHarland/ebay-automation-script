import { XMLParser } from 'fast-xml-parser';
import 'dotenv/config';

const NEW_PRICE_PERCENTAGE = 0.96
const EXPENSIVE_ITEM_NEW_PRICE_PERCENTAGE = 0.98
const EXPENSIVE_ITEM_THRESHOLD = 100

const TOKEN = process.env.EBAY_USER_TOKEN;
const HEADERS = {
  'X-EBAY-API-SITEID': '3', // 0 = US, 3 = UK
  'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
  'X-EBAY-API-IAF-TOKEN': TOKEN,
  'Content-Type': 'text/xml'
};

async function ebayCall(callName, body) {
  const res = await fetch('https://api.ebay.com/ws/api.dll', {
    method: 'POST',
    headers: { ...HEADERS, 'X-EBAY-API-CALL-NAME': callName },
    body
  });
  
  const text = await res.text();
  
  return new XMLParser().parse(text);
}
async function getListings() {
  const data = await ebayCall('GetMyeBaySelling', `<?xml version="1.0" encoding="utf-8"?>
    <GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <ActiveList><Include>true</Include><Pagination><EntriesPerPage>200</EntriesPerPage></Pagination></ActiveList>
      <DetailLevel>ReturnAll</DetailLevel>
    </GetMyeBaySellingRequest>`);

  const ack = data?.GetMyeBaySellingResponse?.Ack;
  const errors = data?.GetMyeBaySellingResponse?.Errors;
  console.log('Ack:', ack);
  if (errors) console.log('Errors:', JSON.stringify(errors, null, 2));

  const items = data?.GetMyeBaySellingResponse?.ActiveList?.ItemArray?.Item || [];
  
  return (Array.isArray(items) ? items : [items])
    .filter(i => i.ListingType === 'FixedPriceItem')
    .map(i => ({ itemId: i.ItemID, title: i.Title, price: parseFloat(i.BuyItNowPrice) }));
}

async function reducePrice(itemId, newPrice) {
  console.log('attempting')
  await ebayCall('ReviseFixedPriceItem', `<?xml version="1.0" encoding="utf-8"?>
    <ReviseFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <Item><ItemID>${itemId}</ItemID><StartPrice>${newPrice}</StartPrice></Item>
    </ReviseFixedPriceItemRequest>`);
  return `new price set to ${newPrice}\n--------------\n\n`;
}

async function main() {
  console.log('Fetching listings...');
  const listings = await getListings();

  console.log(`Found ${listings.length} total listings\n`);

  for (const n of listings) {
    console.log(n.title);
    console.log('price: ' + n.price);

    if(price < 2.00) {
      console.log('Price already under £2, skipping. ')
      continue
    }

    const pricePercentage = (n.price > EXPENSIVE_ITEM_THRESHOLD) ? EXPENSIVE_ITEM_NEW_PRICE_PERCENTAGE : NEW_PRICE_PERCENTAGE

    const newPrice = (n.price * pricePercentage).toFixed(2);

    try {
      console.log(await reducePrice(n.itemId, newPrice));
    } catch (e) {
      console.error(`Failed on ${n.itemId}: ${e.message}`);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);