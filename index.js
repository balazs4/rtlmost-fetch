const log = require('debug')('rtlmost');
const moment = require('moment');
const request = require('request-promise-native');
const crawl = require('./crawl');
const sources = require('./links');

const main = async (id, day) => {
  log(`Looking for ${id}, ${day}`);
  const endpoint = `${process.env.DB}/${id}-${day}`;
  const { statusCode } = await request(endpoint, {
    json: true,
    simple: false,
    resolveWithFullResponse: true
  });
  if (statusCode === 200) {
    log('Already exists');
    return;
  }

  const src = sources[id](day);
  const item = await crawl(src);
  const result = Object.assign({}, item, { src, tags: [id] });

  result['url'] = result['url'].replace(
    /http:\/\/smooth\.edge\d\w+\.rtl\.hu/,
    process.env.PROXY
  );
  log(`Result ${JSON.stringify(result)}`);

  const post = await request(endpoint, {
    method: 'POST',
    json: true,
    body: result
  });
  log(JSON.stringify(post));
  log(`Inserted ${endpoint}`);
};

const [_, __, id, day = moment().format('YYYY-MM-DD')] = process.argv;
main(id, day).then(() => process.exit(0)).catch(err => {
  console.log(err);
  process.exit(-1);
});
