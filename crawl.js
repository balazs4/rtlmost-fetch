const log = require('debug')('rtlmost');
const phantom = require('phantom');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const waitFor = (selector, page) =>
  new Promise(async (resolve, reject) => {
    const timeout = process.env.TIMEOUT || 5000;

    const checker = setInterval(async () => {
      const exists = await page.evaluate(function(s) {
        return document.querySelector(s) !== null;
      }, selector);
      if (exists) {
        clearInterval(checker);
        resolve();
      } else {
        log(`'${selector}' does not exist, waiting...`);
      }
    }, 500);

    const timer = setTimeout(() => {
      clearInterval(checker);
      reject(`'${selector}' did not exist after ${timeout} ms`);
    }, timeout);
  });

const getLink = async src => {
  log('Creating phantom instance');
  const instance = await phantom.create([
    '--ignore-ssl-errors=yes',
    '--load-images=no'
  ]);

  log('Creating page object');
  const page = await instance.createPage();

  log(`Opening ${src}`);
  await page.open(src);

  await waitFor('div#video-container', page);
  log('Login');
  await page.evaluate(function() {
    $(
      "div#video-container div.must-login-btns div label:contains('Belépés')"
    ).click();
    $('input#loginform-email').val('17kifli@gmail.com');
    $('input#loginform-password').val('*****');
    $('#login-form button.login-button').click();
  });

  log('Wating for <video> element');
  await waitFor('video source', page);

  log('Extracting content');
  const media = await page.evaluate(function() {
    return {
      name: $('title').text(),
      url: $('video source').attr('src'),
      icon: $('video').attr('poster')
    };
  });

  log('Closing phantom instance');
  await instance.exit();
  return media;
};

module.exports = getLink;
