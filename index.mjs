const https = require('https');
const cheerio = require('cheerio')
function getMenu(url) {
    if (!url || url === "No disponible" || url.startsWith("http://")) return
    let fixed = url
    if(!url.startsWith("https://")) fixed = "https://" + url
    https.get(fixed, (response) => {
        let data = '';

        response.on('data', chunk => {
            data += chunk;
        });

        response.on('end', () => {
            const $ = cheerio.load(data);


            const menu = [];

            $('a').each((index, element) => {
                const text = $(element).text().toLowerCase();
                if (text.includes('menu') 
                    ||text.includes('menú') 
                    || text.includes('carta') 
                    || text.includes('comida')
                    || text.includes('comidas')
                    || text.includes('servicio')
                    || text.includes('platos')
                    || text.includes('precios')
                ) {
                    let href = $(element).attr('href')
                    if(!href) return 
                    let fixedHref = `${href}`
                    if(!fixedHref.startsWith("https://") || !fixedHref.startsWith("http://")) fixedHref = fixed + href
                    menu.push({
                        text: $(element).text(),
                        href: fixedHref 
                    });
                }
            });

            if (menu.length > 0) {
                menu.forEach(item => {
                    // console.log(item.href);
                });
            } 
        });
    }).on('error', (error) => {
    });
}


async function getRestaurants(limit = 10) {
    const query = `
        [out:json];
        area[name="Montevideo"]->.searchArea;
        (
            node["amenity"="restaurant"](area.searchArea);
            way["amenity"="restaurant"](area.searchArea);
            relation["amenity"="restaurant"](area.searchArea);
        );
        out center;
    `;

    const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

    try {
        const response = await fetch(url);
        const data = await response.json();

        const restaurants = data.elements.map(el => {
            const { lat, lon, center, tags } = el;
            const name = tags?.name || "Desconocido";
            const cuisine = tags?.cuisine || "No especificado";
            const website = tags?.website || null;
            const urlDomain = website ? website : "No disponible";
            const street = tags?.["addr:street"] || "Desconocida";
            const houseNumber = tags?.["addr:housenumber"] || "No disponible";
            const city = tags?.["addr:city"] || "Montevideo";
            const postcode = tags?.["addr:postcode"] || "No disponible";
            const phone = tags?.["contact:phone"] || "No disponible";
            const openingHours = tags?.["opening_hours"] || "No especificado";
            const priceRange = tags?.["price_range"] || "No especificado";
            const outdoorSeating = tags?.["outdoor_seating"] || "No especificado";
            const wifi = tags?.["wifi"] || "No especificado";

            return {
                id: el.id,
                name,
                cuisine,
                lat: lat || center?.lat,
                lon: lon || center?.lon,
                url: urlDomain,
                address: `${houseNumber} ${street}, ${city}, ${postcode}`,
                phone,
                openingHours,
                priceRange,
                outdoorSeating,
                wifi
            };
        });


        return restaurants;
    } catch (error) {
        console.error(error);
    }
}

getRestaurants().then((val) => {
    console.log(val)
    // val.map(res => {
    //     return getMenu(res.url)
    // })
})
