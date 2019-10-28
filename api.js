const Koa = require('koa');
const koaBody = require('koa-body');
const log4js = require('koa-log4');
const Tesseract = require('tesseract.js');

const infoLogger = log4js.getLogger('info');
infoLogger.level = 'info';

const errorLogger = log4js.getLogger('error');
errorLogger.level = 'error';

const app = new Koa();
app.use(koaBody({ multipart: true }));

app.use(async ctx => {
  const files = ctx.request.files;
  const fileKey = Object.keys(files)[0];
  const filePath = files[fileKey].path;
  let queueNum = await getQueueNum(filePath);
  queueNum = checkQueueNum(queueNum);
  console.log(queueNum);
  ctx.set('Content-Type', 'application/json; charset=utf-8');
  ctx.body = JSON.stringify(files);
});

function getQueueNum(filePath){
  return new Promise((resolve, reject) => {
    Tesseract.recognize(filePath)
      .progress(function  (p) { console.log('progress', p)  })
      .catch(err => console.error(err))
      .then(function (result) {
        resolve(result.text);
      })
  });
}

function checkQueueNum(queueNum){
  const regax = /([0-9]+)./;
  const haveNum = queueNum.match(regax);
  if(haveNum){
    const number = regax.exec(queueNum)[1];
    return number;
  }
}

app.listen(1000, () => {
  infoLogger.info('API is now running on port 1000 ∠( ᐛ 」∠)＿');
});
