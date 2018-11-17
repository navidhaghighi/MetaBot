process.env.NTBA_FIX_319 = 1;
//#region constants
//#region bot_related
const { TELEGRAM_BOT_TOKEN } = process.env;
const Botgram = require('botgram');
const bot = new Botgram(TELEGRAM_BOT_TOKEN);
const Telegram = require('node-telegram-bot-api');
const teleBot = new Telegram(process.env.TELEGRAM_BOT_TOKEN);
//#endregion
//#region messages
const startMsg = 'برای شروع اسم یه فیلم,بازی یا موزیک رو تایپ کن🙂';
const searchHadNoResultMsg = 'جستجو نتیجه ای نداشت😔!';
const searchEndedMsg = 'جستجو تموم شد.🔚';
//#endregion
const name = 'نام👨';
const role = 'نقش🎬';
const credits = 'دست اندرکاران🎥';
const source = 'منبع:📃';
const date = 'تاریخ:📅';
const score = 'امتیاز:📈';
const author = 'نقد کننده:🤔';
const userReviews = 'بررسی های کاربر ها👨';
const criticReviews = 'بررسی های منتقدین🤔';
const searchState = 'پنل جستجو🔍';
const link = 'لینک صفحه💻';
const title = 'عنوان:📋';
const summary = 'خلاصه:📖';
//#endregion
var searchCategory ='Movie'; 
var results = [];
var resultCount =0;
var currentState =searchState;
var searchLimit = 5;
var metacritic = require('metacritic-scraper');

//#region my_functions

function replyCredits(credits,msgId)
{
  if((credits === undefined )|| (credits.length == 0))
  {
    teleBot.sendMessage(msgId,searchHadNoResultMsg);
    return;
  }
    //results that have been found(counter).
  let foundRes=0;
  for (let index = 0; index < credits.length; index++) {
      
    const element = credits[index];
    if((element)&&((element.name===undefined)||
      (element.credit===undefined)))
      continue;
    teleBot.sendMessage(msgId,name+' '+ element.name+
   '\n\n'+role+ '\n'+element.credit+'\n'+ link+ 
    '\n'  +'https://www.metacritic.com'+ element.url + '\n \n' );
    foundRes++;

  }
  if(foundRes==0)
    teleBot.sendMessage(msgId,searchHadNoResultMsg);
  teleBot.sendMessage(msgId,searchEndedMsg);
}

function replyCriticReviews(reviews,msgId) {
  if((reviews === undefined )|| (reviews.length == 0))
  {
    teleBot.sendMessage(msgId,searchHadNoResultMsg);
    return;
  }
    //results that have been found(counter).
  let foundRes=0;
  for (let index = 0; index < reviews.length; index++) {
    if(index>=searchLimit)
      break;
      
    const element = reviews[index];
    if((element)&&((element.source===undefined)||
      (element.author===undefined)))
      continue;
    teleBot.sendMessage(msgId,score+' '+ element.score+ ' از 100 نمره'+
   '\n\n'+source+ '\n'+element.source+'\n'+ author+ 
    '\n'  + element.author + '\n \n'+
    summary + '\n'+element.summary+ '\n \n' );
    foundRes++;

  }
  if(foundRes==0)
    teleBot.sendMessage(msgId,searchHadNoResultMsg);
  teleBot.sendMessage(msgId,searchEndedMsg);

}

function replyUserReviews(reviews,msgId) {
  if((reviews === undefined )|| (reviews.length == 0))
  {
    teleBot.sendMessage(msgId,searchHadNoResultMsg);
    return;
  }
  //results that have been found(counter).
  let foundRes=0;
  for (let index = 0; index < reviews.length; index++) {
    
    if(index>=searchLimit)
      break;
    const element = reviews[index];
    if((element)&&((element.source===undefined)||
      (element.author===undefined)))
      continue;
    teleBot.sendMessage(msgId,score+ ' '+ element.score+
     ' از 10 نمره'+'\n \n' + author+ 
    ' '  + element.author + '\n \n'+
    summary + '\n'+element.summary+ '\n \n'+ date+
    element.date +'\n' );
    foundRes++;
  }
  if(foundRes==0)
    teleBot.sendMessage(msgId,searchHadNoResultMsg);
  teleBot.sendMessage(msgId,searchEndedMsg);


}

function search(query,reply) {
 metacritic.search(query, {category: 'all',}).on('end', (results) => {
    // this assumes that the movie will be the first result
    replyResultBatch(results,reply);
    
})
}
//batch is JSON
function replyResultBatch(batch,reply) {
  if((batch === undefined )|| (batch.length == 0))
  {
    reply.markdown(searchHadNoResultMsg);
    return;
  }
  
  for (let index = 0; index < batch.length; index++) {
    if(index>=searchLimit)
      break;
      
    const element = batch[index];
    //element.type = 'Game';  
    
      results.push(element);
      //user review call back 
      let usrRvwCBack =resultCount+ 'CBACKUSR'; 
      //critics review call back
      let crtRvwCBack= resultCount + 'CBACKCRT';
      //credits callback
      let crdCBack = resultCount + 'CBACKCRD';
      let keys =[[{"text":userReviews,"callback_data":usrRvwCBack}
      ,{"text":criticReviews,"callback_data":crtRvwCBack}],
      [{"text":credits,"callback_data":crdCBack}]];
      reply.inlineKeyboard(keys);
    reply.html(title +'<strong>'+ element.title+'</strong>' + '\n'+
     summary +'\n'+ element.summary+ '\n'+ score+
    element.metascore + ' از 100 نمره'+'\n'+ link +'\n'+
    'https://www.metacritic.com/'+ element.url );
    resultCount ++;
  }
  reply.markdown(searchEndedMsg);
}

//#endregion
//#region bot_callbacks

bot.command('start',function name(msg,reply,next) {
  reply.markdown(startMsg);
})


bot.callback(function (query, next) {
  if((results===undefined)||(results.length ==0))
    return;
  let index = parseInt(query.data.substring(0,1),10);
  let element = results[index];
  let review = query.data.slice('CBACK');
  element.type = 'Movie';
  metacritic.getProduct(element).on('end', (info) => {
    if(review.includes('CRT'))
      replyCriticReviews(info.reviews.critic_reviews,query.from.id);
    else if (review.includes('USR')) replyUserReviews(info.reviews.user_reviews,query.from.id);
    else replyCredits(info.credits,query.from.id);
  })
  query.answer();
});

function onMessage(msg, reply) {
  switch (currentState) {
    case searchState:
      
      {
        search(msg.text,reply);
        break;
      }
  
    default:
      break;
  }
  
};
  

bot.text(onMessage);

//#endregion
