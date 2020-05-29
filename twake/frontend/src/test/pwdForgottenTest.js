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

const pwdForgotten = async () => {
  try {
    //const browser = await puppeteer.launch() //si on ne veux pas afficher la page web en question
    const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: false }); //pour voir directement la page s'afficher
    const page = await browser.newPage();
    await page.goto('http://localhost:8080');
    await delay(5000);

    //the selector of the "Forgot password ?" button
    await page.click('#forgot_password_btn');
    await delay(5000);

    //FORGOT PASSWORD 1/4

    // email of the user
    await page.type('#email_to_recover', 'citestcitigo54@yopmail.com', { delay: 100 });

    //the selector of the "Continue" button
    await page.click('#continue3_btn');
    await delay(5000);

    //FORGOT PASSWORD ? 2/4

    // ir the user have to enter a code (received in his mailbox) -> we can't test it but we will test with an incorrect code
    await page.type('#code', '123456789', { delay: 100 });

    var test = null;
    await page.$('#invalid_code_information').then(res => (test = res));
    await expect(test).to.equal(null);
    assert.isNull(test, 'The code is valid whereas it should not!');

    //the selector of the "Continuer" button
    await page.click('#continue4_btn');
    await delay(5000);

    //FORGOT PASSWORD 3/4 AND 4/4 IMPOSSIBLE TO TEST

    // activation link by email -> impossible to check in this test

    //await page.waitForNavigation()
    await delay(5000);

    await browser.close();
  } catch (e) {
    console.log('main program error: ' + e);
  }
};
pwdForgotten();
