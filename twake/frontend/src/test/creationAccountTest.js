const puppeteer = require('puppeteer');
const { expect } = require('chai');
const { assert } = require('chai');
var path = require('path');

function delay(t, val) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve(val);
    }, t);
  });
}

const creationAccount = async () => {
  try {
    console.log('ça à l' + 'air de marcher');
    //const browser = await puppeteer.launch() //si on ne veux pas afficher la page web en question
    //const browser = await puppeteer.launch({args: [ '--no-sandbox' ], headless:false}); //pour voir directement la page s'afficher
    const browser = await puppeteer.launch({ args: ['--no-sandbox'], headless: false });

    const page = await browser.newPage();
    await page.goto('http://localhost:8080');
    await delay(5000);

    //CREATE A NEW ACCOUNT 1/3

    //the selector of the "Créer un compte" button
    await page.click('#create_btn');

    // name of the futur user
    await page.type('#username_create', 'new_name', { delay: 100 });

    // email of the futur user
    await page.type('#email_create', 'citestcitigo54@yopmail.com', { delay: 100 });

    //password of the futur user
    await page.type('#password_create', 'new_password', { delay: 100 });

    //the selector of the "Continuer" button
    await page.click('#continue_btn');

    await delay(5000);

    //CREATE A NEW ACCOUNT 2/3

    // last name of the futur user
    await page.type('#lastname_create', 'new_lastname', { delay: 100 });

    // first name of the futur user
    await page.type('#firstname_create', 'new_firstname', { delay: 100 });

    // phone number of the futur user
    await page.type('#phone_number_create', '0658483200', { delay: 100 });

    //the selector of the "Continuer" button
    await page.click('#continue2_btn');

    //CREATE A NEW ACCOUNT 3/3

    // activation link by email -> impossible to check in this test

    //NB : pas vraiment de tests à faire ici puisqu'aucun message d'erreur n'a été implémenté

    //await page.waitForNavigation()
    await delay(5000);
    console.log('yes!!!!!!');
    await browser.close();
  } catch (e) {
    console.log('main program error: ' + e);
  }
};
creationAccount();
