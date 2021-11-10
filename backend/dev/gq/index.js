const {api} = require('../../bundle/src/api/index');
const fs = require('fs');

exports.handler = async function (req, res, next) {

  if(req.method === 'OPTIONS'){
    return res.status(100).end();
  } else if (req.method === 'GET'){
    return res
      .status(200)
      .set('Content-type', 'text/html')
      .end(fs.readFileSync(__dirname + '/index.html'));
  }

  req.accountID = 1;

	api(req, res, next);
}
