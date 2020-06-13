const puppeteer = require('puppeteer');
const { expect } = require('chai');
const { assert } = require('chai');
function delay(t, val) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve(val);
    }, t);
  });
}

const loginWithGoodIdenticators = async () => {
  try {
    //const browser = await puppeteer.launch() //si on ne veux pas afficher la page web en question
    const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: false }); //pour voir directement la page s'afficher
    const page = await browser.newPage();
    await page.goto('http://localhost:8080');
    await delay(5000);

    // TEST POUR UNE BONNE CO

    //email
    await page.type('#username', 'invite', { delay: 100 });

    //password
    await page.type('#password', 'azeazeaze', { delay: 100 });

    //the selector of the "Login" button
    await page.click('#login_btn');

    //await page.waitForNavigation()
    await delay(10000);

    var test = null;
    await page.$('#identification_information').then(res => (test = res));
    //await expect(test).to.equal(null)
    assert.isNull(test, 'No error of identification');

    await browser.close();
  } catch (e) {
    console.log('main program error: ' + e);
  }
};
loginWithGoodIdenticators();

const loginWithWrongIdentificators = async () => {
  try {
    //const browser = await puppeteer.launch() //si on ne veux pas afficher la page web en question
    const browser = await puppeteer.launch({ headless: false }); //pour voir directement la page s'afficher
    const page = await browser.newPage();
    await page.goto('http://localhost:8080');
    await delay(5000);

    // TEST POUR UNE MAUVAISE CO
    //email
    await page.type('#username', 'fauxUser', { delay: 100 });

    //password
    await page.type('#password', 'fauxMdp', { delay: 100 });

    //the selector of the "Login" button
    await page.click('#login_btn');

    //await page.waitForNavigation()
    await delay(10000);

    var test = null;
    await page.$('#identification_information').then(res => (test = res));
    //await expect(test).to.equal(null)
    assert.isNotNull(test, 'Error of identification');

    await page.screenshot({ path: 'login.png' });
    await browser.close();
  } catch (e) {
    console.log('main program error: ' + e);
  }
};
loginWithWrongIdentificators();
