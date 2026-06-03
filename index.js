import { XMLParser } from 'fast-xml-parser';
import 'dotenv/config';

const TOKEN = process.env.EBAY_USER_TOKEN;
const HEADERS = {
  'X-EBAY-API-SITEID': '3',
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
  return `new price set to ${newPrice}\n`;
}

async function main() {
  console.log('Fetching listings...');
  const listings = await getListings();

  console.log(`Found ${listings.length} total listings\n`);

  for (const n of listings) {
    console.log(n.title);
    console.log('price: ' + n.price);

    const newPrice = Math.max(0.99, n.price * 0.98).toFixed(2);

    await new Promise(r => setTimeout(r, 1000));
    
    console.log(await reducePrice(n.itemId, newPrice));
  }

  console.log('\nDone!');
}

main().catch(console.error);