// Description: This file is used to test the Playwright library.
const { chromium } = require("playwright");
const fs = require("fs");

// Códigos postales de la Región de Murcia (30001 - 30999)
const codigosPostalesMurcia = ['30640','30550']

async function scrapeMercadona(codigoPostal) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto("https://tienda.mercadona.es/", {
      waitUntil: "networkidle",
    });

    // Aceptar cookies
    try {
      await page.click("scroll-block", { timeout: 5000 });
    } catch (e) {
      console.log("No se encontró el botón de cookies o ya estaban aceptadas");
    }

    // Introducir código postal
    await page.locator('#root input[type="text"]').fill(codigoPostal);
    await page.keyboard.press("Enter");

    // Esperar a que los productos sean visibles
    await page.waitForSelector(".product-cell__description-name", {
      timeout: 10000,
    });

    // Obtener nombres y precios
    const productNames = await page
      .locator(".product-cell__description-name")
      .allTextContents();

    const productPrices = await page
      .locator(".product-price__unit-price")
      .allTextContents();

    // Crear array de productos
    const productos = productNames.map((nombre, index) => ({
      nombre: nombre.trim(),
      precio: productPrices[index].trim(),
    }));

    // Guardar en archivo JSON
    const productosJSON = JSON.stringify(productos, null, 2);
    fs.writeFileSync(`productos_${codigoPostal}.json`, productosJSON);

    console.log(
      `Completado CP ${codigoPostal} - ${productos.length} productos`
    );
  } catch (error) {
    console.error(`Error en CP ${codigoPostal}:`, error);
  } finally {
    await browser.close();
  }
}

// Ejecutar para cada código postal
(async () => {
  for (const cp of codigosPostalesMurcia) {
    await scrapeMercadona(cp);
    // Esperar 2 segundos entre cada consulta para no sobrecargar el servidor
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  console.log("Proceso completado");
})().catch((error) => {
  console.error("Error general:", error);
  process.exit(1);
});
