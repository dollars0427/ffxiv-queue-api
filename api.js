const Koa = require('koa');
const koaBody = require('koa-body');
const log4js = require('koa-log4');
const request = require('request');
const Tesseract = require('tesseract.js');

const infoLogger = log4js.getLogger('info');
infoLogger.level = 'info';

const errorLogger = log4js.getLogger('error');
errorLogger.level = 'error';

const app = new Koa();
app.use(koaBody({ multipart: true }));

app.use(async ctx => {
  ctx.set('Content-Type', 'application/json; charset=utf-8');
  //接受用戶傳送的圖片，取得排隊數字
  const data = ctx.request.body;
  const files = ctx.request.files;
  const fileKey = Object.keys(files)[0];
  const filePath = files[fileKey].path;
  let queueNum = await getQueueNum(filePath);
  queueNum = cleanQueueNum(queueNum);
  //假如找不到排隊數字，判斷對方已經排上或者2002了;)
  let content = '';
  if(!queueNum){
    content = '找不到排队数字：也许已经排上了，也可能是2002了，请注意查看！';
  }else{
    //否則繼續傳送排隊數字
    content = '目前你的排队数字是：' + queueNum;
  }
  //檢查是否存在QQ號，否則報錯
  const qq = data.qq;
  if(!qq){
    ctx.body = JSON.stringify({'错误讯息' :'请提供你的QQ号码。'});
    return;
  }
  await sendMessage(qq, content);
  ctx.body = JSON.stringify(files);
});

// 呼叫Tesseract，分析图片，取得排队数字
function getQueueNum(filePath){
  return new Promise((resolve, reject) => {
    Tesseract.recognize(filePath, 'chi_sim', {tessedit_char_whitelist: '0123456789', tessedit_pageseg_mode: '7'})
      .progress(function  (p) { console.log('progress', p)  })
      .catch(err => console.error(err))
      .then(function (result) {
        resolve(result.text);
      })
  });
}
//清理及取得正确排队数字
function cleanQueueNum(queueNum){
  const cleanNum = queueNum.replace(/ /g, '').trim();
  const regax = /([0-9]+)./;
  const haveNum = cleanNum.match(regax);
  if(haveNum){
    const number = regax.exec(cleanNum)[2];
    return number;
  }
}
//传送QQ讯息
function sendMessage(targetId, content){
  const apiUrl = 'http://bot.ffneverland.site:5700/send_private_msg';
  const body = {
    message: content,
    user_id: targetId,
  };
  return new Promise((resolve, reject) => {
    const options = {
      uri: apiUrl,
      method: 'POST',
      json: body
    };
    request(options,
      function (err, response, body) {
        if(err){
          infoLogger.error(err);
          reject(err);
        }
        const result = body;
        resolve(result);
      });
    });
  }

app.listen(1000, () => {
  infoLogger.info('API is now running on port 1000 ∠( ᐛ 」∠)＿');
});
